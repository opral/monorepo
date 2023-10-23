# @inlang/paraglide-js

## 1.0.0

### Patch Changes

- 58b469102: Update Readme, show help when error in cli

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
