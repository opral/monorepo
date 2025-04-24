import { Type } from "@sinclair/typebox";
import type { NodeSpec } from "prosemirror-model";

export const TextJsonSchema = Type.Object({
	type: Type.Literal("text"),
	text: Type.String(),
});

/**
 * Special node that is required by ProseMirror,
 * and therefore has no `zettel` prefix, nor
 * attributes.
 */
export const TextSpec = {
	jsonSchema: TextJsonSchema,
	group: "inline",
} as const satisfies NodeSpec;
