# @inlang/paraglide-js

## 1.3.3

### Patch Changes

- 11f0e18: Update dependency
- 10e3c28: fix JSDoc annotations on message aliases

## 1.3.2

### Patch Changes

- 45975c0: Fail gracefully if adding `.vscode` folder fails

## 1.3.1

### Patch Changes

- afaaffa: Bundle `@inlang/cross-sell-sherlock`. This is used to promot _once_ during `paraglide-js init` to ask if you want to install the Sherlock vscode extension

## 1.3.0

### Minor Changes

- 4970afc: paraglide deprecate aliases
- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

### Patch Changes

- @inlang/cross-sell-sherlock@0.0.2

## 1.2.9

### Patch Changes

- a99e35fee: use `@inlang/cross-sell-sherlock` during vscode extension initialization
- Updated dependencies [a99e35fee]
  - @inlang/cross-sell-sherlock@0.0.2

## 1.2.8

### Patch Changes

- b0f1e908b: Prompt user for tech-stack when running `paraglide-js init` & recommend Adapters

## 1.2.7

### Patch Changes

- f6ec6cdc9: bump `@inlang/sdk` dependency

## 1.2.6

### Patch Changes

- 960f8fb70: rename the vscode extension to "Sherlock"

## 1.2.5

### Patch Changes

- 00f181ad3: fix broken dependency

## 1.2.4

### Patch Changes

- Updated dependencies [244442698]
  - @inlang/language-tag@1.5.0

## 1.2.3

### Patch Changes

- 4c26fa70a: bump dependencies

## 1.2.2

### Patch Changes

- 613ef9877: fix: Bump `@lix-js/client` dependency

## 1.2.1

### Patch Changes

- 74dc1f8c6: Update dependencies
- 4ae6295d0: Detect when `paraglide-js init` is being run inside the VsCode terminal and skip the VsCode question if so
- Updated dependencies [74ac11c47]
  - @inlang/language-tag@1.4.0

## 1.2.0

### Minor Changes

- 0f0e8496d: Throw runtime error if `languageTag()` returns a non-language tag value

## 1.1.1

### Patch Changes

- 7ea9753fb: Improve onboarding message
- 4277232db: fix: better formatting of messageID fallbacks

## 1.1.0

### Minor Changes

- cd29edb11: bumbing fixed env var dependecy issue affected packages

## 1.0.0

Bump Version to 1.0 as no more breaking changes are expected.

## 1.0.0-prerelease.26

Hotfix: Bundle SDK

## 1.0.0-prerelease.25

Update dependencies

## 1.0.0-prerelease.24

feat: Support language Fallbacks according to BCP 47 specification

## 1.0.0-prerelease.23

Update dependencies

## 1.0.0-prerelease.22

Update dependencies

## 1.0.0-prerelease.21

feat: Handle variables that have invalid JS identifiers as names.
fix: Better text escaping in the compiler.
fix: Compiler now fails reliably when a message ID is an invalid JS identifier.

## 1.0.0-prerelease.20

Paraglide now checks if the messages have actually changed before recompiling. This should improve reliability and performance.

## 1.0.0-prerelease.19

fix: Fix inlang/internal#195

## 1.0.0-prerelease.18

`paraglide-js init` now adds `@inlang/message-lint-rule-valid-js-identifier` by default.

## 1.0.0-prerelease.17

`paraglide-js init` now adds `paraglide-js compile` to the postinstall script by default. This sidesteps numerous linting issues when using paraglide in CI environments.

## 1.0.0-prerelease.16

Fix `paraglide-js compile` hanging for a couple seconds after successful compilation

## 1.0.0-prerelease.15

Fix crash when using `npx @inlang/paraglide-js init` and selecting vscode.

## 1.0.0-prerelease.14

Added `--watch` flag to the `paraglide-js compile` command. This will keep the process alive and recompile whenever messages are changed.

```bash
paraglide-js compile --project ./project.inlang --watch
```

## 1.0.0-prerelease.13

`./paraglide/runtime.js` now exports a function called `isAvailableLanguageTag`. This is
the recommended way to check if something is a valid language tag, while maintaining
type safety.

```ts
//Pseudo code
import { isAvailableLanguageTag } from "./paraglide/runtime"

if (isAvailableLanguageTag(params.lang)) {
	return renderSite(params.lang)
} else {
	return 404
}
```

## 1.0.0-prerelease.12

[Internal Change]
Expose the compiler so that bundler plugins can call it programmatically instead of going through the CLI.

## 1.0.0-prerelease.11

`onSetLanguageTag` no longer throws when called multiple times. Newer callbacks will overwrite old ones.
Developers still should not call `onSetLanguageTag` multiple times, this is needed for HMR to work reliably.

Big thanks to [@KraXen72](https://github.com/KraXen72) for helping us find this bug.

## 1.0.0-prerelease.10

Add an optional options argument to message functions, to allow forcing a languageTag regardless of which languageTag is currently set.

```ts
import * as m from "./paraglide/messages"
const msg = m.hello({ name: "John" }, { languageTag: "de" })
```

## 1.0.0-prerelease.9

The `paraglide-js init` command now uses the [inlang message format](https://inlang.com/m/reootnfj) 2.0 which is human readable.

## 1.0.0-prerelease.8

IMPROVE: Paraglide now splits messages into different resource files as a step towards splitting messages by language via a bundler plugin.

```ts
import * as en from "./paraglide/messages/en"
import * as de from "./paraglide/messages/de"

en.hello()
de.hello()
```

## 1.0.0-prerelease.7

FIX: type error https://github.com/opral/monorepo/pull/1610#issuecomment-1801768825

```diff
export const currentLanguageTag = (params) => {
+	/** @type {Record<string, string>} */
	const variants = {
		en: `The current language tag is "${params.languageTag}".`,
		de: `Der aktuelle Sprachtag ist "${params.languageTag}".`,
	}
	return variants[languageTag()] ?? "currentLanguageTag"
}
```

## 1.0.0-prerelease.6

BREAKING: Paraglide JS now compiles into source code, see https://github.com/opral/monorepo/issues/1607.

What you need to change:

1. Remove `--namespace` from the compile command
2. Replace imports from paraglide to point to the directory in ther source code:

```diff
-import { setLanguageTag, languageTag } from '@inlang/paraglide-js/sveltekit-example';
+import { setLanguageTag, languageTag } from '../../paraglide-js/runtime';
-import * as m from "@inlang/paraglide-js/sveltekit-example/messages"
+import * as m from "../../paraglide-js/messages"
```

## 1.0.0-prerelease.5

improve: `paraglide-js init` now adds the Visual Studio Code extension (Sherlock) if vscode is used

## 1.0.0-prerelease.4

add: `paraglide-js init` command which simplifies the setup process

## 1.0.0-prerelease.3

fix: https://github.com/opral/monorepo/issues/1478

## 1.0.0-prerelease.1

### fix: Jetbrains based editors not detecting `@inlang/paraglide-js/{namespace}/messages` imports

The bug has been fixed by moving `./*/messages` above the less specifc `./*` export.

```json
	"exports": {
		"./*/messages": "./dist/compiled-output/*/messages.js",
		"./*": "./dist/compiled-output/*/runtime.js"
	},
```
