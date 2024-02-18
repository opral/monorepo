# Contributing

Inlang is set up as [monorepo](https://monorepo.tools/) with [Nx](https://nx.dev/) (with caching some compile process for better dev/build performance).

## Getting started

1. Clone/Fork inlang's repository.
2. Open the repository folder in Visual Studio Code.
3. Run `doppler setup` to select the development config.
4. `doppler run -- pnpm install` to install dependencies.
5. `doppler run -- pnpm dev` to run the development environment.
6. `doppler run -- pnpm test` to run the tests.
7. `doppler run -- pnpm build` to compile a production build.

### For Windows users

To work on Windows, you will need to [change](https://pnpm.io/cli/run#script-shell) the shell, which is used to execute NPM scripts to `bash`, before running `doppler run -- pnpm dev`. A Git installation usually comes with a `bash` binary.

- `pnpm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"` to set the shell to `bash` provided by your Git installation

## Debugging

1. Run `doppler run -- pnpm dev`.
2. Several debug launch configs can be found in the VSCode side menu. Select the correct one depending on the subject of your contribution and launch Debug mode.

## Tips for running tests locally

Commands below assume that you are in the root of the monorepo.
You may find it helpful to `alias p='doppler run -- pnpm'` for brevity.

Before running tests or debugging locally, first run `doppler run -- pnpm install` and `doppler run -- pnpm build`

If you don't run a build, there is a chance that tests will use builds from a previous branch.

To rebuild everything without the nx cache, do `NX_SKIP_NX_CACHE=true doppler run -- pnpm build`. This is useful if you're building locally with a slow network.

Most tests will work without a local server, however the machine translation test (cli/src/commands/machine/translate.test.ts) requires the @inlang/server to be listening on localhost:3000 for rpc fetch() calls to the google translate api.

To make this test pass locally, start (all) the dev servers with `doppler run -- pnpm dev`
or  
start just the @inlang/server with `doppler run -- pnpm --filter @inlang/server dev`

To run tests for just one package e.g. `cli`
`doppler run -- pnpm --filter @inlang/cli test`
or  
`doppler run -- pnpm nx run @inlang/cli:test`

To run the full test suite: `doppler run -- pnpm test`

To re-run all the tests without the nx cache, do `NX_SKIP_NX_CACHE=true doppler run -- pnpm test`