# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

> [!IMPORTANT]  
> If you are developing on Windows, you need to use [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux). 

## Development

1. Clone the repository
2. run `pnpm i` in the root of the repo
3. run `pnpm --filter <package-name>... build` to build the dependencies of the package you want to work on
4. run `pnpm --filter <package-name> dev|test|...` to run the commands of the package you work on
   
### Example

> [!IMPORTANT]  
> You need to run the build for the dependencies of the package via the three dots `...` at least once. [Here](https://pnpm.io/filtering#--filter-package_name-1) is the pnpm documentation for filtering.

1. `pnpm i`
2. `pnpm --filter @inlang/paraglide-js... build`
3. `pnpm --filter @inlang/paraglide-js dev`

## Opening a PR

1. run `pnpm run ci` to run all tests and checks
2. run `npx changeset` to write a changelog and trigger a version bumb. watch this loom video to see how to use changesets: https://www.loom.com/share/1c5467ae3a5243d79040fc3eb5aa12d6

