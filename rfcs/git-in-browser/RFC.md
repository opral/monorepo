# Decide on what should be used to do git operations inside Inlang Web Editor

## Problem

Currently Inlang uses [isomorphic-git](https://isomorphic-git.org/) to do anything related to git such cloning GitHub repository. It works by reimplementing git commands in JavaScript. And has a great feature where you can pass a custom file system imeplementation by passing `fs` argument to each git command like [clone](https://isomorphic-git.org/docs/en/clone).

However isomorphic-git currently misses some features that Inlang needs such as [rebasing](https://github.com/inlang/inlang/issues/220), [periodically pulling changes](https://github.com/inlang/inlang/issues/252) and [shallow cloning](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/) and [sparse checkout](https://git-scm.com/docs/git-sparse-checkout) plus potentially more.

To get around this problem, [issue to replace isomorphic-git with libgit2](https://github.com/inlang/inlang/issues/278) was open.

This RFC aims to answer the question of whether Inlang should migrate to [libgit2](https://libgit2.org) compiled to WebAssembly using [wasm-git](https://github.com/petersalomonsen/wasm-git) or extend isomorphic-git with needed features.

## Pros/Cons of libgit2 migration

### Why use libgit2?

libgit2 when compiled to WebAssembly has an extensive set of git features. Commands it supports can be seen [here](https://libgit2.org/libgit2/#HEAD).

It does support [rebase](https://libgit2.org/libgit2/#HEAD/group/rebase/git_rebase_abort), [pull for changes](https://stackoverflow.com/questions/27759674/libgit2-fetch-merge-commit). However these 2 things that Inlang needs are not merged into main of libgit2 yet:

1. Shallow clones. There is [open pr](https://github.com/libgit2/libgit2/pull/6396) and [fork that builds libgit2 with this feature](https://github.com/nikitavoloboev/wasm-git).
2. Sparse checkout. There is [open pr](https://github.com/libgit2/libgit2/pull/6394) that has this feature too, not yet merged.

To have both shallow clones and sparse checkout, you'd need to combine the code from 2 prs into one code tree and then try compile it with wasm-git and hope there would be no errors.

If you have compiled libgit2 with wasm-git, you get 2 files as output: `lg2.wasm` and `lg2.js`. `lg2.js` file amongst other things, sets up a connection with [Emscripten FS](https://emscripten.org/docs/api_reference/Filesystem-API.html).

### libgit2 inside web worker

Described briefly [here](https://github.com/petersalomonsen/wasm-git#example-webworker-with-pre-built-binaries). In code it'd look like this:

```js
var Module = {
	print: function (text) {
		console.log(text)
	},
	printErr: function (text) {
		console.error(text)
	},
}

importScripts("./lg2.js")

const libgitPromise = new Promise((resolve) => {
	Module.onRuntimeInitialized = () => {
		resolve(Module)
	}
})

;(async () => {
	const libgit = await libgitPromise
	FS.mkdir("/")
	FS.mount(MEMFS, {}, "/")
	FS.chdir("/")
	const result = libgit.callMain([
		"shallow-clone",
		"https://github.com/inlang/inlang.git",
		"inlang",
	])
	FS.chdir("inlang")
})()
```

The global `FS` variable refers to [Emscripten File System](https://emscripten.org/docs/api_reference/Filesystem-API.html).

Inside front end code, you can do: `new Worker(new URL("../gitworker.js", import.meta.url))` where `gitworker.js` is the file with web worker code.

This causes an issue however that now the only way to communicate with the web worker is to pass messages from main thread to the web worker.

If you go with this approach, you would probably want to keep the web worker state as primary state. Front end code sends commands to web worker, clone and everything else happens in the web worker. However you would also potentially need to have a file system in the front end code. So there is an issue now where 2 file systems need to be synced.

However there might be a case where you don't need another file system in the browser. i.e.

1. user opens https://inlang.com/editor/github.com/inlang/example
2. web worker with libgit2 gets started
3. from main to web worker: message to `git clone --depth=1 https://github.com/inlang/example`
4. shallow clone happens, attaches to FS, there is some code to read inlang config, find the translation files. send back the contents of the files to main thread back
5. in browser you take the content of each returned translation file, map it to some JS data structure. users make edits to the translations
6. if they want to commit, push, they send messages to web worker, it then in turn does git operations with libgit2 and submits results to github

### libgit2 without web worker

You can instead host the `lg2.wasm` file on some remote server or even GitHub and then `fetch` the .wasm file like:

```
const wasm = await fetch(
		"https://github.com/inlang/inlang/blob/99023c3f740c87996d33f00cac4e4d715cca4f96/source-code/git-sdk/src/lg2.wasm",
)
```

The issue is that the .wasm file is 12.5 MB. Which means if you users open the editor page directly, first you have to download the libgit2, then you have to do shallow clone which then will show the translations for editing.

You would also need to somehow connect a file system to libgit2. `lg2.js` file does this for you but it's written in pre ES module js and would need to be rewritten to work inside Inlang Solid app.

## Pros/Cons of extending isomorphic-git

Inlang already uses isomorphic-git and [memfs](https://www.npmjs.com/package/memfs) as the file system.

The big consideration of moving away from it is that it doesn't support:

1. [rebasing](https://github.com/inlang/inlang/issues/220)

- [open issue](https://github.com/isomorphic-git/isomorphic-git/issues/1527)

2. [periodically pulling changes](https://github.com/inlang/inlang/issues/252)

- there is [pull](https://isomorphic-git.org/docs/en/pull) command in api, maybe something is missing?

3. [shallow cloning](https://github.blog/2020-12-21-get-up-to-speed-with-partial-clone-and-shallow-clone/)

- [open issue](https://github.com/isomorphic-git/isomorphic-git/issues/1123)

4. [sparse checkout](https://git-scm.com/docs/git-sparse-checkout)

- [open issue](https://github.com/isomorphic-git/isomorphic-git/issues/1735)

These 4 things need to be implemented.

I have not benchmarked isomorphic-git with libgit2 but I imagine for the things Inlang needs to do, the bottleneck for most things is the network, not that git commands are implemented in JS.

If we do imeplement those 4 things in JS, we don't need to sync the file system like we do with libgit2 in web worker. And we won't need to wait for 12.5 MB for WASM file to get fetched. As well as no code needed to be written to glue libgit2 with a virtual file system like [memfs](https://www.npmjs.com/package/memfs).

The negative of going with isomorphic-git is that for those 4 git operations, no code has been written. However the codebase is open source and we have reference implementations although in [Rust](https://github.com/Byron/gitoxide)/[Python](https://github.com/gitpython-developers/GitPython)/[C](https://github.com/libgit2/libgit2).

And we don't need to actually implement each feature up to spec fully. We only need it to do the things that Inlang editor needs. Enough to get data from github, do things in Inlang and be in right state to `git push` changes made.
