---
imports:
  - "https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-video.js"
---

# Contributing

> [!NOTE]
> This is based on the [monorepo's CONTRIBUTING.md](https://github.com/opral/monorepo/blob/main/CONTRIBUTING.md). If something is unclear, please refer to the monorepo's CONTRIBUTING.md and then open a PR to update this file.

<doc-video src="https://youtu.be/A5x4FALiOUg"></doc-video>

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

> [!IMPORTANT]  
> If you are developing on Windows, you need to use [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux).

## Development

### Getting started

1. Clone the monorepo.
2. `pnpm i`

> [!IMPORTANT]  
> The three dots `...` are important to build the dependencies. [Here](https://pnpm.io/filtering#--filter-package_name-1) is the pnpm documentation for filtering.

3. `pnpm --filter @inlang/paraglide-js... build`

### Making changes

1. Choose an [example](https://github.com/opral/monorepo/tree/main/inlang/packages/paraglide/paraglide-js/examples) to try out your changes.

2. Write a unit test for the change

## Opening a PR

1. run `pnpm run ci` to run all tests and checks
2. run `npx changeset` to write a changelog and trigger a version bumb. watch this loom video to see how to use changesets: https://www.loom.com/share/1c5467ae3a5243d79040fc3eb5aa12d6
