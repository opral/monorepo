# Proposal for the `lint` functionality

Question: should this be implemented under the `@inlang/core/lint` or `@inlang/lint` package name?

<!------------------------------------------------------------------------------------------------>

## Types

1. I have investigated if [this](https://github.com/orgs/inlang/discussions/319#discussioncomment-4850815) is possible and I could not make it work.

   I have tried 3 different ways to do it. Take a look at the [`experiment-1.ts`](https://github.com/ivanhofer/inlang/blob/lint/source-code/core/src/lint/experiment-1.ts) file to see the examples. I find variant 3 to be the best because it does not hide the properties behind an abstraction (see screenshots below). It can be easily extended in the future with additional properties.

2. We need to extend the Resource type on each level (`Resource`, `Message`, `Pattern`) because each level could have lint information attached to it.

   - "missing key" would be on the `Resource` level
   - "missing parameter" would be on the `Message` level
   - "unknown parameter" would be on the `Pattern` level

   Maybe `Pattern` requires another level in the future, but if we solve the problem for the first 3 levels, adding the 4th should be easy.

   Kind of similar to the `metadata` property which can be present on all levels. If we solve the problem for `lint`, we can get rid of the non-typed `metadata` property and plugin authors can use a slightly different approach (additional properties should be scoped to a "namespace"-like object). The result would be a `Resource` with correctly typed `metadata` property.

   See [`experiment-2.ts`](https://github.com/ivanhofer/inlang/blob/lint/source-code/core/src/lint/experiment-2.ts) for an example how this could be done. The only downside is, that those generics make the code harder to read. And VS Code will show jibberish when hovering over a variable (see screenshots below). But the only alternative I can see is to define each Permutation manually which is even worse.

3. What information would a lint error emit?

   ```ts
   type LintInformation = {
   	type: LintRule // which rule emitted the error
   	message: string // a string that informs what is wrong
   }
   ```

   Question: Anything else?

   Question: Should any lint rule be able to extend this object?

<!------------------------------------------------------------------------------------------------>

## Configure Lint behavior

`inlang` will provide some lint functionality that can be configured or disabled.
It does not need to be as complicated as eslint, but it should follow the same design when it comes to the `rules`.
The `inlang.config.js` will be extended with a new `linting` property.

```js
/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
  	return {
   	sourceLanguageTag: 'en',
   	languages: ['en', 'de'],
		linting: {
			missing_key: false, // disable this specific lint rule
			missing_key: 'warn', // override the level
			missing_key: { 'error', { ignore: ['test-key'] }}, // configure the linting behavior where needed
		}
  	}
}
```

See [`experiment-3.ts`](https://github.com/ivanhofer/inlang/blob/lint/source-code/core/src/lint/experiment-3.ts) for more details.

Because we are in control of all lint rules, we can have strong type support for all the lint configurations.

### extending lint rules

How do we want to deal with this?

Question: Should anyone be able to write and add custom lint rules? _Probably yes._
The alternative would be that someone has to create a PR and submit a new rule to the `inlang` repo. This would not be ideal as it introduces a hurdle to test something out quickly or someone might not be allowed to share his code or it may take a few days/weeks until the PR get's merged.

If we allow anyone to add custom rules, we need to extend the `linting` prop.

```js
{
	linting: {
		plugins: [myCustomLintPlugin],
		rules: {
			missing_key: false, // disable this specific lint rule
		}
	}
}
```

Where `myCustomPlugin` is a `JavaScript` function which needs to implement a certain interface (not yet defined).

Question: If no plugin get's specified do we want to allow to get rid of the `rules` level in the config?

```js
{
	linting: {
		rules: {
			missing_key: false, // disable this specific lint rule
		}
	}
}
```

vs.

```js
{
	linting: {
		missing_key: false, // disable this specific lint rule
	}
}
```

<!------------------------------------------------------------------------------------------------>

## dealing with lint errors/warnings

The `@inlang/core/lint` package should provide useful utility functions that make it possible to traverse a `Resource` and check its linting properties.

e.g.

- `doesResourceContainIssues` should recursively check if a `Node` contains `error`s or `warn`s
- `doesResourceContainErrors` see above + filter for `error`s
- `doesResourceContainWarnings` see above + filter for `warns`s
- `listAllLintIssues` should flatten all `error`s and `warn`s of a `Node` to a list
- `getAllErrors` see above + filter for `error`s
- `getAllWarnings` see above + filter for `warn`s

Those are some basics and we can add any functionality in the future.

Question: anything else that we should add from the beginning?
