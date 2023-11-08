# @inlang/paraglide-js

##  1.0.0-prerelease.7

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

##  1.0.0-prerelease.6

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

##  1.0.0-prerelease.5

improve: `paraglide-js init` now adds the vs code extension if vscode is used

##  1.0.0-prerelease.4

add: `paraglide-js init` command which simplifies the setup process

## 	1.0.0-prerelease.3

fix: https://github.com/inlang/monorepo/issues/1478

## 	1.0.0-prerelease.1

### fix: Jetbrains based editors not detecting `@inlang/paraglide-js/{namespace}/messages` imports

The bug has been fixed by moving `./*/messages` above the less specifc `./*` export. 

```json
	"exports": {
		"./*/messages": "./dist/compiled-output/*/messages.js",
		"./*": "./dist/compiled-output/*/runtime.js"
	},
```
