export const resolveEscapedCharacters = (text: string) => {
	const cleanedText = text
		.replace(/\\u([\dA-Fa-f]{4})/g, (_, grp) => {
			if (grp !== undefined) {
				// Convert \u escape sequences to characters using String.fromCodePoint
				return String.fromCodePoint(parseInt(grp, 16))
			}
			return "" // Return empty string for unmatched cases
		})
		.replace(/\\[^\s]/g, "") // Remove any remaining escape sequences

	return cleanedText
}
