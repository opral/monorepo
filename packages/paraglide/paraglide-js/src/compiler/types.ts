export type Compiled<Node> = {
	/** The original AST node */
	node: Node;
	/** The code generated to implement the AST node */
	code: string;
};

/**
 * A message function that takes inputs and returns a message.
 *
 * @example
 *   import
 */
export type MessageFunction = (inputs?: Record<string, never>) => string;

/**
 * A message bundle function.
 *
 * @example
 *   import * as m from './messages.js'
 *   m.hello({ name: 'world', { locale: "en" } })
 */
export type MessageBundleFunction<T extends string> = (
	params: Record<string, never>,
	options: { locale: T }
) => string;

/**
 * Attempts to merge type restrictions from two variants.
 */
export function mergeTypeRestrictions(
	a: Record<string, string>,
	b: Record<string, string>
): Record<string, string> {
	const result = structuredClone(a);
	for (const [key, value] of Object.entries(b)) {
		const existingValue = result[key];
		// if we don't yet have a type, use it
		if (!existingValue) {
			result[key] = value;
			continue;
		}

		// if the type is the same contiune
		if (existingValue === value) continue;

		// if both have a type, use the more specific one
		if (typeSpecificity(existingValue) < typeSpecificity(value)) {
			result[key] = value;
		}
	}
	return result;
}

function typeSpecificity(type: string): number {
	if (type === "NonNullable<unknown>") return 0;
	else return 1;
}
