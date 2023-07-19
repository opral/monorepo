import type { Message } from "../ast/schema.js"
import type { BCP47LanguageTag } from "../languageTag/index.js"

export const createMessage = (id: string, languageTag: BCP47LanguageTag, text: string) =>
	({ id, languageTag, pattern: [
		{
			type: "Text",
			value: text
		}
	] } satisfies Message)
