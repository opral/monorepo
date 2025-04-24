import { Type, type Static } from "@sinclair/typebox";
import { Node, mergeAttributes } from "@tiptap/core";
import { TextJsonSchema } from "./text.js";

export type ZettelParagraph = Static<typeof ZettelParagraphJsonSchema>;

export const ZettelParagraphJsonSchema = Type.Object({
	type: Type.Literal("zettel_paragraph"),
	attrs: Type.Object({
		zettel_key: Type.String(),
	}),
	content: Type.Optional(Type.Array(TextJsonSchema)),
});

export const ZettelParagraphNode = Node.create({
	name: "zettel_paragraph",
	group: "block",
	content: "inline*",

	addAttributes() {
		return {
			...this.parent?.(),
			zettel_key: {
				default: null,
				renderHTML(attributes) {
					return { "data-zettel-key": attributes.zettel_key };
				},
				parseHTML(attributes) {
					return attributes.getAttribute("data-zettel-key");
				},
			},
		};
	},

	parseHTML() {
		return [{ tag: "p" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["p", mergeAttributes(HTMLAttributes), 0];
	},
});
