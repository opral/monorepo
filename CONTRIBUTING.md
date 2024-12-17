# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

## Getting started

1. Clone the repository
2. run `pnpm i` in the root of the repo
3. run `pnpm --filter <package-name>... build` to build the dependencies of the package you want to work on
4. run `pnpm --filter <package-name> dev|test|...` to run the commands of the package you work on

## Example

To work on the `@inlang/paraglide-js` package, you would run:

1. `pnpm i`
2. `pnpm --filter @inlang/paraglide-js... build`
3. `pnpm --filter @inlang/paraglide-js test`

