import { Type, type Static } from "@sinclair/typebox";

export const ExtensionsJson = Type.Object({
  recommendations: Type.Array(Type.String()),
});

export type ExtensionsJson = Static<typeof ExtensionsJson>;
