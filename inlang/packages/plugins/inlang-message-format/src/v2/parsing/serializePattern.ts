// @ts-nocheck

export const serializedPattern = (
	pattern: Message["variants"][0]["pattern"]
): string => {
	return pattern
		.map((node) => {
			switch (node.type) {
				case "Text":
					return node.value;
				case "VariableReference":
					return `{${node.name}}`;
			}
		})
		.join("");
};
