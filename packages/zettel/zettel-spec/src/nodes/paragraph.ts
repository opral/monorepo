import type { ZettelNodeSpec } from "./zettel-node.js";
import { Type, type Static } from "@sinclair/typebox";
import { TextJsonSchema } from "./text.js";

export type ZettelParagraph = Static<typeof ZettelParagraphJsonSchema>;

export const ZettelParagraphJsonSchema = Type.Object({
	type: Type.Literal("zettel_paragraph"),
	attrs: Type.Object({
		zettel_key: Type.String(),
	}),
	content: Type.Optional(Type.Array(TextJsonSchema)),
});

export const ZettelParagraphSpec: ZettelNodeSpec = {
	jsonSchema: ZettelParagraphJsonSchema,
	attrs: {
		zettel_key: { default: "" },
	},
	group: "block",
	content: "inline*",
	parseDOM: [{ tag: "p" }],
	toDOM: () => ["p", 0],
};
