import { Type, type Static } from "@sinclair/typebox";
import type { NodeSpec } from "prosemirror-model";
import type { JSONSchema7 } from "json-schema";

export type ZettelNodeSpec = NodeSpec & {
	jsonSchema: JSONSchema7;
	attrs: Record<string, any> & { zettel_key: Record<string, any> };
};

export type ZettelNode = Static<typeof ZettelNodeJsonSchema>;

export const ZettelNodeJsonSchema = Type.Intersect([
	Type.Object({
		type: Type.String(),
		attrs: Type.Object({
			zettel_key: Type.String({ minLength: 6, description: "A unique key for this node" }),
		}),
	}),
	Type.Record(Type.String(), Type.Optional(Type.Unknown())),
]);
