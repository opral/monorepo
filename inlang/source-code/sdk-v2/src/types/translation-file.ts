import { Type, type Static } from "@sinclair/typebox"

export const TranslationFile = Type.Object({
	path: Type.String(),
	content: Type.String(),
	pluginKey: Type.String(),
})

export type TranslationFile = Static<typeof TranslationFile>
