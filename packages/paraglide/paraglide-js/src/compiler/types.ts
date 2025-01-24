export type Compiled<Node> = {
	/** The original AST node */
	node: Node;
	/** The code generated to implement the AST node */
	code: string;
};

/**
 * A message function is a message for a specific locale.
 *
 * @example
 *   m.hello({ name: 'world' })
 */
export type MessageFunction = (inputs?: Record<string, never>) => string;

/**
 * A message bundle function that selects the message to be returned.
 *
 * Uses `getLocale()` under the hood to determine the locale with an option.
 *
 * @example
 *   import * as m from './messages.js'
 *   m.hello({ name: 'world', { locale: "en" } })
 */
export type MessageBundleFunction<T extends string> = (
	params: Record<string, never>,
	options: { locale: T }
) => string;
