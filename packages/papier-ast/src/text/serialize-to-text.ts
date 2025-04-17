import type { PapierAst, Span } from "../schema.js";

export function serializeToText(value: PapierAst | undefined | null): string {
	if (!value) {
		return "";
	}
	return value
		.filter((block) => block._type === "block" && Array.isArray(block.children))
		.map((block) =>
			block.children
				.filter(
					(child): child is Span =>
						child._type === "span" && typeof child.text === "string"
				)
				.map((span) => span.text)
				.join("")
		)
		.join("\\n");
}
