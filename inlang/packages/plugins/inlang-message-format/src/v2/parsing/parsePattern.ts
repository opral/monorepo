// @ts-nocheck

/**
 * Parses a pattern like "Hello {name}!" to AST.
 */
export const parsePattern = (
	pattern: string
): Message["variants"][0]["pattern"] => {
	const regex = /\{([^}]+)\}/g;

	let match;
	let lastIndex = 0;
	const result: Message["variants"][0]["pattern"] = [];

	while ((match = regex.exec(pattern)) !== null) {
		const name = match[1];
		const textBefore = pattern.slice(lastIndex, match.index);

		if (textBefore.length > 0) {
			result.push({ type: "Text", value: textBefore });
		}
		result.push({ type: "VariableReference", name: name as string });
		lastIndex = match.index + match[0].length;
	}

	const textAfter = pattern.slice(Math.max(0, lastIndex));

	if (textAfter.length > 0) {
		result.push({ type: "Text", value: textAfter });
	}

	return result;
};
