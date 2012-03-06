#!/bin/bash

third_party_url=()
third_party_done=()
get_thirdparty_list () {
	cd thirdparty/
	local url
	local f
	for url in `cat list`
	do
		if [ "${url:0:1}" = "#" ]; then
			continue
		fi
		third_party_url=("${third_party_url[@]}" "$url")
		third_party_done=(${third_party_done[@]} false)
	done
	cd ..
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

	while [ $i -lt $n ]
	do
		url=${third_party_url[$i]}
		f=${url##*/}
		if [[ $f != *".min.js" ]]; then
			mf=${f/%".js"/".min.js"}
		fi
		if [ "$f" = "$1" ] || [ "$mf" = "$1" ]; then
			if ${third_party_done[$i]}; then
				return
			fi
			echo "- Updating: "$f
			wget -Nnv "$url"
			if [[ $mf > "" ]]; then
				if [ $f -nt $mf ]; then
					echo "- Minifying: "$f
					yui-compressor $f > $mf
				fi
			fi
			third_party_done[$i]=true
			return
		fi
		mf=""
		i=$(( $i + 1 ))
	done
}

minify () {
	local f
	local mf
	local cf
	for f in *.$1
	do
		if [ $1 = "scss" ]; then
			mf="min/"${f/%"."$1/".min.css"}
		else
			mf="min/"${f/%"."$1/".min."$1}
		fi
		if [ ! -d "min/" ]; then
			mkdir "min/"
		fi
		if [ $f -nt $mf ]; then
			echo "- Minifying: "$f
			if [ $1 = "scss" ]; then
				cf=${f/%"."$1/".css"}
				sass $f":"$cf
				yui-compressor --type "css" $cf > $mf
				rm $cf
			else
				yui-compressor --type $1 $f > $mf
			fi
		fi
	done
}
# For all non-minified js files
minify "js"
minify "scss"


checked=()
changed=""
compilechk () {
	if [ ! -e $1 -a -e "../min/"$1".min."$4 ] || [ "$1" = "$2" ]; then
		for c in "${checked[@]}"
		do
			if [ "$c" == "$1" ]; then
				return
			fi
		done
		if [ -e "../min/"$1".min."$4 ]; then
			if [ "../min/"$1".min."$4 -nt "../pkg/"$3".min."$4 ]; then
				changed=$1
			fi
		fi
		checked=("${checked[@]}" "$1")
	elif [ -e $1 ]; then
		for l in `cat $1`
		do
			compilechk $l $1 $3 $4
		done
	fi
}
compile () {
	if [[ $1 == "../thirdparty/"* ]]; then
		cd ../thirdparty
		update_thirdparty ${1##*/}".min.js"
		cd ../pkgcfg
	fi
	if [ ! -e $1 -a -e "../min/"$1".min."$4 ] || [ "$1" = "$2" ]; then
		for c in "${checked[@]}"
		do
			if [ "$c" == "$1" ]; then
				return
			fi
		done
		if [ -e "../min/"$1".min."$4 ]; then
			cat "../min/"$1".min."$4 >> "../pkg/"$3".min."$4
			echo -e "\n" >> "../pkg/"$3".min."$4
		fi
		checked=("${checked[@]}" "$1")
	elif [ -e $1 ]; then
		for l in `cat $1`
		do
			compile $l $1 $3 $4
		done
	fi
}

compile_packages () {
	# Go to package config directory
	cd pkgcfg/

	# For all config files
	local f
	local mf
	local t
	local l
	for f in *
	do
		# Target package output
		mf="../pkg/"$f".min."

		# Check if update needed
		for t in "js" "css"
		do
			checked=()
			changed=""
			for l in `cat $f`
			do
				compilechk $f $l $f $t
			done

			if [[ "$changed" > "" ]]; then
				# Clear and attach header to package
				cat "../header" > $mf$t

				# Compile dependencies
				checked=()
				for l in `cat $f`
				do
					compile $f $l $f $t
				done
				echo "- Compiled: "$mf$t
			fi
		done
	done

	# Return to top-level
	cd ..
}
compile_packages
