# Proposal for the `lint` functionality

## Types

1. I have investigated if [this](https://github.com/orgs/inlang/discussions/319#discussioncomment-4850815) is possible and I could not make it work.

	I have tried 3 different ways to do it. Take a look at the `experiment-1.ts` file to see the examples. I find variant 3 to be the best because it does not hide the properties behind an abstraction (see screenshots below). It can be easily extended in the future with additional properties.

2. We need to extend the Resource type on each level (`Resource`, `Message`, `Pattern`) because each level could have lint information attached to it.

	- "missing key" would be on the `Resource` level
	- "missing parameter" would be on the `Message` level
	- "unknown parameter" would be on the `Pattern` level

	Maybe `Pattern` requires another level in the future, but if we solve the problem for the first 3 levels, adding the 4th should be easy.

	Kind of similar to the `metadata` property which can be present on all levels. If we solve the problem for `lint`, we can get rid of the non-typed `metadata` property and plugin authors can use a slightly different approach (additional properties should be scoped to a "namespace"-like object). The result would be a `Resource` with correctly typed `metadata` property.

	See `experiment-2.ts` for an example how this could be done. The only downside is, that those generics make the code harder to read. And VS Code will show jibberish when hovering over a variable (see screenshots below). But the only alternative I can see is to define each Permutation manually which is even worse.
