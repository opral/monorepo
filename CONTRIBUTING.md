# Contributing

Inlang is set up as [monorepo](https://monorepo.tools/) with [Nx](https://nx.dev/) (with caching some compile process for better dev/build performance).

## Getting started

1. Clone/Fork inlang's repository.
2. Open the repository folder in Visual Studio Code.
3. `pnpm install` to install dependencies.
4. `pnpm dev` to run the development environment.
5. `pnpm test` to run the tests.
6. `pnpm build` to compile a production build.

### For Windows users

To work on Windows, you will need to [change](https://pnpm.io/cli/run#script-shell) the shell, which is used to execute NPM scripts to `bash`, before running `pnpm dev`. A Git installation usually comes with a `bash` binary.

- `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` to set the shell to `bash` provided by your Git installation

## Debugging

1. Run `pnpm dev`.
2. Several debug launch configs can be found in the VSCode side menu. Select the correct one depending on the subject of your contribution and launch Debug mode.
