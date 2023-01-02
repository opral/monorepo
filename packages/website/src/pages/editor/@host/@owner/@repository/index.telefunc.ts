import { serverSideEnv } from "@env";

const env = await serverSideEnv();

/**
 * Translate text using Google Translate.
 */
export async function onMachineTranslate(args: {
	text: string;
	referenceLanguage: string;
	targetLanguage: string;
}): Promise<{ data?: string; error?: string }> {
	try {
		if (env.GOOGLE_TRANSLATE_API_KEY === undefined) {
			throw Error("Missing env variable GOOGLE_TRANSLATE_API_KEY. ");
		}
		const response = await fetch(
			"https://translation.googleapis.com/language/translate/v2?" +
				new URLSearchParams({
					q: args.text,
					target: args.targetLanguage,
					source: args.referenceLanguage,
					format: "text",
					key: env.GOOGLE_TRANSLATE_API_KEY,
				}),
			{ method: "POST" }
		);
		const json = await response.json();
		if (response.ok) {
			return { data: json.data.translations[0].translatedText };
		}
		throw Error(json);
	} catch (error) {
		return { error: (error as Error).message };
	}
}
