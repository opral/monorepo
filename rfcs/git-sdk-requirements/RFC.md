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

## Git implemented in JS

### Context

Inlang currently uses Isomorphic Git for Git operations together with memfs for file system.

Going with this approach for future Git SDK means adding missing commands that Isomorphic Git now lacks.

At least sparse checkout and rebase are needed. Neither of those features are implemented in Isomorphic Git currently.

### Questions

#### Q: If we use a JS implementation, will we run into foreseeable performance issues that would be solved by libgit2?

Nearly all git operations especially ones you'd want to do in context of a browser won't be computationally heavy.

The heaviest git operations would most likely be comitting many files but even in this case, JS can do it quite fast even on large amount of content.

> note: come up with an application idea that would need to do something heavy in git inside a browser

Currently the biggest issue that Inlang editor faces are not IO bound but its waiting for the network to get the right files and content to render.

Thus the need to implement sparse-checkout feature to only fetch specific files or folders you need.

`clone` = fetches git details from network such as files, git objects to put into .git folder (network bound)

`add` = scans over added files, create entry in `.git` (even if many files added, should be instant)

Most other git commands like `rebase` or `commit` won't do much else so all operations should be near instant.

> go through the list of to be supported git commands and be more thorough in analysis of perf

> ideally benchmark some commands

We can also potentially delegate some heavy git operations to a web worker. To run some things in parallel and not block the main and only JS thread. Given the explanation presented in the previous section, this option should not be needed. However, offloading IO or computational work to web worker and waiting for response is possible if needed.

#### Q: Does it make sense to run Isomoprphic Git and/or file system in a web worker?

No, for above reason. It's not worth the complexity and there is no need for it.

#### Q: How difficult would it be to add missing commands?

