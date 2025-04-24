import { Type, type Static } from "@sinclair/typebox";
import { ZettelNodeJsonSchema } from "./zettel-node.js";
import type { NodeSpec } from "prosemirror-model";

export type ZettelDoc = Static<typeof ZettelDocJsonSchema>;

export const ZettelDocJsonSchema = Type.Object({
	type: Type.Literal("zettel_doc"),
	content: Type.Array(ZettelNodeJsonSchema),
});

/**
 * Special node required by ProseMirror.
 *
 * No attributes.key is defined on this node.
 */
export const ZettelDocSpec = {
	jsonSchema: ZettelDocJsonSchema,
	content: "block+",
	parseDOM: [{ tag: "div" }],
	toDOM: () => ["div", 0],
} as const satisfies NodeSpec;
