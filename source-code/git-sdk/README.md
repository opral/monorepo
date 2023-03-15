# @inlang/git-sdk

This package bundles [wasm-git](https://github.com/petersalomonsen/wasm-git), specifically this [fork](https://github.com/nikitavoloboev/wasm-git) as it builds the version of [libgit2](https://github.com/libgit2/libgit2) that has support for shallow clones.

Rollup is used bundle everything. For use in different environments, browser/node.

## Note

Using libgit2 from web worker was evaluated initially but was decided against as it will blow up the complexity by a wide margin and seems unnecessary.

Web workers' main benefit is a non-blocking main thread. However, async functions were introduced 6 years after web workers to solve the blocking issue. While the underlying implementation differs, running everything on the main thread simplifies the architecture. State on the main thread and web workers does not need to be duplicated and synced.

We can run WebAssembly directly on the main thread.