Hard to predict but Isomorphic Git has some active contributors still. For example [abortMerge](https://github.com/isomorphic-git/isomorphic-git/pull/1744) was added recently.

A `sparse-checkout` or `rebase` command would be taking that PR as template and making the logic work for respective command.

By checking out how the code is done in quite a few git implementations out there. Some have already implemented it. In the worst case, you can read main [Git code](https://github.com/git/git) and figure out how those commands work from first principles and implement them.

Paying attention that we are running in a browser context and not all details are needed, simplifies things a lot.

#### Q: Will using Isomorphic Git answer to all stated goals above?

✅ = already done
🚧 = work required
❎ = not possible

Goal 1: Must run in the browser/on the client [High Confidence] ✅

Goal 2: Lazy loading of files and git history [High Confidence] 🚧

Is achievable in a few ways. But in current state would require sparse checkout to be implemented.

Goal 3: Must be git compatible but not necessarily up to spec [Medium Confidence] ✅

No issue here. Isomorphic Git is already git compatible, if we decide to extend it with new features we can have a fork of Isomorphic Git potentially or bring commands up to spec and merge them into Isomorphic Git repo.

Goal 4: (Future) File-based auth [High Confidence | Server-related ] 🚧

Is part of server so outside of Iso Git scope.

> note: maybe wrong

Goal 5: (Future) Support for large files out of the box [Medium Confidence] 🚧

> note: need to research more to give good estimate how doable this is to add

There is [open issue on this](https://github.com/isomorphic-git/isomorphic-git/issues/1375).

Goal 6: (Future) Plugin system to support different files [Medium Confidence] 🚧

Would be doable to add irrespective of whether libgit2 or Isomorphic Git is chosen.

#### Q: Could Git SDK abstract away the file system and expose git app focused API only?

> note: can be removed from RFC, just some thinking out loud

> hypothethisizing making Git SDK have tight integration with the FS

> only exposing the actual useful commands you would need to build Git based apps

Perhaps outside of the discussion of this RFC but still maybe interesting to discuss. Or perhaps create new RFC?

It would be potentially interesting to see a Git SDK that would also abstract working with the file system all together.

This would mean, there would be no need to pass `fs` to every git operation. You would just do:

```js
const inlang = await gitSDK.clone("https://github.com/inlang/inlang.git")
```

And you get back a fully fledged file system fetched from the repo. As the SDK is focused on running on context of browser.

Above function call can do a fetch of just enough resources to do further actions.

`git clone --depth 1 --sparse --no-checkout --filter=blob:none https://github.com/inlang/inlang`

After this an app would most likely want to fetch a file to edit. It can do:

```js
// checkout just this file and put it in the fs (using sparse-checkout)
await inlang.checkoutFile("inlang.config.js")

// `.fs` is one way you can get access to the file system
// readFile returns a string representation of the file so you can modify it
let inlangConfig = await inlang.fs.readFile("inlang.config.js")
// it would be great if `inlang` type definition would update on 'checkout', 'clone'
// so typescript can complain 'inlang.config.js' file is not there

// then you can make edits to inlangConfig string that
// it could be the case that inlangConfig not a normal variable
// but a signal returned (to work with solid) or hook (for react)

// where inlangConfig is the modified version
// aware there are most likely issues with just editing file like this
// i'm sure there is a better way more streamlined way to make an edit to something and
// commit it to fs after
// this is just one example of how it can happen
inlangGit.overwriteFile("inlang.config.js", inlangConfig)

// Then git add the file
inlangGit.add("inlang.config.js")

// Commit
inlangGit.commit("inlang.config.js: update readResources")

// And git push
const conflicts = await inlangGit.push("inlang.config.js")

// Can also get conflicts on pull
const conflicts = await inlangGit.pull()

// you try fix conflicts and
inlangGit.push() // until it succeeds
```

Sparse-checkout under the hood does this (for reference):

```
git config core.sparseCheckout true
echo "inlang.config.js" >> .git/info/sparse-checkout
git checkout
```

The API for above is quite readable and nice. And powerful too in some ways. As you don't have to think about how fetch happens. It's done for you automatically.

```js
const inlang = await gitSDK.clone("https://github.com/inlang/inlang.git", { depth: 1 })
```

You can also as second arg to `clone` send some options to already fetch up to certain depth of commits or any other option that would make sense to run for Git to be run in the browser.

In many ways this opens up the API surface too and lets us explore what to expose to users and what not. A lot of complexity can be hidden away. Namely all the memfs api learning you will need to do, together with more lines of code and potential bugs.

This can be spinned up into a new RFC and discussed, just wanted to add this as it can influence the choice of whether it makes sense to go with Git compiled to WASM approach or Git in JS.

This can use either isomorphic git or libgit2 under the hood. FS implementation is abstracted away.

> note: need to read through lg2.js code to see whether Emscripten is node fs api like

> note: how would this work with real time collaboration?

> on second review this idea might not make sense as perhaps part of 'git thesis'

> is access to the fs itself, not fetched through git sdk interface

> however if that interface is indistinguishable from the file system but with git powers attached

> why pass some fs and complicate setup potentially

## Git compiled to WASM

### Context

The reason you'd want to move to libgit2 is that libgit2 supports more options out of the box. And potentially performance.

### Questions

#### Q: Is git compiled to WASM faster than JS implementation?

Most likely yes as WASM in general is faster. Compilation is done by [Emscripten](https://emscripten.org/).

It takes the C code and creates a `.wasm` file.

libgit2 was not written with WASM in mind but it still will most likely be faster than isomorphic git.

The resulting `.wasm` file in `Release` mode is ~ 830 KB.

#### Q: What are missing APIs Git SDK will need. Does libgit2 provide them?

libgit2 is written in C. So changes to it must be made in C too if libgit2 doesn't support a certain feature.

Fortunately it seems libgit2 supports all the needed features Inlang needs. And potentially other features that other companies building on Git SDK will need.

From list shared above with checkboxes for available API. API of libgit2 is [here](https://libgit2.org/libgit2/#HEAD).

```js
// elementary
clone() // ✅ https://libgit2.org/docs/guides/101-samples/#repositories_clone_simple
shallowClone() // ✅ part of clone, there is open pr for it that builds, tested it works!
commit() // ✅ https://libgit2.org/docs/guides/101-samples/#commits
push() // ✅ https://stackoverflow.com/questions/28055919/how-to-push-with-libgit2
pull() // ✅ https://stackoverflow.com/questions/39651287/doing-a-git-pull-with-libgit2
sparseCheckout() // ❓ https://github.com/libgit2/libgit2/issues/2263 (open pr, need to build, test)

// branch related
currentBranch() // ✅ https://stackoverflow.com/questions/12132862/how-do-i-get-the-name-of-the-current-branch-in-libgit2
createBranch() // ✅ https://libgit2.org/libgit2/#HEAD/group/branch/git_branch_create
renameBranch() // ✅ https://libgit2.org/libgit2/#v0.17.0/group/branch
switchBranch() // ✅ https://stackoverflow.com/questions/46757991/checkout-branch-with-libgit2
deleteBranch() // ✅ https://libgit2.org/libgit2/#v0.17.0/group/branch/git_branch_delete

// change related
// (3 API different "changes" concepts...)
unstagedChanges() // ❓ didn't find example with this, but it may exist
uncommittedChanges() // ❓ didn't find example too
unpushedChanges() // ✅ https://stackoverflow.com/questions/42131934/get-unpushed-commits-with-libgit2

// host like GitHub or GitLab dependent
// ouside of libgit2 scope
// would need to be built as part of Git SDK and send relevant commands to libgit2
signIn()
signOut()
createFork()
syncFork()
openPullRequest()
```

#### Q: Is 833 KB WASM file an issue to load?

Should be non issue as its under 1 MB.

#### Q: Can you keep the file system inside WASM too?

No, you can't. There is no file system in the WebAssembly runtime.

#### Q: How does the architecture with this approach look?

[WASM Git](https://github.com/petersalomonsen/wasm-git) reccomends using it through a [web worker](https://github.com/petersalomonsen/wasm-git#example-webworker-with-pre-built-binaries). For unclear benefit.

> note: need to understand the reasoning more, perhaps there is a good reason.

When you compile libgit2 to wasm with Emscripten, as build artefacts, you get `lg2.wasm` file that is the libgit2 itself. And also `lg2.js`.

The purpose of `lg2.js` file is to provide the file system for libgit2 to sync with.

The code for `lg2.js` is quite hard to read and would need to be rewritten to be more nice to use and iterate on.

It does already do these 2 things that are useful:

1. Exposes a `libgit` variable with a `callMain` function.

You would then do:

```js
FS.mkdir("/")
FS.mount(MEMFS, {}, "/")
FS.chdir("/")
const result = libgit.callMain(["clone", "https://github.com/inlang/inlang.git", "inlang"])
FS.chdir("inlang")
```

You can expose different C functions that run the commands. For example, we have built [open pr for shallow clones](https://github.com/libgit2/libgit2/pull/6396) and exposed it via a new method for `callMain`:

```js
const result = libgit.callMain(["shallowClone", "https://github.com/inlang/inlang.git", "inlang"])
```

That function was same as clone, just also set `clone_opts.fetch_opts.depth` option before doing the clone. Extending libgit2 with new commands would work in the same way.

2. The `lg2.js` file also gives file system for git to work with. [Emscripten File System](https://emscripten.org/docs/api_reference/Filesystem-API.html) to be precise.

> warning: this might be false. I need to read through lg2.js to say for sure.

But essentially at least in examples provided, `FS` variables corresponds to Emscripten File System.

#### Q: Does it make sense to continue using Emscripten File System or it should be replaced with something else?

The answer to it would require more studying of how that part works to say for sure.

[libgit2 clone API](https://libgit2.org/libgit2/#HEAD/group/clone/git_clone) as arg accepts `local_path` which is `local directory to clone to` and `git_repository` which is `pointer that will receive the resulting repository object`.

> note: I need to study this further to make a conclusive answer.

Currently provided `lg2.js` file seems to be doing all the file system <> git interfacing.

#### Q: How would replacing Emscripten File System with another file system look like?

There was a proposal above to abstract the file system away from the user and expose everything via Git SDK API. If that's the case, we can continue using Emscripten File System in theory and build on top of it.

> note: needs more study, specificly that lg2.js that is the build output of wasm-git

Assuming user sends file system as argument in similar way that happens in Iso Git now.

Somehow when calls to git operations through WASM are are made, the results should be reflected in the file system.

> note: need to test this out, see output in console etc of what happens when clone happens etc.

There is documented [API on calling WASM](https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API).

Need to read through the API exposed by libgit2 to say for sure.

> note: not sure what the interface of FS that libgit2 expects, need to test

#### Q: Do you need to run Git operations in Git SDK in a web worker?

Assuming we figure out how TS communicates nicely with Git commands that get executed in WASM. And for changes to reflect in a file system provided, there would ne no need for a web worker to be there.

#### Q: Can we bundle WASM in Git SDK and abstract using WASM over nice API?

[rollup/plugin-wasm](https://www.npmjs.com/package/@rollup/plugin-wasm) can potentially be used.

However when it was used last time, there were errors.

#### Q: Will using libgit2 compiled to WASM answer to all stated goals above?

✅ = already done
🚧 = work required
❎ = not possible

Goal 1: Must run in the browser/on the client [High Confidence] ✅

Calling into `.wasm` from JS, then in turn saving everything in the FS provided.

Goal 2: Lazy loading of files and git history [High Confidence] 🚧 close to ✅ potentially

sparse checkout is supported on a fork for libgit2. It needs to be compiled and tested.

JS code needs to be written to abstract the lazy loading using sparse checkout to make it possible.

Goal 3: Must be git compatible but not necessarily up to spec [Medium Confidence] ✅

No issue here for same reason as Isomorphic Git. We use commands from libgit2 we need.

However the barrier to contributing to libgit2 itself is going to be that command is fully spec compliant so we need to be aware of that.

Goal 4: (Future) File-based auth [High Confidence | Server-related ] 🚧

Is part of server so outside of scope.

> note: maybe wrong

Goal 5: (Future) Support for large files out of the box [Medium Confidence] 🚧/✅

There is open discussion [here](https://github.com/git-lfs/git-lfs/issues/375). But from looks of it, it's supported but may bring issues.

Goal 6: (Future) Plugin system to support different files [Medium Confidence] 🚧

Would be doable to add irrespective of whether libgit2 or Isomorphic Git is chosen.

## Conclusion

Having written above, I believe going with libgit2 compiled to WASM option will allow us to potentially move faster in near future. As we won't need to implement sparse-checkout and rebase.

Both features need some git know how and time to implement.

With libgit2 we get those features out of the box.

Performance is not a concern in either case so the other focus is on DX.

I think you can provide the same Git SDK API regardless whether Isomorphic Git is chosen or libgit2 to do git operations.

As for regretting choose either technology in the future. We would potentially need to think through different kinds of applications that will be built with Git SDK. Some are done as part of this RFC below.

If many features will not be available in libgit2, then it would most likely make more sense to use Isomorphic Git as it's much easier to iterate on JS code than C (potentially).

## Implementation details

> Below are implementation details for both Iso Git and WASM Git

> They were used as explorations of what is required in more practical terms

> To complete each of the solutions.

### Implementation details for Isomorphic Git

> Potentially out of scope of this RFC but are here to give more context to questions/answers above

> Can be used to approximate amount of work needed to complete the transition

Iso Git works by attaching a file system to all the commands. Many of primitives for working with `.git` content is exposed via functions in Isomorphic Git.

For sparse git checkout of particular file, here is CLI version:

```
git clone --depth 1 --sparse --no-checkout --filter=blob:none https://github.com/inlang/inlang
cd inlang
git config core.sparseCheckout true
echo "inlang.config.js" >> .git/info/sparse-checkout
git checkout
```

You can do normal [clone](https://isomorphic-git.org/docs/en/clone) already but that takes too long. Shallow clone with depth 1 is available but that still takes 10+ seconds on some repos.

So to implement a sparse checkout of just one file or folder, you would need to implement these options inside Iso Git.

There is no `sparse` option. There is no `--filter=blob:none` option. No `--no-checkout` either. You have to implement all 3 if you want to do a fast clone of just minimal git info to get going.

![Options eplained](./git-clone-explained.png)

> Why you need the options

![Options eplained](./git-clone-explained-2.png)

There is also a way to achieve above with `git init` and orphan branch. Speed wise, they are the same. In `git init` you just create a folder yourself.

We don't technically need to do `git config core.sparseCheckout true` as we don't need to be up to git spec. There is [setConfig](https://isomorphic-git.org/docs/en/setConfig) option though so it's no issue to do this part.

`echo "inlang.config.js" >> .git/info/sparse-checkout` tells sparse-checkout what to checkout on next `git checkout`.

So we need to figure out what happens when `git checkout` happens in `sparseCheckout` true mode. The `sparse-checkout` file looks like this:

```
/*
!/*/
inlang.config.js
packages/web/localizations
```

It lists paths to checkout. So need to figure out how to do a git fetch with just those files. [Fetch](https://isomorphic-git.org/docs/en/fetch) needs to be adapted for it.

For rebase, it might be easier too as it's implemented in quite a few git implementations unlike sparse-checkout surprisingly. So can translate that code to JS.

My understanding of rebase is that it shold take a look at some commits and turn them into one. This should be doable to do with some git primitives exposed by isomorphic git.

If we can implement rebase and sparse-checkout, adding other commands shouldn't be a problem to implement either.

Performance should be of no concern. You are not doing anything heavy as far as operations go.

### Implementation details for WASM Git

> Currently exploring this approach to rebuild current Inlang editor with libgit2

> check maybe Emscripten has option to change output of lg2.js generated

> if can't fix with that approach, then try rewrite lg2.js so it can run in solid code

> check how Emscripten file system api works how create nice DX functions around it

> how would file sync work in this setup?

> in theory it should work as all commands with actual git work get sent to lg2.wasm. it responds with something

> and file system updates. real time etc can be built on top as file system can be exposed fully

> or be implementation detail of git sdk

> check how you can achieve full reactivity and how would periodic git pulling work

Git is compiled to wasm using libgit2. Right now with wasm-git when it builds, it provides .wasm file. And one .js file emitted by Emscripten I think that comes with the FS and exposes a function `libgit` and maybe more things.

You can then call `libgit.main()` to send commands to actual git. If it's a clone, it will clone it into Emscripten FS, exposed via `FS` global variable.

Git WASM gives 2 examples in repo, one in [web worker](https://github.com/petersalomonsen/wasm-git#example-webworker-with-pre-built-binaries) and 1 in [browser](https://github.com/petersalomonsen/wasm-git#use-in-browser-without-a-webworker).

> to be completed

<!-- In web worker, you would put code in web-worker.js file. Inside it you will write a pattern matcher for kinds of commands the worker accepts and does the git command asked and replies with information, if any.

For example when you do:

`const inlang = await gitSDK.clone("https://github.com/inlang/inlang.git")`

In `clone` function, it would start a web worker. And pass a message to it `clone(repo)`. Web worker replies with answer. Users get back what it returns in their web apps.

Perhaps web workers are not needed at all for this. I would need to read more on webassemebly and how it interfaces with js. I just thought that to do git commands, if those exist in wasm, you'd need to send file system there or part of it to do the git command. libgit2 wasm doesn't come with its own file system, thats what lg2.js file is for. Which I need to read to understand this situation better.

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

As I am writing this. This to me seems like a nice way to abstract working with remote git repos. Outside of scope of this RFC though. -->

## Potential Apps built with Git and what would they need

> API is up for discussion

> depending on how it goes we could maybe create out of git spec api

> i.e. checkoutFile() below

> below api assumes fs is provided and is part of the SDK

> need to think through how reactivity would work in such example

> i assume now somehow memfs is made reactive

> perhaps as return to the Git SDK, it would create signals you can listen to

> for easy integration with say solid

> for react, a hook could be provided

> so what is return is to be decided for

### Inlang

> if fs is not passed on

> whats the best way to read content of a file

```
clone(url: string)
checkoutFile(file: string) // sparse checkout the file | i.e. ("inlang.config.js")
commit(message: string)
push()
showHistory(file: string)
```

### Git History

```
clone(url: string)
showHistory(file: string)
```

### Text editor

> probably same as inlang

### Video/image editor

> perhaps not video but image can certainly be done
> should use git lfs for video at least
