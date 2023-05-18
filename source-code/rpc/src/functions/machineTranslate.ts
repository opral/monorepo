import { telemetryNode } from "@inlang/telemetry"
import { privateEnv } from "@inlang/env-variables"
import type { Result } from "@inlang/core/utilities"

export async function machineTranslate(args: {
	text: string
	targetLanguage: string
	referenceLanguage: string
	telemetryId?: string
}): Promise<Result<string, Error>> {
	try {
		if (!privateEnv.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set")
		}
		const response = await fetch(
			"https://translation.googleapis.com/language/translate/v2?" +
				new URLSearchParams({
					q: args.text,
					target: args.targetLanguage,
					source: args.referenceLanguage,
					format: "text",
					key: privateEnv.GOOGLE_TRANSLATE_API_KEY,
				}),
			{ method: "POST" },
		)
		if (!response.ok) {
			return [undefined, new Error(response.statusText)]
		}
		telemetryNode.capture({
			event: "machine translation created",
			distinctId: args.telemetryId ?? "unknown",
		})
		const json = await response.json()
		return [json.data.translations[0].translatedText]
	} catch (error) {
		console.error("ml failed", error)
		return [undefined, error as Error]
	}
}
