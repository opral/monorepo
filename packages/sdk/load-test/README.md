# inlang sdk load-test

This repo can be used for volume testing, with more meesages than existing unit tests.

The test opens an inlang project and then generates json messages, overwriting ./locales/en/common.json. It can "mock-translate" those into 37 preconfigured languages using the inlang cli.

Lint-rule plugins are configured in the project settings but not subscribed (see usage).

To allow additional testing on the generated project e.g. with the ide-extension, the test calls `pnpm clean` when it starts, but not after it runs.

```
USAGE: pnpm test messageCount [translate] [subscribeToMessages] [subscribeToLintReports]
e.g.
      pnpm test 300
      pnpm test 1000 1 1 0

Defaults: translate: 1, subscribeToMessages: 1, subscribeToLintReports: 0
```

### mock rpc server
This test expects the rpc server from PR [#2108](https://github.com/opral/monorepo/pull/2108) running on localhost:3000 with MOCK_TRANSLATE=true

```sh
# in your opral/monorepo
git checkout 1844-sdk-persistence-of-messages-in-project-direcory
pnpm install
pnpm build
MOCK_TRANSLATE=true pnpm --filter @inlang/server dev
```

### install
```sh
git clone https://github.com/opral/load-test.git
cd load-test
pnpm install
```
This test is also available under /inlang/source-code/sdk/load-test in the monorepo, using workspace:* dependencies.

### run
```sh
pnpm test messageCount [translate] [subscribeToMessages] [subscribeToLintReports]
```

### clean
runs `git checkout ./locales`
```sh
pnpm clean
```

### debug in chrome dev tools with node inspector
passes --inpect-brk to node
```sh
pnpm inspect messageCount [translate] [subscribeToMessages] [subscribeToLintReports]
```
