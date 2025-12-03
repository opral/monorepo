export type Compiled<Node> = {
	/** The original AST node */
	node: Node;
	/** The code generated to implement the AST node */
	code: string;
};

/**
 * A branded type representing a localized string.
 * Provides compile-time safety to distinguish translated from untranslated strings.
 *
 * @example
 * ```typescript
 * import { m } from './paraglide/messages.js'
 * import type { LocalizedString } from '@inlang/paraglide-js'
 *
 * const greeting: LocalizedString = m.hello() // ✓ Type-safe
 * const raw: LocalizedString = "Hello"        // ✗ Type error
 * ```
 */
export type LocalizedString = string & { readonly __brand: "LocalizedString" };

/**
 * A message function is a message for a specific locale.
 *
 * @example
 *   m.hello({ name: 'world' })
 */
export type MessageFunction = (inputs?: Record<string, never>) => LocalizedString;

/**
 * A message bundle function that selects the message to be returned.
 *
 * Uses `getLocale()` under the hood to determine the locale with an option.
 *
 * @example
 *   import { m } from './messages.js'
 *   m.hello({ name: 'world', { locale: "en" } })
 */
export type MessageBundleFunction<T extends string> = (
	params: Record<string, never>,
	options: { locale: T }
) => LocalizedString;
