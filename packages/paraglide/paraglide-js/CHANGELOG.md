# @inlang/paraglide-js

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
