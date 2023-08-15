import { privateEnv } from "@inlang/env-variables"
import type { LanguageTag } from "@inlang/language-tag"
import { getVariant, type Message } from "@inlang/messages"
import type { Result } from "@inlang/result"

export async function machineTranslateMessage(args: {
	message: Message
	sourceLanguageTag: LanguageTag
	targetLanguageTags: LanguageTag[]
}): // must return a string as en error because needs to be serializable
Promise<Result<Message, string>> {
	try {
		if (!privateEnv.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set")
		}
		for (const targetLanguageTag of args.targetLanguageTags) {
			for (const variant of args.message.body[args.sourceLanguageTag]) {
				const targetVariant = getVariant(args.message, {
					languageTag: targetLanguageTag,
					selectors: variant.match,
				})
			}
			if (
				args.message.body[args.sourceLanguageTag]?.length ===
				args.message.body[targetLanguageTag]?.length
			) {
				// fully translated
				continue
			}
			const body = args.message.body[targetLanguageTag]
		}
		const response = await fetch(
			"https://translation.googleapis.com/language/translate/v2?" +
				new URLSearchParams({
					q: args.text,
					target: args.targetLanguageTag,
					source: args.sourceLanguageTag,
					format: "text",
					key: privateEnv.GOOGLE_TRANSLATE_API_KEY,
				}),
			{ method: "POST" },
		)
		if (!response.ok) {
			return { error: response.statusText }
		}
		const json = await response.json()
		return { data: json.data.translations[0].translatedText }
	} catch (error) {
		return { error: error?.toString() ?? "unknown error" }
	}
}
