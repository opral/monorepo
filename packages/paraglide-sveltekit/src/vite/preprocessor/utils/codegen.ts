import { escapeForDoubleQuotes } from "./escape.js"

export function ternary(predicate: string, consequent: string, alternate: string) {
	return `${predicate} ? ${consequent} : ${alternate}`
}

/**
 * Returns code for an equality check between two values.
 *
 * @example
 *
 * eq("a", "b")
 * // -> '(a === b)'
 */
export function eq(first: string, second: string) {
	return `(${first} === ${second})`
}

export function neq(first: string, second: string) {
	return `(${first} !== ${second})`
}

export function and(first: string, second: string) {
	return `(${first} && ${second})`
}

export function or(first: string, second: string) {
	return `(${first} || ${second})`
}

export function str(value: string) {
	return `"${escapeForDoubleQuotes(value)}"`
}

/**
 * Returns an attribute declaration for a given name and value.
 *
 * @example
 *
 * attribute("val", "a + b")
 * // -> 'val={a + b}'
 *
 */
export function attribute(name: string, value: string) {
	return `${name}={${value}}`
}

export function spreadAttr(value: string) {
	return `{...(${value})}`
}
