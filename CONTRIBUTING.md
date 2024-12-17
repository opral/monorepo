# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher)

## Development

1. Clone the repository
2. run `pnpm i` in the root of the repo
3. run `pnpm --filter <package-name>... build` to build the dependencies of the package you want to work on
4. run `pnpm --filter <package-name> dev|test|...` to run the commands of the package you work on
   
### Example
1. `pnpm i`
2. `pnpm --filter @inlang/paraglide-js... build`
3. `pnpm --filter @inlang/paraglide-js dev`

## Opening a PR

1. run `pnpm run ci` to run all tests and checks
2. run `npx changeset` to write a changelog and trigger a version bumb

