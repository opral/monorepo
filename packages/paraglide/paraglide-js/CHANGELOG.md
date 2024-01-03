# @inlang/paraglide-js

## 1.0.0

### Patch Changes

- Updated dependencies [bc5803235]
  - @inlang/sdk@0.20.0

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

FIX: type error https://github.com/inlang/monorepo/pull/1610#issuecomment-1801768825

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

BREAKING: Paraglide JS now compiles into source code, see https://github.com/inlang/monorepo/issues/1607.

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

improve: `paraglide-js init` now adds the vs code extension if vscode is used

## 1.0.0-prerelease.4

add: `paraglide-js init` command which simplifies the setup process

## 1.0.0-prerelease.3

fix: https://github.com/inlang/monorepo/issues/1478

## 1.0.0-prerelease.1

### fix: Jetbrains based editors not detecting `@inlang/paraglide-js/{namespace}/messages` imports

The bug has been fixed by moving `./*/messages` above the less specifc `./*` export.

```json
	"exports": {
		"./*/messages": "./dist/compiled-output/*/messages.js",
		"./*": "./dist/compiled-output/*/runtime.js"
	},
```
