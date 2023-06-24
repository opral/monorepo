---
title: Lint
href: /documentation/lint
description: Check `Resources` for potential errors and other insights.
---

# {% $frontmatter.title %}

This module provides the functionality to automatically check `Resources` for potential errors and other insights.

Use cases could be:

- check if all `Messages` were translated to another language
- check if the name of a brand always uses the same naming schema e.g. `MyApp` instead of `my-app` or `myApp`
- check if the tone of a message does not sound aggressive
- check if the translated message does not exceed a certain length
- ... and probably a ton of other use cases. Please [tell us](https://github.com/inlang/inlang/discussions/406) if we should add one to this list.

## Usage

> Note: In the future we will provide a `CLI` to make it easier to use this package.

```ts
import { lint, getLintReports } from "@inlang/core/lint"

// 1. Lint resources with the `lint` function.

const lintedResources = await lint({ config, resources })

// 2. Use `getLintReports` to get lint reports.
//    A second argument can be used for query options.

// get all lint reports
const allLints = getLintReports(lintedResources)
// get lint reports for "error"
const errors = getLintReports(lintedResources, { level: "error" })
// get lint reports for "warn" for the first node.
const warnings = getLintReports(lintedResources, { level: "warn", recursive: false })
```

## Configuration

The `inlang.config.js` file supports a `lint` property you can use to configure the linting process.

The `lint` property expects an `Array` of [`rules`](#lint-rules). Rules can be configured by passing parameters to the function call.

- the first parameter is the lint level. Currently supported levels are `'error'` and `'warn'`
- the second parameter is a custom configuration for the given rule. Some rules may be configured and some rules might not support this.

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
				// set's the lint level to 'warn'
				missingMessageRule("warn"),
				// uses the standard lint level and passes custom settings to the rule
				missingMessageRule("error", { threshold: 4 }),
				// conditionally activate rules.
				// (if this features is used a lot, we will provide a nicer API)
				...(isTodayMonday ? [missingMessageRule("error")] : []),
			],
		},
	}
}
```

## Lint Rules

There exist some lint rules you can use to check your `Resources` against. You can find them [here](/documentation/plugins/registry). Or you can write your own rules.

### Creating your own lint rule

You can use the provided `createLintRule` function to create a lint rule. By using the provided function, you will get back a strongly typed rule.

Example:

```ts
import { createLintRule, type Context } from "@inlang/core/lint"

const myLintRule = createLintRule<{ apiKey: string }>(
	{ id: "myService.checkGrammar" },
	({ settings, report }) => {
		const api = Grammarly()

		return {
			visitors: {
				Message: async ({ target, reference }) => {
					if (!target) return
					const result = await api.checkGrammar(target)
					report({
						node: target,
						message: `Message with id '${reference.id.name}' contains a grammar error: ${result.details}`,
					})
				},
			},
		}
	},
)
```

The `createLintRule` expects 2 parameters.

1. The id of the rule.\
   The naming convention for the id is: `camelCase` and it must be split by a `.` character to prevent naming collisions e.g. `myService.checkGrammar`.

2. A callback function that gets passed the settings of the lint rule. It must return an object with the following properties:

   - `visitors`: An object that contains functions that will be called during the linting process.\
     The linting process will visit each node recursively and then calls the corresponding `visitors` function if specified. The `visitor` object expects the following properties:

     - `Resource` _(optional)_: the visitor functions that will be called when a Resource node gets processed.
     - `Message` _(optional)_: the visitor functions that will be called when a Message node gets processed.
     - `Pattern` _(optional)_: the visitor functions that will be called when a Pattern node gets processed.

     ```ts
     visitors: {
       Resource: ({ reference, target }) => { /* implementation */ },
       Message: ({ reference, target }) => { /* implementation */ },
       Pattern: ({ reference, target }) => { /* implementation */ }
     }
     ```

     - `'skip'` to skip the processing of all child nodes.

     Be aware that `target` or `reference` could be `undefined` if the corresponding node does not exist on the target or reference resource.

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

#### Settings

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

## Design decisions

#### Iterative improvements.

The lint module is small on purpose to not expose features that might not be used by users but need to be maintained for backwards compatibility. We will implement features as requested by users.

It is expected that most improvements can be exposed via (the object) arguments.

```ts
const myRule = createLintRule("foo.x", ({ settings, report }) => {
 return {
  visitors: {
   Resource: ({ onLeave }) => {
+    // on leave (and many other features) could be exposed via a callback
+    onLeave(() => {
+     if (isError) report({ node: this, message: "foo" });
    });
   },
  },
 };
});
```

#### Use the object argument pattern to API changes

To ease the iterative improvement approach, most public APIs use the object argument pattern.

```ts
// Example: Deprecating the "level" argument.

// before refactoring
function withObjectPattern(args: { id: string; level: string; type: string })
function withPositionalArguments(id: string, level: string, type: string)

withObjectPattern({ id: "hello", level: "world", type: "JavaScript" })
withPositionalArguments("hello", "world", "JavaScript")

// after refactoring
function withObjectPattern(args: { id: string; type: string })
function withPositionalArguments(id: string, level?: string, type: string)

withObjectPattern({ id: "hello", type: "JavaScript" })
withPositionalArguments("hello", undefined, "JavaScript")
```

#### Users must explicitly provide provide the lint level.

Letting rules define the default lint level in `createLintRule` leads to complex types, more conditional logic, and the benefit to developers is unclear. I vote to remove the "feature" due to:

- Users face a hidden lint level that might make them wonder why certain things are errors or warnings.
- Rule writers need to think about "should my rule be an error or a warning"?

```ts
rules: [
	// implicit behaviour. What rules are an error and what are a warning?

	additionalIdRule(),
	brandingRule(),
	grammarRule(),
]
```

```ts
rules: [
	// explicit behaviour for close to no additional "cost"

	additionalIdRule("error"),
	brandingRule("warn"),
	grammarRule("error"),
]
```

#### Flow of the lint module

```ts
// 1. create lint rule [Public API: Authoring rules]
const missingMessageRule = createLintRule<{ strict: boolean }>({ id: "inlang.missingMessage" },
  ({ config, report, settings }) => {
	  return visitors: {
      Resource: ({ target } => {
				if (settings.strict){
					report(target, { message: "Missing message" })
				}
      })
	  }
  })

// 2. configure rule function [Public API: Using rules]
rules: [
  missingMessageRule("error", {
    strict: true,
  })
]

// 3. setup rule function [Internal]
const rules = rules.map((rule) => await rule.setup({ config, report }))

// 4. linting
const [resource, errors] = await lint(resources, [rule])
```
