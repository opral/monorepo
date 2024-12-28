### @services/assert-usage

Assert a condition in the development environment.

Use `assertUsage` to verify the correct usage of code by other developers.
Similar to Node.js assert and Dart's https://dart.dev/guides/language/language-tour#assert.
If the condition is false, an error is thrown during development. In production,
assert calls are removed and, therefore, have no performance error error implication.

```ts
function x(argument: string) {
	assertUsage(
		argument.startsWith("hello"),
		"The argument must start with 'hello'. Otherwise, the function crashes."
	);
}
```
