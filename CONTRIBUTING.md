# Contributing

This repository is set up as a [monorepo](https://monorepo.tools/) with [Nx](https://nx.dev/) (with caching some compile process for better dev/build performance).

## Getting started

1. Clone/Fork the repository.
2. Open the repository in Visual Studio Code.
3. Run `pnpm i` to install dependencies.
4. `pnpm --filter <package-name>... build` to build the dependencies of the package you want to work on.
5. `pnpm --filter <package-name> dev|test|lint` to run the scripts you are interested.
