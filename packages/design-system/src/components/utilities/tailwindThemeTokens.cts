/**
 * Tailwind theme tokens.
 *
 * Taken from https://github.com/tailwindlabs/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 *
 * @example
 *    const x: typeof tailwindThemeTokens['borderRadius']
 *
 */
export const tailwindThemeTokens = {
	/** Utilities for controlling the border radius of an element. */
	borderRadius: [
		"none",
		"sm",
		"DEFAULT",
		"md",
		"lg",
		"xl",
		"2xl",
		"3xl",
		"full",
	] as const,
} as const;
