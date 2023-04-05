import type { Result } from "@inlang/core/utilities"

export async function machineTranslate(args: {
	text: string
	targetLanguage: string
	referenceLanguage: string
}): Promise<Result<string, Error>> {
	try {
		if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set")
		}
		const response = await fetch(
			"https://translation.googleapis.com/language/translate/v2?" +
				new URLSearchParams({
					q: args.text,
					target: args.targetLanguage,
					source: args.referenceLanguage,
					format: "text",
					key: process.env.GOOGLE_TRANSLATE_API_KEY,
				}),
			{ method: "POST" },
		)
		if (!response.ok) {
			return [undefined, new Error(response.statusText)]
		}
		const json = await response.json()
		return [json.data.translations[0].translatedText]
	} catch (error) {
		return [undefined, error as Error]
	}
}
