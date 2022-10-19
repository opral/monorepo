# @inlang/core

The core module bundles "core" modules that depend on each other, and therefore must be distributed with the same version.

For example, the [ast module](./src/ast/) defines a schema that the [config](./src/config/) and [query](./src/query/) depend on. If the ast module has a breaking change, the config and query will have breaking changes too. Instead of publishing each of those related modules separately, with potentially different versions ("is config v2.0.3 compatible with ast v1.13.1?), those related modules are bundled and published under @inlang/core.

## Modules

Click on the modules to get to their respective READMEs.

- [@inlang/core/ast](./src/ast/) - The AST.
- [@inlang/core/config](./src/config/) - The config that powers inlang.
- [@inlang/core/query](./src/query/) - A query module for the AST.
