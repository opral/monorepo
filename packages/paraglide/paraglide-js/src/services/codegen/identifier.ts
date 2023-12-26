const allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"

/**
 * Takes in a string and tries to convert it to a valid JS identifier.
 * The output is deterministic.
 *
 * "i" is short for "identifier".
 */
export function i(str: string) {
	let result = ""
	for (const char of str) {
		if (allowedChars.includes(char)) {
			result += char
		} else {
			result += "_"
		}
	}
	return result
}
