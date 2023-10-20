---
"@inlang/sdk": minor
---

fix: 'module' not defined error

The error was caused by the variable `module` being shadowed by vitest types. 

```diff
export class ModuleHasNoExportsError extends ModuleError {
	constructor(options: { module: string; cause?: Error }) {
		super(
-			`Module "${module}" has no exports. Every module must have an "export default".`,
+			`Module "${options.module}" has no exports. Every module must have an "export default".`,
			options
		)
		this.name = "ModuleHasNoExportsError"
	}
}
```