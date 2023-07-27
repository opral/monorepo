import type { Message } from "../ast/schema.js"
import type { LanguageTag } from "../languageTag/index.js"

export const createMessage = (id: string, languageTag: LanguageTag, text: string) =>
	({ id, languageTag, pattern: [
		{
			type: "Text",
			value: text
		}
	] } satisfies Message)
