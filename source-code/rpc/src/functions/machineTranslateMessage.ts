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
		const copy = structuredClone(args.message)
		for (const targetLanguageTag of args.targetLanguageTags) {
			for (const variant of args.message.body[args.sourceLanguageTag]!) {
				const targetVariant = getVariant(args.message, {
					where: {
						languageTag: targetLanguageTag,
						selectors: variant.match,
					},
				})
				if (targetVariant) {
					continue
				}
				const response = await fetch(
					"https://translation.googleapis.com/language/translate/v2?" +
						new URLSearchParams({
							q: serializePattern(variant.pattern),
							target: targetLanguageTag,
							source: args.sourceLanguageTag,
							// html to escape placeholders
							format: "html",
							key: privateEnv.GOOGLE_TRANSLATE_API_KEY,
						}),
					{ method: "POST" },
				)
				if (!response.ok) {
					return { error: response.statusText }
				}
				const json = await response.json()
				const translation = json.data.translations[0].translatedText
				if (copy.body[targetLanguageTag] === undefined) {
					copy.body[targetLanguageTag] = []
				}
				copy.body[targetLanguageTag]?.push({
					match: variant.match,
					pattern: deserializePattern(translation),
				})
			}
		}
		return { data: copy }
	} catch (error) {
		console.error(error)
		return { error: error?.toString() ?? "unknown error" }
	}
}

function serializePattern(pattern: Message["body"][LanguageTag][number]["pattern"]) {
	let result = ""
	for (const element of pattern) {
		if (element.type === "Text") {
			result += element.value
		} else {
			result += `<span class="notranslate">${JSON.stringify(element)}</span>`
		}
	}
	return result
}

function deserializePattern(text: string): Message["body"][LanguageTag][number]["pattern"] {
	const result: Message["body"][LanguageTag][number]["pattern"] = []
	// google translate espaces quotes, need to replace the escaped stuff
	const unescapedText = text.replaceAll("&quot;", '"').replaceAll("&#39;", "'")
	let i = 0
	while (i < unescapedText.length) {
		// class="notranslate" tells the google api to not translate this part
		const start = unescapedText.indexOf('<span class="notranslate">', i)
		// no placeholders, immediately return text
		if (start === -1) {
			result.push({ type: "Text", value: unescapedText.slice(i) })
			break
		}
		// placeholder somewhere in the middle
		else if (i < start) {
			result.push({ type: "Text", value: unescapedText.slice(i, start) })
			// move the index to the start of the placeholder and avoid pushing the same text element multiple times
			i = start
			continue
		}
		const end = unescapedText.indexOf("</span>", start)
		if (end === -1) {
			result.push({ type: "Text", value: unescapedText.slice(i) })
			break
		}
		const json = unescapedText.slice(start + 26, end)
		result.push(JSON.parse(json))
		i = end + 7
	}
	return result
}
