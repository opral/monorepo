import { Type, type Static } from "@sinclair/typebox";

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
