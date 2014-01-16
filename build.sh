#!/bin/bash

## WookBar build script
## Author:	Seon-Wook Park (www.swook.net)
## License:	CC BY-NC-SA

##
# Define and create required directories
##

dir_src="src/"
dir_pkg="pkg/"
dir_pkgcfg=$dir_pkg"cfg/"
dir_tmp="tmp/"
dir_tparty="thirdparty/"
dir_theme="theme/"

# Create temporary directory for minified scripts
# and sass cache files
if [ ! -d $dir_tmp ]; then
	mkdir $dir_tmp
fi


##
# Check for required commands and install required gems
##

# check_installed checks if a command is available
check_installed() {
	if ! $(command -v $1 > /dev/null 2>&1); then
		echo "Error: "$1" is not installed."
		exit
	fi
}

# Check command dependencies
check_installed gem

# Install required node module
install_npm() {
	# If command exists, return
	if $(command -v $1 > /dev/null 2>&1); then
		return
	fi

	cd $HOME
	npm install $1
	cd -
}

install_npm uglifyjs
install_npm yuicompressor

# Install required ruby gem depending on whether is local installation
install_gem() {
	# If command exists, return
	if $(command -v $1 > /dev/null 2>&1); then
		return
	fi

	# If not, install gem
	if [[ "$(which gem)" =~ "^$HOME" ]]; then
		# Ruby is user installation. No need for sudo
		gem install $1
	else
		# Ask for password if gem is not local installation
		echo "Note: root access required to install $1"
		sudo gem install $1
	fi
}

# Install sass if not installed
install_gem sass
install_gem bourbon

# Install local bourbon if not installed
if [ ! -d bourbon/ ]; then
	bourbon install
fi


##
# Gather list of required third party scripts
##

# Parse list of third party scripts into array
third_party_url=()
third_party_done=()
get_thirdparty_list () {
	local url
	local f
	for url in $(cat $dir_tparty"list"); do
		if [ "${url:0:1}" = "#" ]; then
			continue
		fi
		third_party_url=("${third_party_url[@]}" "$url")
		third_party_done=(${third_party_done[@]} "0")
	done
}
get_thirdparty_list



##
# Minify Javascript files
##

