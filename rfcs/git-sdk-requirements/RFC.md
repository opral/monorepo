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

### Not coupled to the browser [High Confidence]

The git-sdk must run on the server, in a VSCode extension, in CI/CD, in the browser. In short, everywhere.

The model to run the git-sdk everywhere is simple: have a filesystem. All environments except for the browser have a filesystem concept. Thus, we need to build a filesystem implementation for the browser.

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

# Comparing JS vs WebAssembly in solving goals stated above

## Adding folder for storing metadata (no modification to git itself)

The problem of storing generalized metadata will be present across all git based apps.

In Inlang, there is currently [no ability to track which translations were machine translated](https://github.com/inlang/inlang/discussions/462).

One solution is to have a custom [folder for storing metadata](https://github.com/orgs/inlang/discussions/355). Metadata such as comments/images/ etc.

Assuming we decide to store all metadata in folder.

We will cover the case of 'Modyfing git to become a proper backend' after.

### JS

You would be able to fetch the metadata folder via sparse-checkout clone. And read the metadata as it will be just files in a file system.

Comitting/pushing files is trvial too. The only missing piece is adding sparse-checkout into isomorphic-git. All the remainder of git operations one would need to be able to work with a metadata folder should be covered already by existing featureset of isomorphic git.

Not tested yet, but it should hopefully respect `.gitignore` placed inside the metadata folder too, but if it doesn't it's trivial to add as a feature too.

### WASM

Similar to Isomorphic Git, this would be trivial to add on top of libgit2 wasm.

You would sparse-checkout the folder with metadata. Only difference is that as it currently stands, you are forced to save results into [Emscripten FS](https://emscripten.org/docs/api_reference/Filesystem-API.html).

The way libgit2 works now as compiled through [wasm-git](https://github.com/petersalomonsen/wasm-git) is you get 1 .wasm file. And one .js file. The JS file contains the Emscripten FS and bindings to libgit2 git.

[MEMFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#memfs) is default in-memory file system mounted. Example code how that looks below:

```js
// clone inlang into MEMFS
FS.mkdir("/")
FS.mount(MEMFS, {}, "/")
FS.chdir("/")
libgit.callMain(["clone", "https://github.com/inlang/inlang.git", "inlang"])
FS.chdir("inlang")
```

There is also [NODEFS](https://emscripten.org/docs/api_reference/Filesystem-API.html#nodefs) you can use for when git-sdk runs in Node.

NODEFS uses native Node.js 'fs' module under the hood to access the host file system.

One of stated goals of git sdk is it should run anywhere there is a file system. You provide the file system and git sdk does the rest.

The interface of the file system provided by users to git sdk can be adapted to cover the API surface of MEMFS or NODEFS depending on the environment they are running git sdk in.

Above was needed context to answer the question regarding adding support for the custom folder to hold metadata about repository.

libgit2 supports the features needed to sparse-checkout the metadata folder and mount it into the file system. From then on, you can read/modify the contents of the files.

## Modify git to become a proper backend

Here is summary of [points made by Samuel on kinds of things one would need for git as a backend](https://github.com/orgs/inlang/discussions/355#discussioncomment-4875403). Let's go through each one and see how JS or WASM solutions compare in solving them.

## Lazy loading of files

### JS

sparse-checkout is not implemented but can be added. Should be a mix of adapting code from [checkout](https://isomorphic-git.org/docs/en/checkout) and [fetch](https://isomorphic-git.org/docs/en/fetch) commands.

### WASM

There is [open pr](https://github.com/libgit2/libgit2/pull/6394) that has support for sparse-checkout. Should be compiled with wasm-git.

There is also [open question about how to do just the bare minimum clone of a repo](https://stackoverflow.com/questions/75817315/how-to-do-git-clone-depth-1-sparse-no-checkout-filter-blobnone-in-lib) to do further sparse-checkout operation.

## Storing binary data in git is possible by default (built-in git LFS)

### JS

Isomorphic git [does not officially support it](https://github.com/isomorphic-git/isomorphic-git/issues/1375).

But there is [LFS compatibility layer for iso-git](https://github.com/riboseinc/isogit-lfs). Explained [here](https://github.com/extrawurst/gitui/discussions/1089#discussioncomment-4858642).

### WASM

libgit2 team refers to using [filters API](https://libgit2.org/libgit2/#v0.20.0/group/filter) to [achieve git lfs support](https://github.com/libgit2/libgit2sharp/issues/1236). There is no official API for Git LFS.

## Not every change needs to be committed

Should be solvable irregardless of WASM/JS solution chosen for Git. Just do all the non comittable work on top of the FS. And only commit changes you need.

## Git provides real-time collaboration

Should also be solvable irregardless of WASM/JS solution chosen for Git.

You can build real-time collaboration features on top of the FS api. Using operational transforms or other tech.

Only when you want to commit and persist the changes, would you talk to Git and there all required git features are supported.

Conflict resolution can be built in JS side irregardless if actual git is implemented in JS or WASM.

> Perhaps I am missing a case where you would actually need to change some core git behavior in order to make above work? I don't see it.

## Built-in auth via auth as code

From [comment](https://github.com/orgs/inlang/discussions/355#discussioncomment-4875403):

> Apps don't need an auth layer anymore. organization can configure auth as they please and need. Potentially revolutionizing here as well. If that auth layer is also able to hook into databases like sqlite

From [authorization and file-based security issue](https://github.com/orgs/inlang/discussions/153).

> The editor clones a whole repository. Especially for private repositories, file-based access control is desired. A translator should only be able to clone translation relevant files

> Implementing a custom git server with auth as code like https://www.osohq.com/ could enable the feature. The cumbersome authorization path, see (reversed) #303, could simultaneously be streamlined by leveraging such a git server as auth layer

Assume that would mean, Git SDK would need a custom git server with certain rules for this to work.

> TODO: need expanding, don't fully understand how that'd work. This would probably actually need changes made to git core potentially

## Plugin system to support different files

Plugins are mostl likely to be written in JS. Although there is option to [write plugins in wasm too](https://github.com/extism/extism) (not useful for our case).

### JS

Everything is already in JS and there is no need to call WASM. We have full control over all data structures to represent any kind of git related object we need.

The plugins may potentially work in similar way to the way inlang config does plugins now.

> TODO: need to read inlang config spec to say for sure

### WASM

For WASM, it would be similar to JS version. Only the actual git operations are done in WASM. But that should be okay as the plugins will most likely wrap around how/when you would call into git to do actual git operations. The rest can be built on top of the file system and fully in JS.

libgit2 allows to get access to various git related metadata info to in some ways emulate parts of certain git operations in cases git sdk needs to do something complex and outside of scope of git.

> Need examples of plugins that one can make. Perhaps some plugins would need to actually have access to git core to make the use cases work.

## Git SDK must run in browser/server/everywhere

### JS

Isomorphic git already runs in both browser and node environments which covers everything.

### WASM

Node.js can run webassembly and there is NODEFS provided by Emscripten for cases of running the file system in node. So git sdk can take a node fs compatible file system and should work.

For browsers, there is a way to run everything in a [web worker](https://github.com/petersalomonsen/wasm-git#example-webworker-with-pre-built-binaries). To not do heavy work on the main thread in browser.

There is also option to run [without a web worker](https://github.com/petersalomonsen/wasm-git#use-in-browser-without-a-webworker).

It would be idealy if the Git SDK package adapted to either case of running in browser or running in node smartly. There might be further complication issues with running things in a web worker, such as how to achieve full reactivity on the client side with ability to periodically pull and persist changes made to git. With web workers, that would have to be done through messages. But that doesn't mean it would be impossible to build out.

## Running code

### WASM

WASM approach is being explored [here](https://github.com/nikitavoloboev/git-sdk) at the moment.

Issues with WASM were trying to bundle/use WASM file with rollup. It bundles well but when trying to use it from a vite project, it complains .wasm can't run. Perhaps Vite plugin is needed or change to rollup config.

### JS

Extending Isomorphic Git to achieve above stated goals is currently being explored on fork of isomorphic-git [in a branch](https://github.com/nikitavoloboev/isomorphic-git/tree/partial-clone).

First task is to implement partial clones with ability to checkout specific files/folders, ideally in one http connection to git remote.

For that git wire protocol 2 needs to be implemented as it contains ability to use `filter` to request the bare minimium needed from the git server.

How fetch for git objects is done:

1. `git fetch` is executed on the local repository.
2. `fetch-pack` is invoked, which establishes a connection to the remote repository.
3. `fetch-pack` sends a request containing the commit hashes it wants to retrieve.
4. On the remote repository, `upload-pack` receives the request and gathers the requested objects.
5. `upload-pack` sends the objects in a packfile back to the `fetch-pack` command.
6. `fetch-pack` stores the received objects in the local repository, updating the local object database.

There is a way to request for certain checked out files too. Need to know what `fetch-pack` sends when you do something like this in git:

```
git config core.sparseCheckout true
echo "package.json" >> .git/info/sparse-checkout
git checkout
```

> p.s. first version for answers on this RFC covered a lot of implementation details over answering high level questions of this RFC

> this has since been moved here https://wiki.nikiv.dev/notes/git-notes as it was out of scope. most contains useful details about explorations with iso git / libgit2
