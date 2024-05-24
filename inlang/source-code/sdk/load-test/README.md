# package @inlang/sdk-load-test
The default `test` script runs a load-test with 1000 messages and translation enabled. For more messsages and different load-test options, use the `load-test` script.

```
USAGE:
  pnpm load-test messageCount [translate] [subscribeToMessages] [subscribeToLintReports] [watchMode]
e.g.
  pnpm load-test 300
  pnpm load-test 100 1 1 0

Defaults: translate: 1, subscribeToMessages: 1, subscribeToLintReports: 0, watchMode: 0
```

### what it does
- The test starts by generating engish messages in ./locales/en/common.json
  or ./project.inlang/messages.json (depending on experimental.persistence)
- It then calls loadProject() and subscribes to events.
- It mock-translates into 36 languages using the inlang cli.
- It uses the i18next message storage plugin (unless experimental.persistence is set)
- To allow additional testing on the generated project e.g. with the ide-extension, the test calls `pnpm clean` when it starts, but not after it runs.

### to configure additional debug logging
`export DEBUG=sdk:*` for wildcard (most verbose) logging and to see more specific options.
e.g. `export DEBUG=sdk:lockFile`

### to translate from separate process
1. Run pnpm load-test with translate:0, watchMode:1 E.g. `pnpm load-test 100 0 1 1 1`
2. In another terminal, run `pnpm translate`

### to toggle experimental persistence
Modify project.inlang/settings.json to add/remove (The whole persistence key must be removed, you cannot set it to false.)

```json
	"experimental": {
		"persistence": true
	}
```

### to debug in chrome dev tools with node inspector
Passes --inpect-brk to node.
```sh
pnpm inspect messageCount [translate] [subscribeToMessages] [subscribeToLintReports] [watchMode]
```
