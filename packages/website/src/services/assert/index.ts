/**
 * --------------------------------
 * This index file exports code that is supposed
 * to be used outside of this directory.
 * --------------------------------
 */

/**
 * Asserts a condition in development environment.
 *
 * Use `assert` to verify the correct usage of code by other developers.
 * Similar to Node.js assert and Dart's https://dart.dev/guides/language/language-tour#assert.
 * If the condition is false, an error is thrown during development. In production,
 * assert calls are removed and, therefore, have no performance error error implication.
 *
 * @example
 *  function x(argument: string){
 *   assert(argument.startsWith("hello"), "The argument must start with 'hello'. Otherwise, the function crashes.")
 *  }
 */
export function assert(
	condition: unknown,
	message?: string
): asserts condition {
	// if production environment, do nothing -> vite will remove assert calls in production
	if (import.meta.env?.PROD) return;
	if (!condition) {
		throw new Error(message);
	}
}
