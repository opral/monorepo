rootDir="../../.."
srcDir="$rootDir/node_modules/isomorphic-git/__tests__"
destDir="$rootDir/src/raw/tests"

transform() {
	target="$1"
	tr '\n' '\a' < "$1" \
		| sed \
			-e "s/\/\* eslint-env node, browser, jasmine \*\/\a//" \
			-e "s/const { makeFixture } = require('.\/__helpers__\/FixtureFS.js')\a//" \
			-e "s/const {\([a-zA-Z \a,]*\)} = require('isomorphic-git')\a/import {\1} from 'isomorphic-git'\a/" \
			-e "s/const {\([a-zA-Z \a,]*\)} = require('isomorphic-git\/internal-apis')\a/import {\1} from 'isomorphic-git\/internal-apis.js'/" \
			-e "s/import http from 'isomorphic-git\/http'\a/import http from 'isomorphic-git\/http\/web\/index.js'/" \
			-e "s/^/import { makeFixture } from '.\/makeFixture.js'\a/" \
			-e "s/^/import { describe, it, expect, beforeAll } from 'vitest'\a/" \
			-e "s/^/\/* eslint-env node, browser, jasmine *\/\a/" \
			-e "s/^/\/\/ @ts-nocheck\a/" \
			-e "s/;(process.browser ? xit : it)/it/" \
			-e "s/;(process.browser ? it : xit)/it.skip/" \
			-e "s/path\.resolve/path.join/g" \
			-e "s/mode: 0o666/mode: 0o644/g" \
			-e "s/Object {/{/g" \
			-e "s/Array \[/[/g" \
		| tr '\a' '\n' \
		| sed \
			-e "s/it('clone with noTags'/it.skip('clone with noTags'/" \
			-e "s/it('create signed commit'/it.skip('create signed commit'/" \
			-e "s/it('creates a signed tag to HEAD'/it.skip('creates a signed tag to HEAD'/" \
			-e "s/it('should allow agent to be used with built-in http plugin for Node.js'/it.skip('should allow agent to be used with built-in http plugin for Node.js'/" \
			-e "s/it('should set up the remote tracking branch by default'/it.skip('should set up the remote tracking branch by default'/"
}

# note, we should un-skip the git.clone tests once checkout speed is improved.

mkdir -p "$destDir/fixtures/"
cp -rf "$srcDir/__fixtures__/"* "$destDir/fixtures/"
for test in $(ls $srcDir)
do
	newTestName="$(echo "$test" | sed -e 's/^test-//' -e 's/.js/.test.ts/')"
	transform "$srcDir/$test" > "$newTestName"
	echo "$newTestName"
done

rm "$destDir/version.test.ts"
rm "$destDir/index.webpack.test.ts"
rm "$destDir/__fixtures__"
rm "$destDir/env.d.ts"