minify_js () {
	local f
	local n
	local mf
	for f in $dir_src*.js; do
		n=${f##*/}
		mf=$dir_tmp${n/%".js"/".min.js"}
		if [ $f -nt $mf ]; then
			echo "- Minifying: "$n
			uglifyjs -o $mf $f
		fi
	done
}
# For all non-minified js files
minify_js



##
# Minify CSS files with available themes
##

themes=()
get_themes () {
	local t
	for t in $dir_theme*.scss; do
		t=${t##*/}
		if [ "$t" != "common.scss" ]; then
			themes+=("${t%%.*}")
		fi
	done
}
minify_scss () {
	local f
	local n
	local mf
	local cf
	local t
	local tf
	for f in $dir_src*.scss; do
		n=${f##*/}
		for t in ${themes[@]}; do
			mf=$dir_tmp${n/%".scss"/"."$t".min.css"}
			if [ $f -nt $mf ] || [ $dir_theme$t".scss" -nt $mf ] || [ $dir_theme"common.scss" -nt $mf ]; then
				echo "- Minifying: $n ($t)"
				tf=${f/%".scss"/".$t.scss"}
				cf=${f/%".scss"/".$t.css"}
				cat $dir_theme"common.scss" $dir_theme$t".scss" $f > $tf
				sass --trace --cache-location $dir_tmp".sass-cache" --style compressed $tf $cf
				yuicompressor --type "css" $cf > $mf
				rm $tf $cf
			fi
		done
	done
}
get_themes
minify_scss



##
# Compile required files for each package
# respecting dependencies listed in pkg/cfg/
##

checked=()
changed=""

check() {
	local c
	for c in "${checked[@]}"; do
		if [ "$c" == "$1" ]; then
			echo true
			return
		fi
	done
	echo false
}

compilechk () {
	local n=$1
	n=${n##*/}
	if [[ ("$1" == "$2") || (! -f $dir_pkgcfg$n) ]] && [[ -f $dir_tmp$n".min.js" ]]; then
		if $(check $1); then
			return
		fi
		if [ $dir_tmp$n".min.js" -nt $dir_pkg$2".min.js" ]; then
			changed=$1
		fi
		checked=("${checked[@]}" "$1")
	elif [ -f $1 ]; then
		for l in $(cat $1); do
			compilechk $l $2
		done
	fi
}

# Update/Download third party script if not done yet
update_thirdparty () {
	if [ ! $1 ]; then
		return
	fi

	# Update all third party files
	local i=0
	local n=${#third_party_url[@]}
	local f
	local mf
	local output

	while [ $i -lt $n ]; do
		url=${third_party_url[$i]}
		f=${url##*/}

		# If script not minified
		if [[ $f != *".min.js" ]]; then
			mf=${f/%".js"/".min.js"}
		fi
		if [ "$f" = "$1" ] || [ "$mf" = "$1" ]; then
			if [ "${third_party_done[$i]}" = "1" ]; then
				return
			fi
			echo "- Updating: "$f
			cd $dir_tparty
			wget -Nnv "$url"
			if [[ $mf > "" ]]; then
				if [ $f -nt $mf ]; then
					echo "- Minifying: "$f
					yuicompressor $f > $mf
				fi
			fi
			third_party_done[$i]="1"
			cd ..
			return
		fi
		mf=""
		i=$(( $i + 1 ))
	done
}

compile () {
	local n=$1
	n=${n##*/}
	if $(check $1); then
		return
	fi
	if [[ $1 == $dir_tparty* ]]; then
		update_thirdparty $n".min.js"
		cat $dir_tparty$n".min.js" >> $dir_pkg$2".min.js"
		echo -e "\n" >> $dir_pkg$2".min.js"
		checked=("${checked[@]}" "$1")
	elif [[ ("$1" == "$2") || (! -f $dir_pkgcfg$n) ]] && [[ -f $dir_tmp$n".min.js" ]]; then
		cat $dir_tmp$n".min.js" >> $dir_pkg$2".min.js"
		echo -e "\n" >> $dir_pkg$2".min.js"
		checked=("${checked[@]}" "$1")
	elif [ -f $1 ]; then
		for l in $(cat $1); do
			compile $l $2
		done
	fi
}

compilechk_css () {
	if $(check $1); then
		return
	fi
	if [[ $1 == $dir_pkgcfg* ]]; then
		for l in $(cat $1); do
			if [[ $(compilechk_css $l $2) == true ]]; then
				echo true
				return
			fi
		done
	else
		local t
		if $(check $1); then
			return
		fi
		for t in ${themes[@]}; do
			if [ ! -f $dir_tmp$1.$t.min.css ]; then
				return
			fi
			checked=("${checked[@]}" "$1")
			if [ $dir_tmp$1.$t.min.css -nt $dir_pkg$2.$t.min.css ]; then
				echo true
				return
			fi
		done
	fi
}

compile_css () {
	if $(check $1); then
		return
	fi
	if [[ $1 == $dir_pkgcfg* ]]; then
		for l in $(cat $1); do
			compile_css $l $2
		done
	else
		local t
		if $(check $1); then
			return
		fi
		for t in ${themes[@]}; do
			if [ ! -f $dir_tmp$1.$t.min.css ]; then
				return
			fi
			if [ ${#checked[@]} = 0 ]; then
				cat "HEADER" > $dir_pkg$2.$t.min.css
				echo "- Compiled: $dir_pkg$2.$t.min.css"
			fi
			cat $dir_tmp$1.$t.min.css >> $dir_pkg$2.$t.min.css
		done
		checked=("${checked[@]}" "$1")
	fi
}

compile_packages () {
	# For all config files
	local f
	local mf
	local t
	local l
	local n
	for f in $dir_pkgcfg*; do
		# Target package output
		n=${f##*/}
		mf=$dir_pkg$n".min.js"

		## Javascript
		# Check if update needed
		checked=()
		changed=""
		compilechk $f $n

		if [[ "$changed" > "" ]]; then
			# Clear and attach header to package
			cat "HEADER" > $mf

			# Compile dependencies
			checked=()
			compile $f $n
			echo "- Compiled: "$mf
		fi

		## CSS
		checked=()
		if [[ $(compilechk_css $f $n) == true ]]; then
			# Compile dependencies
			checked=()
			compile_css $f $n
		fi
	done
}
compile_packages
