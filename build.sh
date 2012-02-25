#!/bin/bash

# Enter third-party dir
cd thirdparty
# Update all third party files
for url in `cat list`
do
	f="${url##*/}"
	if [ "${url:0:1}" = "#" ]; then
		continue
	fi

	echo "- Updating: "$f
	wget -Nnv $url
	if [ ! `expr index ".min.js" $f` ]; then
		mf="${f/%".js"/".min.js"}"
		if [ $f -nt $mf ]; then
			echo "- Minifying: "$f
			yui-compressor $f > $mf
		fi
	fi
done

# Return to top-level
cd ..
minify () {
	for f in *.$1
	do
		mf="min/"${f/%"."$1/".min."$1}
		if [ $f -nt $mf ]; then
			# compress and gzip
			echo "- Minifying: "$f
			yui-compressor --type $1 $f > $mf
		fi
	done
}
# For all non-minified js files
minify "js"
minify "css"


# Go to package config directory
cd pkgcfg

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
	if [ ! -e $1 -a -e "../min/"$1".min."$4 ] || [ "$1" = "$2" ]; then
		for c in "${checked[@]}"
		do
			if [ "$c" == "$1" ]; then
				return
			fi
		done
		if [ -e "../min/"$1".min."$4 ]; then
			cat "../min/"$1".min."$4 >> "../pkg/"$3".min."$4
		fi
		checked=("${checked[@]}" "$1")
	elif [ -e $1 ]; then
		for l in `cat $1`
		do
			compile $l $1 $3 $4
		done
	fi
}

# For all config files
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
			echo "- Compiling: "$mf$t

			# Clear and attach header to package
			cat "../header" > $mf$t

			# Compile dependencies
			checked=()
			for l in `cat $f`
			do
				compile $f $l $f $t
			done
		fi
	done
done
exit

# Return to top-level
cd ..