# RFC git sdk requirements

## Background

This RFC evaluates two architectures on building a git backend that serves current and foreseen needs of inlang.

The inlang editor currently uses the git JS implementation. The JS implementation lacks git features that are required to build out the editor. The lack of git features triggered the exploration of switching the underlying git implementation, see [https://github.com/inlang/inlang/issues/278](https://github.com/inlang/inlang/issues/278).

### Glossary

- **isomorphic git** -The JavaScript git implementation currently used in the inlang editor.
- **libgit2** - The git implementation that can be compiled to WebAssembly.
- **git-sdk** - Client side git implementation that takes over cloning a repository.
- **git-server** - Server that host git repositories. Think of GitHub.

## Goals

- Focus on iteration speed.
  - We deal with high uncertainty. The faster we can iterate, the better we can react to changing requirements.
- Focus on DX when using the SDK.
  - How easy can developers use the git backend? We intend to offer version control as a backend to external developers.
- The implementation must be de-coupled from inlang.
  - Inlang provides requirements that are _most likely_ universal across apps that build on git. But, the git-sdk should be de-coupled from inlang to enable developers to use the sdk to build own apps.

## Non-goals

- Architect the perfect system based on currently known requirements.
  - The requirements will change. We can’t architect the perfect system now.

## Requirements

### Must run in the browser/on the client [High Confidence]

Solving git limitations client-side, in the git-sdk, simplifies application architectures and is large part of inlang’s “the next git” thesis.

Problems we are running into are identical on both the server and client. For example, reducing the bandwidth/time to clone a repository: Moving git-sdk logic to the server only shifts the problem to the server, but doesn’t solve it. The client would need to wait for the server to finish cloning of the repositories. Instead, the git-sdk can be adjusted to support lazy loading of files and thereby automatically solve long cloning times client- and server side.

### Lazy loading of files and git history [High Confidence]

Oftentimes only a subset of files in git repositories are required. Only cloning files and their history that is needed substantially reduces network and storage requirements. A lazy loading solution is likely coupled with the filesystem implementation.

```jsx
/**
 * An example lazy loading implementation API.
 */

// does not clone the entire repository.
// only metadata that enable other git commands to run
await clone("https://github.com/inlang/inlang", fs)

// lazy fetches the file and git commit history of README.md
const commitHistory = await history("/README.md", fs)

// lazy fetches xyz file
const readme = await fs.readFile("/xyz.md")
```

### Must be git compatible but not necessarily up to spec [Medium Confidence]

Changes in the `.git` subdirectory like commits must obey to the git spec but the “way to get there” e.g. commands like `clone` do not have to be up to spec. The git spec is designed for a CLI with access to a local filesystem, not an application that is running in the browser.

An interesting question arises how much of the git spec is required to operate an application like the inlang editor. A good example is `sparse checkout`. `sparse checkout` is a Git feature that enables a user to check out only a subset of files from a repository instead of the entire repository. Coming close to the lazy loading requirements of inlang? Not quite. `sparse checkout` required the knowledge of which files to load. The inlang editor has no knowledge of which files are required before cloning a repository. One might use `sparse checkout` to achieve lazy loading of files but the concept of sparse checkout could be eliminated all together if `clone` is lazy loaded by default.

```jsx
// DISCUSSION: What APIs are required?

// elementary
clone()
commit()
push()
pull()

// branch related
currentBranch()
createBranch()
renameBranch()
switchBranch()
deleteBranch()

// change related
// (3 API different "changes" concepts...)
unstagedChanges()
uncommittedChanges()
unpushedChanges()

// host like GitHub or GitLab dependent
signIn()
signOut()
createFork()
syncFork()
openPullRequest()
```

### (Future) File-based auth [High Confidence | Server-related ]

Supporting features like file-based auth will require a custom git server. Translators are not supposed to have access to the entire source code if they only use a few resource (translation) files. Discussion is ongoing in [https://github.com/inlang/inlang/discussions/153](https://github.com/inlang/inlang/discussions/153).

File-based auth seems to go hand-in-hand with “lazy cloning”. The server would only allow to clone files that the actor has access to.

### (Future) Real-time collaboration [High Confidence]

The editor requires real-time collaboration. We don’t know how we are going to implement real-time collaboration yet from both a technical and design standpoint. But how is easy could the git SDK be extended to add real-time-collaboration?

![Having real-time collaboration in a branch combines Google Docs style collaboration with software engineering collaboration.](./real-time-collaboration.png)

Having real-time collaboration in a branch combines Google Docs style collaboration with software engineering collaboration.

### (Future) Support for large files out of the box [Medium Confidence]

The git-sdk would need something like Git Large File Storage [https://git-lfs.com/](https://git-lfs.com/) built-in. Localization affects media files as well. Support for large files seems to go hand-in-hand with with lazy cloning i.e. the penalty of storing large files .

### (Future) Plugin system to support different files [Medium Confidence]

A plugin system could enable storing files like SQLite, Jupyter Notebooks, or binary files natively in git. If an SQLite file could be stored in git, inlang and other apps might not require dedicated servers to host data. See [https://github.com/inlang/inlang/discussions/355](https://github.com/inlang/inlang/discussions/355).

Storing certain files in git is problematic because git uses a diffing algorithm that is suited for text files (code) but unsuited for other file formats. Having a plugin system where plugins can define the diffing algorithm for different file formats like `.ipynb` or `.sqlite` could enable a variety of new use cases.

# Comparing JS architecture vs WebAssembly

- Does a JS implementation (forked from isomomorphic git) suit our needs of faster iteration speeds better than a WebAssembly implementation?
- Is a JS implementation fast enough?
  - We likely don't need a hyper optimized git implementation yet and can always optimize down the road.
- State management differences (syncing file systems etc.)?
- Ease of debugging (for faster iteration speeds). A pure JS implementation is straightforward to debug.

## Option 1: Use Isomorphic Git and extend it further

## Option 2: Use Git (libkit2) compiled to WebAssembly

If we go with this option. libkit2 is already compilable with [wasm-git](https://github.com/petersalomonsen/wasm-git).

libkit2 misses some features officially but there is not yet merged fork, namely:

- [shallow clones of depth 1](https://github.com/libgit2/libgit2/pull/6396)
- [sparse checkout](https://github.com/libgit2/libgit2/pull/6394)

You can however try combine the code from both forks and if c builds compile it with wasm-git.

The way Git SDK would then work is that it will bundle the wasm and expose an api.

That can look like this. This code runs in the browser.

The Git SDK sends messages. Under the hood all git work is done in a web worker.

```js
// `clone` will fill `inlang` with just minimum needed info
// needed to do future commands
// all further commands load info as it is needed
// the clone will include the whole file tree structure as it exists at the root

// we need to figure out what the best default is?
// most likely
const inlangGit = await clone("https://github.com/inlang/inlang")

// as second argument we can also provide options object
// where you can pass depth or other settings
// perhaps can steal what can be useful for git in browser setting
// from https://git-scm.com/docs/git-clone
const inlanggit = await clone("https://github.com/inlang/inlang", {})

// nice thing is we can type the path to the file too here if we know the file system
// this info can come as a result of running `clone` above
const commithistory = inlanggit.commithistory("readme.md")
```

For above code, what would happen under the hood in Git SDK is:

Technically below is incrrect. GitSDK api will look a bit different

```js
//
export function clone(gitUrl: string, options: CloneOptions) {
	FS.mkdir("/")
	FS.mount(MEMFS, {}, "/")
	FS.chdir("/")

	const folderToCloneTo = giUrl.split("/").pop()

	const result = libgit.callMain(["clone", gitUrl, folderToCloneTo])
	FS.chdir(folderToCloneTo)

	// above is a regular clone done
	// FS is https://emscripten.org/docs/api_reference/Filesystem-API.html
	// .callMain is how you send commands to libgit2

	// this will send a shallow-clone command
	// it is not officially supported by libgit2 but was added
	// after this pr: https://github.com/libgit2/libgit2/pull/6396
	// got compiled with wasm-git
	// a new c function was added with 'shallow-clone'
	// all the function did was set:
	// clone_opts.fetch_opts.depth to 1
	// then after compiling, callMain calls the function
	// and it does shallow clone
	const result = libgit.callMain(["shallow-clone", gitUrl, folderToCloneTo])

	// concerns
	// through this interface we can extend libgit2 but this would require writing C code.
}
```

There were issues trying to bundle the wasm file in a package. We tried to use [@rollup/plugin-wasm](https://www.npmjs.com/package/@rollup/plugin-wasm) for it.

More investigation should be done in this area.

## Open questions

### Git compiled to WASM

Git is compiled to wasm using libkit2. Right now with wasm-git when it builds, it provides .wasm file. And one .js file emitted by Emscripten I think that comes with the FS and exposes a function `libgit` and maybe more things.

You can then call `libgit.main()` to send commands to actual git. If it's a clone, it will clone it into Emscripten FS, exposed via `FS` global variable.

Git WASM gives 2 examples in repo, one in web worker and 1 in browser.

In web worker, you would put code in web-worker.js file. Inside it you will write a pattern matcher for kinds of commands the worker accepts and does the git command asked and replies with information, if any.

Git SDK will when called to do say

`const inlang = await clone("https://github.com/inlang/inlang.git")`

When this is done for first time, in `clone` function of Git SDK, it would start a web worker. And pass a message to it `clone(repo)`. Web worker replies with answer. Users get back what it returns in their web apps.

Perhaps web workers are not needed at all for this. I would need to read more on webassemebly and how it interfaces with js. I just thought that to do git commands, if those exist in wasm, you'd need to send file system there or part of it to do the git command. libkit2 wasm doesn't come with its own file system, thats what lg2.js file is for. Which I need to read to understand this situation better.

If you use wasm, file system can still exist inside the Git SDK JS code, not in a web worker which is actually indeed not needed.

I think the big idea / confusion is that maybe we don't expose the full file system to users. But if you want to talk with your files, you do it through Git SDK? Would this make sense? Or maybe it's a question of then it being not just Git SDK but some kind of higher abstraction over git repos and should be named appropirately. Just an idea.

I think you can achieve all at least Inlang concerns through API like this. Where we don't deal with the file system inside the front end code.

You will clone repo, you get the files/folders. If you want to see contents of it, make a `inlangGit.openFile("path/toFile.js")`

`inlangGit.log()` shows git log

`inlangGit.add("path/toFile")`

This one is tricky, how to edit file?

```js
// perhaps
const file = inlangGit.readFile("path/toFile")

// show in UI
// make edits to it
// want to git commit it? do this:

inlangGit.overwriteFile("path/toFile")
```

`inlangGit.push()` will do push to remote

Not sure how that api would look, my knowledge of rebase is squashing commits in github on pr and sometimes combining multiple commits into 1.

`inlang.rebase()`

As I am writing this. This to me seems like a nice way to abstract working with remote git repos.

To summarize

1. Web worker most certianly not needed it seems, so just compile wasm-git, take the .wasm

- pass the file system to git sdk, use it to walk with .wasm

2. Problem here

### Git inside JS

Git in JS is simipler.

You import Git SDK (that wraps around isomorphic git). This isomorphic git lives together with some in memory fs.

Probably best of it is [memfs](https://www.npmjs.com/package/memfs).

The trouble here is extending isomorphic git to support all the features we need such as sparse-checkout and perhaps more.

In theory libkit2 is quite mature, you can most likely already make sparse-checkout work with clever arrangement of existing commands.
