import { Node } from "@tiptap/core";
import { Type, type Static } from "@sinclair/typebox";

export type Text = Static<typeof TextJsonSchema>;

export const TextJsonSchema = Type.Object({
	type: Type.Literal("text"),
	text: Type.String(),
});

export const TextNode = Node.create({
	name: "text",
	group: "inline",
});
