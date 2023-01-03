import { serverSideEnv } from "@env";
import { assertUsage } from "@src/services/assert/index.js";
import { Result } from "@inlang/core/utilities";
import { decryptAccessToken } from "@src/services/auth/logic.js";
import type { LocalStorageSchema } from "@src/services/local-storage/schema.js";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
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
		assertUsage(
			json.data.translations.length === 1,
			"Expected exactly one translation. Hardcoded in the code for now."
		);
		if (response.ok) {
			return { data: json.data.translations[0].translatedText };
		}
		throw Error(json);
	} catch (error) {
		return { error: (error as Error).message };
	}
}
export async function forkRepository(args: {
	encryptedAccessToken: NonNullable<
		LocalStorageSchema["user"]
	>["encryptedAccessToken"];
	pathname: string;
}) {
	console.log("fork");
	try {
		const decryptedAccessToken = (
			await decryptAccessToken({
				jwe: args.encryptedAccessToken,
				JWE_SECRET_KEY: env.JWE_SECRET_KEY,
			})
		).unwrap();
		console.log(decryptedAccessToken);
		console.log(`https://api.github.com/repos/${args.pathname}/forks`);
		const fork = await fetch(
			`https://api.github.com/repos/${args.pathname}/forks`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
				},

				body: JSON.stringify({ name: "inlangTranslation" }),
			}
		);
		if (fork.ok) {
			console.log("ich bin ok ", fork.ok);
			return undefined;
		} else throw Error(await fork.text());
	} catch (error) {
		return console.error(error);
	}
}
