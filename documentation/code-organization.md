---
title: Code organization
href: /documentation/code-organization
description: How inlangs code is organized.
---

# {% $frontmatter.title %}

[Inlangs repository](https://github.com/inlang/inlang) is organized as a [monorepo](https://monorepo.tools/). It consists of the following packages:

- `core`: Lays the fundament of inlang. It defines the aspects AST, config and query, as well as some commonly used utils.
- `design-system`: Contains common design identity of the project.
- `git-sdk`: Offers the tools to integrate directly into git.
- `ide-extension`: Contains the VSCode extension.
- `website`: Relates to everything you can find on this website and the editor, which will become its own package.

## Version management

Versions are following [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). As we are currently in our [initial development phase](https://semver.org/spec/v2.0.0.html#spec-item-4) the API should not be considered as stable.

## Release management

Releases are managed with [changesets](https://github.com/changesets/changesets). If your change impacts the version according to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html), the change should be described.

The [changeset-bot](https://github.com/apps/changeset-bot) helps to organise this workflow, by posting on someones pull requests with instructions.

The [Changesets Release Action](https://github.com/changesets/action) organizes pull requests which trigger a release of the next version, according to the described changesets.

{% Feedback /%}
