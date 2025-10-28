import { locales } from "./variables.js";

/**
 * Asserts that the input is a locale.
 *
 * @param {any} input - The input to check.
 * @returns {Locale} The input if it is a locale.
 * @throws {Error} If the input is not a locale.
 */
export function assertIsLocale(input) {
	if (typeof input !== "string") {
		throw new Error(`Invalid locale: ${input}. Expected a string.`);
	}
	const lowerInput = input.toLowerCase();
	const matchedLocale = locales.find(
		(item) => item.toLowerCase() === lowerInput
	);
	if (!matchedLocale) {
		throw new Error(
			`Invalid locale: ${input}. Expected one of: ${locales.join(", ")}`
		);
	}
	return matchedLocale;
}
