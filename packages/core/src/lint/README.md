# `@inlang/core/lint`

This package provides the functionality to automatically check `Resources` for potential errors and other insights.

Use cases could be:
 - check if all `Messages` were translated to another language
 - check if the name of a brand always uses the same naming schema e.g. `MyApp` instead of `my-app` or `myApp`
 - check if the tone of a message does not sound aggressive
 - check if the translated message does not exceed a certain length
 - ... and probably a ton of other use cases. Please tell us if we should add one to this list.
 <!-- TODO: link to discussion -->

## Usage

> In the future we will provide a `CLI` to make it easier to use this package.

### custom implementation

You can use the `lint` function provided by `@inlang/core/lint`.

```ts
import { lint } from '@inlang/core/eslint'

const config = { } // the resolved config from `inlang.config.js`
const env= { } // the environment functions

const result = await lint(config, env)
```

The promise returns an `Array` of all `Resources`. The nodes of the `Resource` and it's children can have a `lint` attribute attached. If present, the `lint` attribute will contain an `Array` of `LintResults`. To make it easier to see if one of the lint rules reported a violation, `inlang` provides some [utility functions](#utility-functions).

#### utility functions

<!-- TODO -->

## Configuration

The `inlang.config.js` file supports a `lint` property you can use to configure the linting process.

The `lint` property expects an `Array` of [`rules`](#lint-rules) or [`collections`](#lint-collections). Rules can be configured by passing parameters to the function call.
 - the first parameter is the lint level. Currently supported levels are `'error'` and `'warn'`
 - the second parameter is a custom configuration for the given rule. Some rules may be configured and some rules might not support this.

You can also disable a rule by passing `false` as the first parameter.

_inlang.config.js_
```js
/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
	 lint: {
		rules: [
			// uses the standard configuration
			missingKeyRule(),
			// set's the lint level to 'warn'
			missingKeyRule('warn'),
			// uses the standard lint level and passes custom settings to the rule
			missingKeyRule(true, { threshold: 4 }),
			// disables the rule if it runs on mondays
			missingKeyRule(!isTodayMonday),
		]
	 }
  }
}
```

## Lint Rules

There already exist some lint rules you can use to check your `Resources` against.
<!-- TODO: link to awesome-inlang repo -->
Or you can write your own rules.

### Creating your own lint rule

<!-- TODO -->
<!-- show utility functions to create a rule -->
<!-- how to pass configuration -->
<!-- how to type it correctly -->
<!-- what does the function need to return -->
<!-- describe visitors -->
<!-- describe what enter and leave does -->
<!-- show how payload works -->
<!-- show an example -->

## Lint Collections

Lint collections are a way to group rules together. You can pass a collection to the config like you would do with regular rules. You can also customize and disable specific rules of a collection by passing an argument to the function call. A collection accepts an object where the keys are the name of the provided rule and the values are the configuration for that rule.

_inlang.config.js_
```js
/**
 * @type {import("@@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
  return {
    referenceLanguage: "en",
    languages: ["en", "de"],
	 lint: {
		rules: [
			// uses the standard configuration
			inlangStandardRules(),
			// set's the lint level for the `missingKey` rule to 'warn'
			inlangStandardRules({
				missingKey: 'warn',
			}),
			// uses the standard lint level and passes custom settings to the `missingKey` rule
			inlangStandardRules({
				missingKey: [true, { threshold: 4 }],
			}),
			// disables the `missingKey` rule if it runs on mondays
			inlangStandardRules({
				missingKey: !isTodayMonday,
			}),
		]
	 }
  }
}
```

### Creating your own lint collection

<!-- TODO -->
<!-- show utility functions to create a collection -->
<!-- how to pass configuration -->
<!-- how to type it correctly -->
