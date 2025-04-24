import { Node, mergeAttributes } from "@tiptap/core";

export const ZettelParagraph = Node.create({
	name: "zettel_paragraph",
	group: "block",
	content: "inline*",

	addAttributes() {
		return {
			...this.parent?.(),
			zettel_key: {
				isRequired: true,
				parseHTML: (element) => element.getAttribute("data-zettel-key"),
				renderHTML: (attributes) => ({ "data-zettel-key": attributes.zettel_key }),
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
