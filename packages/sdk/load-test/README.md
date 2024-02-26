# inlang sdk load-test repo with i18next

This repo can be used to simulate a repo with a larger numbers of meesages.

### test defaults
1. This test generates 1000 messages in english.
2. It then "mock-translates" those into 37 languages using the inlang cli.
3. lint plugins are configured in poject settings

### mock rpc server
This test expects the rpc server from PR [#2108](https://github.com/opral/monorepo/pull/2108) running on localhost:3000 with MOCK_TRANSLATION=true

```sh
# in your opral/monorepo
git checkout 1844-sdk-persistence-of-messages-in-project-direcory
pnpm install
pnpm build
MOCK_TRANSLATE=true pnpm --filter @inlang/server dev
```

### run load test
first start the mock rpc server (see above), then
```sh
pnpm test
```

### clean
```sh
pnpm clean
```

### debug in chrome dev tools with node inspector
```sh
pnpm inspect
```
