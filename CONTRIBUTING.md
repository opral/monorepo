# Contributing

This repository is set up as a [monorepo](https://monorepo.tools/) with [pnpm](https://pnpm.io/) and [Nx](https://nx.dev/) for caching.

## Getting started

1. Clone/Fork the repository.
2. Open the repository in Visual Studio Code.
3. Run `pnpm i` to install dependencies.
4. `pnpm --filter <package-name>... build` to build the dependencies of the package you want to work on. Read more about the filter command of pnpm [here](https://pnpm.io/filtering#--filter-package_name-1).
5. `pnpm --filter <package-name> dev|test|lint` to run the scripts you are interested.
