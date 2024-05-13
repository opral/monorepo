# inlang sdk load-test
package for volume testing

- The test starts by opening an inlang project with just one english message.
- It generates additional engish messages, overwriting either ./locales/en/common.json
  or ./project.inlang/messages.json (depending on experimental.persistence)
- It can "mock-translate" those into 37 preconfigured languages using the inlang cli.
- Lint-rule plugins are configured in the project settings but lint reports are not subscribed, unless requested.
- The test uses the i18next message storage plugin (undless experimental.persistence is set)
- To allow additional testing on the generated project e.g. with the ide-extension, the test calls `pnpm clean` when it starts, but not after it runs.

```
USAGE:
  pnpm test messageCount [translate] [subscribeToMessages] [subscribeToLintReports] [watchMode]
e.g.
  pnpm test 300
  pnpm test 100 1 1 0

Defaults: translate: 1, subscribeToMessages: 1, subscribeToLintReports: 0, watchMode: 0
```

### to configure additional debug logging
`export DEBUG=sdk:acquireFileLock,sdk:releaseLock,sdk:lintReports,sdk:loadProject`

### to translate from separate process
1. Run pnpm test with translate:0, watchMode:1 E.g. `pnpm test 100 0 1 1 1`
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
