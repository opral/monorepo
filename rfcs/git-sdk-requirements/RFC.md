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

> Anything using `> ` syntax is taken from @araknast great RFC answers: https://gist.github.com/araknast/2308fa58e49112ff112c415f4fb7531a

> To be merged together into 1 RFC

### Not coupled to the browser [High Confidence]

The git-sdk must run on the server, in a VSCode extension, in CI/CD, in the browser. In short, everywhere.

The model to run the git-sdk everywhere is simple: have a filesystem. All environments except for the browser have a filesystem concept. Thus, we need to build a filesystem implementation for the browser.

#### JS

isomorphic-git already runs in both browser and node environments which covers everything.

#### WASM

libgit2 when compiled to wasm with [Emscripten](https://emscripten.org/) creates 3 files: `lg2.html`, `lg2.js` and `lg2.wasm` (~ 833 KB).

The `lg2.js` file includes [Emscripten File Sytem](https://emscripten.org/docs/api_reference/Filesystem-API.html) with already configured bindings to call into `lg2.wasm` and save results in the file system.

This virtual file system can run in both browser and node environments.

Below is example of cloning a git repo into virtual in-memory file system ([MEMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#memfs)):

```js
FS.mkdir("/")
FS.mount(MEMFS, {}, "/")
FS.chdir("/")
libgit.callMain(["clone", "https://github.com/inlang/inlang.git", "inlang"])
FS.chdir("inlang")
```

##### What to do when users provide file system as argument?

The code in `lg2.js` should be changed to instead of using wasm-integrated Emscripten FS, it uses passed in file system.

Inlang can also expose a package like [memfs](https://github.com/streamich/memfs) that would provide [MEMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#memfs) like file system that users can pass as argument to git-sdk.

Emscripten MEMFS can run in both browser and node environments.

##### Running GitSDK WASM in browser (web worker)

If running git-sdk-wasm in [in web worker](https://github.com/petersalomonsen/wasm-git#example-webworker-with-pre-built-binaries), all git/fs operations won't be blocking the main JS thread.

However as the file system must be synced via message passing between the web worker and browser js thread.

As we can't run all logic in a web worker as the file system must be exposed to users and not be abstracted, to avoid message passing syncing, there should be no web worker used.

##### Running GitSDK WASM in browser

You can instead run git-sdk [in a browser](https://github.com/petersalomonsen/wasm-git#use-in-browser-without-a-webworker). The package will be making async requests to `lg2.wasm` by passing the required commands.

The difficulty is with bundling the `.wasm` file with the package. This is currently being explored [here](https://github.com/nikitavoloboev/git-sdk) using rollup to bundle everything.

##### Running GitSDK WASM in Node

Whilst [MEMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#memfs) can be used inside node environments, there is also [NODEFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#nodefs) file system that can only run in Node.

### Client-side implementation [High Confidence]

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

> Implementation

> To resolve this, we exploit the functionality behind partial clones, namely the filter option to the fetch-pack wire command, and promisor pack files. We then use this to implement a sort of 'partial fetch' which, when combined with a pattern based sparse checkout, has the effect of fetching only the objects necessary to render the files we are using, and significantly speeding up the cloning process.

> Abstraction

> To make this easier for the end user, we can expose this functionality as a lazy loading filesystem which functions exactly the same as a normal filesystem, except in its implementation of readFile().

> The only modification necessary to readFile() is a hook at the very beginning which calls checkout on the current file before it is opened. Once promisor packfiles are implemented, this will handle the fetching and unpacking of the corresponding object in a way that is completely transparent to the end user.

#### JS

Isomorphic Git can now, only do shallow clones using `depth=1`. This however still fetches:

1. latest commit for each branch
2. working tree files (files associated with latest commit for each branch)
3. branch and tag references

To achieve lazy loading and only fetching things as they are needed, you neeed to add git wire protocol version 2 support, together with `filter`, `fetch-pack` wire command.

How fetch for git objects is done:

1. `git fetch` is executed on the local repository.
2. `fetch-pack` is invoked, which establishes a connection to the remote repository.
3. `fetch-pack` sends a request containing the commit hashes it wants to retrieve.
4. On the remote repository, `upload-pack` receives the request and gathers the requested objects.
5. `upload-pack` sends the objects in a packfile back to the `fetch-pack` command.
6. `fetch-pack` stores the received objects in the local repository, updating the local object database.

Adding `filter` would allow for fetching partially contents of the git server using promisor pack files.

There is a way to request for certain checked out files too. Need to know what `fetch-pack` sends when you do something like this in git:

```
git config core.sparseCheckout true
echo "package.json" >> .git/info/sparse-checkout
git checkout
```

You can also combine clone + getting the git objects for blobs in the files/folders to checkout into 1 http request. And expose it as an API in Git SDK `cloneWithCheckout()` or similar API.

Extending Isomorphic Git to achieve lazy loading is currently being explored [in a fork](https://github.com/nikitavoloboev/isomorphic-git/tree/partial-clone).

#### WASM

libgit2 supports [filter](https://libgit2.org/libgit2/#v0.20.0/group/filter). There is [unmerged PR for trying to add partial clones](https://github.com/libgit2/libgit2/pull/5993).

There is also [open pr with sparse-checkout](https://github.com/libgit2/libgit2/pull/6394), not yet merged.

### Must be git compatible [High Confidence]

The data in `.git` must be up to spec to ensure compatiblity with the git ecosystem and ease adoption. The ecosystem includes GitHub, CLIs, etc.

### "Commands" like `clone` do not necessarily need to be up to spec [Medium Confidence]

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

#### JS

Current isomorphic-git API [here](https://isomorphic-git.org/docs/en/alphabetic).

```js
clone() // ✅ https://isomorphic-git.org/docs/en/clone
shallowClone() // ❎ need wire protocol 2 + filter support
commit() // ✅ https://isomorphic-git.org/docs/en/commit
push() // ✅ https://isomorphic-git.org/docs/en/push
pull() // ✅ https://isomorphic-git.org/docs/en/pull
sparseCheckout() // ❎ need wire protocol 2 + filter support

currentBranch() // ✅ https://isomorphic-git.org/docs/en/currentBranch
createBranch() // ✅ https://isomorphic-git.org/docs/en/branch
renameBranch() // ✅ https://isomorphic-git.org/docs/en/renameBranch
switchBranch() // ✅ https://isomorphic-git.org/docs/en/checkout.html
deleteBranch() // ✅ https://isomorphic-git.org/docs/en/deleteBranch

unstagedChanges() // ❓
uncommittedChanges() // ❓
unpushedChanges() // ❓

signIn()
signOut()
createFork()
syncFork()
openPullRequest()
```

#### WASM

API of libgit2 is [here](https://libgit2.org/libgit2/#HEAD).

```js
clone() // ✅ https://libgit2.org/docs/guides/101-samples/#repositories_clone_simple
shallowClone() // ❓ part of clone, there is open pr for it but it may not be as shallow as we need it, new code must be written
commit() // ✅ https://libgit2.org/docs/guides/101-samples/#commits
push() // ✅ https://stackoverflow.com/questions/28055919/how-to-push-with-libgit2
pull() // ✅ https://stackoverflow.com/questions/39651287/doing-a-git-pull-with-libgit2
sparseCheckout() // ❓ https://github.com/libgit2/libgit2/issues/2263 (open pr, need to build, test)

currentBranch() // ✅ https://stackoverflow.com/questions/12132862/how-do-i-get-the-name-of-the-current-branch-in-libgit2
createBranch() // ✅ https://libgit2.org/libgit2/#HEAD/group/branch/git_branch_create
renameBranch() // ✅ https://libgit2.org/libgit2/#v0.17.0/group/branch
switchBranch() // ✅ https://stackoverflow.com/questions/46757991/checkout-branch-with-libgit2
deleteBranch() // ✅ https://libgit2.org/libgit2/#v0.17.0/group/branch/git_branch_delete

// (3 API different "changes" concepts...)
unstagedChanges() // ❓
uncommittedChanges() // ❓
unpushedChanges() // ✅ https://stackoverflow.com/questions/42131934/get-unpushed-commits-with-libgit2

signIn()
signOut()
createFork()
syncFork()
openPullRequest()
```

### (Future) File-based auth [High Confidence | Server-related ]

Supporting features like file-based auth will require a custom git server. Translators are not supposed to have access to the entire source code if they only use a few resource (translation) files. Discussion is ongoing in [https://github.com/inlang/inlang/discussions/153](https://github.com/inlang/inlang/discussions/153).

File-based auth seems to go hand-in-hand with “lazy cloning”. The server would only allow to clone files that the actor has access to.

> Implementation

> The simplest way to implement this while maintaining compatibility with Git is to have a modified version of the Git server which allows users the option to authenticate. Each object stored on the server is access controlled, and the server will refuse to serve objects to users who do not have permission, i.e. those objects will not be included in the packfiles sent to the user

> Issues

> First, users who are not aware of this system will receive what looks like a corrupt repo when they attempt to clone a repo for which they do not have permission to access all the objects. In order for this to work properly it is necessary for the user to run a partial clone of only the files they have access to (or use the lazy fs).

> Second, because tree objects contain the name, mode and hash of the files they reference, these attributes will potentially be visible to users even if they don't have permission to access the file (as long as they have access to the parent tree).

> If this approach is taken, these issues should be made clear in the documentation.

### (Future) Real-time collaboration [High Confidence]

The editor requires real-time collaboration. We don’t know how we are going to implement real-time collaboration yet from both a technical and design standpoint. But how is easy could the git SDK be extended to add real-time-collaboration?

![Having real-time collaboration in a branch combines Google Docs style collaboration with software engineering collaboration.](./real-time-collaboration.png)

Having real-time collaboration in a branch combines Google Docs style collaboration with software engineering collaboration.

> In my opinion this is best done on the frontend with something like Operational Transform, not Git for performance reasons. Once the a files edits have been resolved it can be committed normally to the repo (potentially noting the multiple contributors).

### (Future) Support for large files out of the box [Medium Confidence]

The git-sdk would need something like Git Large File Storage [https://git-lfs.com/](https://git-lfs.com/) built-in. Localization affects media files as well. Support for large files seems to go hand-in-hand with with lazy cloning i.e. the penalty of storing large files .

> Implementation

> All that is necessary for Git to manage these files is a hook when staging to convert the file to multiple Git objects, and a hook when checking out to convert multiple Git objects back to their corresponding binary format. Similar hooks exists in the form of the clean and smudge hooks, however these have files as both their input and outputs. Our implementation would be more powerful in that it would allow for 'cleaning' a file into multiple Git objects, and 'smudging' multiple Git objects into a single file.

> Finally, in order for the diffs between these binary files to be presentable to the user, we will need allow the end user to define their own 'diff' implementation to support various file types.

#### JS

Isomorphic git [does not officially support it](https://github.com/isomorphic-git/isomorphic-git/issues/1375).

But there is [LFS compatibility layer for iso-git](https://github.com/riboseinc/isogit-lfs). Explained [here](https://github.com/extrawurst/gitui/discussions/1089#discussioncomment-4858642).

#### WASM

libgit2 team refers to using [filters API](https://libgit2.org/libgit2/#v0.20.0/group/filter) to [achieve git lfs support](https://github.com/libgit2/libgit2sharp/issues/1236). There is no official API for Git LFS.

### (Future) Plugin system to support different files [Medium Confidence]

A plugin system could enable storing files like SQLite, Jupyter Notebooks, or binary files natively in git. If an SQLite file could be stored in git, inlang and other apps might not require dedicated servers to host data. See [https://github.com/inlang/inlang/discussions/355](https://github.com/inlang/inlang/discussions/355).

Storing certain files in git is problematic because git uses a diffing algorithm that is suited for text files (code) but unsuited for other file formats. Having a plugin system where plugins can define the diffing algorithm for different file formats like `.ipynb` or `.sqlite` could enable a variety of new use cases.

#### JS

All git operations and file system is in JS. Plugins can be implemented as importable JS functions and follow some specification of inputs / outputs.

#### WASM

Similar to JS version, plugins can be implemented as importable JS functions and follow some specification of inputs / outputs.

Only the actual git related commands are done in WASM. By sending messages to libgit2 wasm and getting back results.

## Comparing JS architecture vs WebAssembly

- Does a JS implementation (forked from isomomorphic git) suit our needs of faster iteration speeds better than a WebAssembly implementation?
- Is a JS implementation fast enough?
  - We likely don't need a hyper optimized git implementation yet and can always optimize down the road.
- State management differences (syncing file systems etc.)?
- Ease of debugging (for faster iteration speeds). A pure JS implementation is straightforward to debug.

# Summary and Roadmap

> To summarize, I propose git-sdk should implement the following features:

> 1. Standard Git commands for interacting with repositories
> 2. Lazy loading based on fetch-pack filtering and promisor packfiles
> 3. Lightweight file-based authentication built on top of the existing Git protocol
> 4. More powerful implementations of the smudge and clean hooks, as well diff providers to support version controlling diverse filetypes

> While I propose we continue to use isomorphic-git when implementing this sdk, most of its features will be built on top of existing Git functionality, so our roadmap will look similar no matter which backend we go with

> For isomorphic-git, the roadmap will look something as follows (note the difficulty assessments in square brackets):

> 1. Update isomorphic-git to support wire protocol v2 [medium]
> 2. Implement support for promisor packfiles in isomorphic-git [medium-hard (?)]
> 3. Implement partial cloning with a filter option to git.clone [easy]
> 4. Abstract partial cloning into a lazy fs that is transparent to the user (git-sdk is born) [easy]
> 5. Implement smudge, clean, and diff providers [easy]
> 6. Create a custom server implementation for file based authentication [hard]

> If using libgit2, the roadmap would look somewhat similar:

> 1. Implement support for promisor packfiles in libgit2 [hard]
> 2. Implement partial cloning with a filter option to git.clone [medium (?)]
> 3. Abstract partial cloning into a lazy fs that is transparent to the user (git-sdk is born) [easy]
> 4. Rewrite smudge, and clean implementations for libgit2 to support multiple object input and output [hard (?)]
>    - This could be made easier if we handle this in git-sdk in a way that is transparent to libgit2, but we lose the performance benefits
> 5. Create a custom server implementation for file based authentication [hard]

> Note that [easy, medium, hard] denote the amount of work involved, not necessarily the difficulty of the problem, that difficulty is based on the assumption that the previous tasks have already been completed, and also that I am not very familiar with the libgit2 codebase, so my difficulty assessments may be incorrect

> Miscellaneous Notes

> Performance Issues in Isomorphic-git

> The largest issue faced by the inlang editor in its current iteration using isomorphic-git is the time taken to clone large repositories. The cause of this is twofold

> 1. isomorphic-git is significantly slower in indexing packfiles sent from the remote than canonical git.
> 2. the implementation of checkout in isomorphic-git suffers from a lack of optimization in determining which files to update. Where canonical Git evaluates the files in a single pass, isomorphic-git evaluates them in multiple passes causing considerable slowdown (see this comment and the comments in src/commands/checkout.js).

> With considerable effort, this could potentially be improved, but at the moment it makes more sense to focus on optimizing the usage of our Git backed (partial clones, etc.) rather than the performance of the backend itself

> Fork vs. Patch Workflow

> Git-sdk should be designed to support both major Git workflows: patch/send-email (Linux, git, sourcehut), as well as fork/PR (GitHub, GitLab, Bitbucket). For this reason our sdk should also include functionality to generate and apply patches, which can then be used with these workflows
