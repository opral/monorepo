---
title: Lint
href: /documentation/lint
description: Check `Resources` for potential errors and other insights.
---

# {% $frontmatter.title %}

This package provides the functionality to automatically check `Resources` for potential errors and other insights.

Use cases could be:

- check if all `Messages` were translated to another language
- check if the name of a brand always uses the same naming schema e.g. `MyApp` instead of `my-app` or `myApp`
- check if the tone of a message does not sound aggressive
- check if the translated message does not exceed a certain length
- ... and probably a ton of other use cases. Please [tell us](https://github.com/inlang/inlang/discussions/406) if we should add one to this list.

## Usage

> Note: In the future we will provide a `CLI` to make it easier to use this package.

### custom implementation

You can use the `lint` function provided by `@inlang/core/lint`.

```ts
import { lint } from "@inlang/core/eslint"

// lint takes a subset of the inlang.config.js file and the resources as arguments
const result = await lint({ config, resources })
```

The promise returns an `Array` of all `Resources`. The nodes of the `Resource` and it's children can have a `lint` attribute attached. If present, the `lint` attribute will contain an `Array` of `LintResults`. To make it easier to see if one of the lint rules reported a violation, `inlang` provides some [utility functions](#utility-functions).

#### utility functions

Utility functions provide an easy way to check if a `Resource` has a `lint` attribute. All utility functions can be imported from `@inlang/core/lint`. Per default nodes are checked recursively for the `lint` attribute. You can pass `nested: false` in the options to check a node without it's children.

Example:

```ts
import { getLintReports } from "@inlang/core/lint"

// recursively check all nodes for lint errors
const errors = getLintReports(lintedResource, { level: "error" })

// just check a single node for lint errors
const errors = getLintReports(lintedResource, { level: "error", nested: false })
```

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
				missingKeyRule("warn"),
				// uses the standard lint level and passes custom settings to the rule
				missingKeyRule(true, { threshold: 4 }),
				// disables the rule if it runs on mondays
				missingKeyRule(!isTodayMonday),
			],
		},
	}
}
```

## Lint Rules

There already exist some lint rules you can use to check your `Resources` against. You can find them [here](https://github.com/inlang/ecosystem). Or you can write your own rules.

### Creating your own lint rule

You can use the provided `createLintRule` function to create a lint rule. By using the provided function, you will get back a strongly typed rule.

Example:

```ts
import { createLintRule, type Context } from "@inlang/core/lint"

const myLintRule = createLintRule<{ apiKey: string }>(
	"myService.checkGrammar",
	"error",
	(settings) => {
		if (!settings?.apiKey) {
			throw new Error("You need to provide an API key")
		}

		let context: Context
		let service

		return {
			setup: async (args) => {
				context = args.context

				service = await connectToGrammarService(context.apiKey)
			},
			visitors: {
				Message: async ({ target, reference }) => {
					if (!target) return

					const result = await service.checkGrammar(target)

					context.report({
						node: target,
						message: `Message with id '${reference.id.name}' contains a grammar error: ${result.details}`,
					})
				},
			},
			teardown: async () => {
				await service.closeConnection()
			},
		}
	},
)
```

The `createLintRule` expects 3 parameters.

1. The id of the rule.\
   The naming convention for the id is: `camelCase` and it must be split by a `.` character to prevent naming collisions e.g. `myService.checkGrammar`.
2. The default lint level used by this rule.\
   If a user does not specify lint level, the default level will be used to report lint violations.
3. A callback function that gets passed the settings of the lint rule. It must return an object with the following properties:

   - `setup`: A function that can be used to open connections or setup other stuff that will be used during the lint process.\
      The `setup` function gets called with the following parameter: `{ referenceLanguage, languages, context }` where
     - `referenceLanguage` is the reference language of ths repository.
     - `languages` is an array of the supported languages.
     - `context` is the context of the linting process, that provides utility functions to report lint violations to any node.
       The function can return an object, that will be passed as the `payload` attribute to all subsequent steps in the linting process.
   - `visitors`: An object that contains functions that will be called during the linting process.\
     The linting process will visit each node recursively and then calls the corresponding `visitors` function if specified. The `visitor` object expects the following properties:

     - `Resource` _(optional)_: the visitor functions that will be called when a Resource node gets processed.
     - `Message` _(optional)_: the visitor functions that will be called when a Message node gets processed.
     - `Pattern` _(optional)_: the visitor functions that will be called when a Pattern node gets processed.
       Those properties can be either a single function or an object with a `enter` and/or `leave` function:

     ```ts
     visitors: {
       Message: () => { /* implementation */ },
       Pattern: {
         enter: () => { /* implementation */ },
         leave: () => { /* implementation */ },
       },
     }
     ```

     The `enter` function get's called when a node get's visited. If this node contains children, those will be processed afterwards. Once all children have been processed, the `leave` function will be called. When using a single function, the function is treated as the `enter`function.

     The `enter` function get's called with the following parameter: `{ target, reference, payload }` where

     - `target` is the node that got visited.
     - `reference` is the corresponding node of the reference language.
     - `payload` the object returned by the `setup` or a parent's `enter` function.
       The function can optionally return
     - `'skip'` to skip the processing of all child nodes.
     - an object, that get's passed as `payload` to all children and the `leave` function.

     Be aware that `target` or `reference` could be `undefined` if the corresponding node does not exist on the target or reference resource.

     The `leave` function receives the same payload as the `enter` function, but does not return anything.

   - `teardown` _(optional)_: A function that can be used to close opened connections.\
      The `teardown` function gets called with the following parameter: `{ payload }` where
     - `payload` is the object returned by the `setup` function.

All defined functions can be synchronous or asynchronous. The lint process traverses all nodes in sequence and awaits each step individually. Keep that in mind. It could affect the performance if you call a lot of long-running functions.

#### Manual processing of nodes

If you wish to manually traverse all nodes e.g. to make some requests in parallel, you can do that with this approach:

```ts
visitors: {
  // only define a visitor for `Resource` as it is the entry point to all nodes.
  Resource: () => {

    // manually process the resource node and it's children

    return 'skip' // skip the internal processing of children
  },
}
```

Be aware that you are responsible to check if your code reaches all nodes.

#### settings

A lint rule can expect a `settings` object. To specify what type of settings the lint rule expects, you can pass it as a generic argument to the `createLintRule` function.

```ts
// expects no settings
const myRule = createLintRule(/* ... */)

// expects settings of type `{ threshold: number }`
const myRule = createLintRule<{ threshold: number }>(/* ... */)
```

The settings will be passed by a user to configure the behavior of the lint rule.

_inlang.config.js_

```ts
lint: {
	rules: [myRule("warn", { threshold: 4 })]
}
```

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
					missingKey: "warn",
				}),
				// uses the standard lint level and passes custom settings to the `missingKey` rule
				inlangStandardRules({
					missingKey: [true, { threshold: 4 }],
				}),
				// disables the `missingKey` rule if it runs on mondays
				inlangStandardRules({
					missingKey: !isTodayMonday,
				}),
			],
		},
	}
}
```

### Creating your own lint collection

A lint collection groups multiple lint rules together. You can use the provided `createLintRuleCollection` function to create a collection. By using the provided function, you will get back a strongly typed rule collection.

Example:

```ts
import { createLintRuleCollection } from "@inlang/core/lint"

const myRuleCollection = createLintRuleCollection({
	missingKey: missingKeyRule,
	invalidKey: invalidKeyRule,
})
```

The `createLintRuleCollection` expects an object where the key is the name of the provided rule and the value is the rule itself. You can add as many rules as you want.
