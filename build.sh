#!/bin/bash

dir_pkg="pkg/"
dir_pkgcfg=$dir_pkg"cfg/"
dir_min="min/"
dir_tparty="thirdparty/"
dir_theme="theme/"

# check_installed checks if a command is available
check_installed() {
	if ! $(command -v $1 > /dev/null 2>&1); then
		echo "Error: "$1" is not installed."
		exit
	fi
}


# Install bourbon if not installed in thirdparty/bourbon/
if [ ! -d $dir_tparty"bourbon" ]; then
	cd $dir_tparty
	check_installed gem
	if ! $(command -v bourbon > /dev/null 2>&1); then
		if [[ "$(which gem)" =~ "^$HOME" ]]; then
			gem install bourbon
		else
			sudo gem install bourbon
		fi
	fi
	bourbon install
	cd - > /dev/null
fi

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
		third_party_done=(${third_party_done[@]} false)
	done
}
get_thirdparty_list

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
		if [[ $f == *"."$2 ]]; then
			if [[ $f != *".min.js" ]]; then
				mf=${f/%".js"/".min.js"}
			fi
			if [ "$f" = "$1" ] || [ "$mf" = "$1" ]; then
				if ${third_party_done[$i]}; then
					return
				fi
				echo "- Updating: "$f
				cd $dir_tparty
				wget -Nnv "$url"
				if [[ $mf > "" ]]; then
					if [ $f -nt $mf ]; then
						echo "- Minifying: "$f
						yui-compressor $f > $mf
					fi
				fi
				third_party_done[$i]=true
				cd ..
				return
			fi
		fi
		mf=""
		i=$(( $i + 1 ))
	done
}

if [ ! -d $dir_min ]; then
	mkdir $dir_min
fi

minify_js () {
	local f
	local mf
	for f in *.js; do
		mf=$dir_min${f/%".js"/".min.js"}
		if [ $f -nt $mf ]; then
			echo "- Minifying: "$f
			yui-compressor --type js $f > $mf
		fi
	done
}
# For all non-minified js files
minify_js


themes=()
get_themes () {
	local t
	for t in $dir_theme*; do
		t=${t##*/}
		if [ "$t" != "common.scss" ]; then
			themes=("${themes[@]}" "${t%%.*}")
		fi
	done
}
minify_scss () {
	local f
	local mf
	local cf
	local t
	local tf
	for f in *.scss; do
		for t in ${themes[@]}; do
			mf=$dir_min$t.${f/%".scss"/".min.css"}
			if [ $f -nt $mf ] || [ $dir_theme$t".scss" -nt $mf ] || [ $dir_theme"common.scss" -nt $mf ]; then
				echo "- Minifying: $f ($t)"
				tf=${f/%".scss"/".$t.scss"}
				cf=${f/%".scss"/".$t.css"}
				cat $dir_theme"common.scss" $dir_theme$t".scss" $f > $tf
				sass --trace --style compressed $tf $cf -r $dir_tparty/bourbon/lib/bourbon.rb
				yui-compressor --type "css" $cf > $mf
				rm $tf $cf
			fi
		done
	done
}
get_themes
minify_scss


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
	if [ ! -f $1 -a -f $dir_min$n".min.js" ]; then
		if $(check $1); then
			return
		fi
		if [ -f $dir_min$n".min.js" ]; then
			if [ $dir_min$n".min.js" -nt $dir_pkg$2".min.js" ]; then
				changed=$1
			fi
		fi
		checked=("${checked[@]}" "$1")
	elif [ -f $1 ]; then
		for l in $(cat $1); do
			compilechk $l $2
		done
	fi
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
	elif [ ! -f $1 -a -f $dir_min$n".min.js" ]; then
		if [ -f $dir_min$n".min.js" ]; then
			cat $dir_min$n".min.js" >> $dir_pkg$2".min.js"
			echo -e "\n" >> $dir_pkg$2".min.js"
		fi
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
			if [ ! -f $dir_min$t.$1.min.css ]; then
				return
			fi
			checked=("${checked[@]}" "$1")
			if [ $dir_min$t.$1.min.css -nt $dir_pkg$t.$2.min.css ]; then
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
			if [ ! -f $dir_min$t.$1.min.css ]; then
				return
			fi
			if [ ${#checked[@]} = 0 ]; then
				cat "HEADER" > $dir_pkg$t.$2.min.css
				echo "- Compiled: $dir_pkg$t.$2.min.css"
			fi
			cat $dir_min$t.$1.min.css >> $dir_pkg$t.$2.min.css
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
