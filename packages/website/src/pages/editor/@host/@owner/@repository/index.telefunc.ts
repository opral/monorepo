import { serverSideEnv } from "@env";
import { assertUsage } from "@src/services/assert/index.js";
import { Result } from "@inlang/core/utilities";
import { decryptAccessToken } from "@src/services/auth/logic.js";
import type { LocalStorageSchema } from "@src/services/local-storage/schema.js";
import { useLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";
import { response } from "express";
const env = await serverSideEnv();
/**
 * Translate text using Google Translate.
 */
async function AccessToken(args: {
	encryptedAccessToken: NonNullable<
		LocalStorageSchema["user"]
	>["encryptedAccessToken"];
}) {
	const decryptedAccessToken = (
		await decryptAccessToken({
			jwe: args.encryptedAccessToken,
			JWE_SECRET_KEY: env.JWE_SECRET_KEY,
		})
	).unwrap();
	return decryptedAccessToken;
}

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

export async function isCollaborator(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}) {
	const decryptedAccessToken = await AccessToken({
		encryptedAccessToken: args.encryptedAccessToken,
	});
	try {
		const response = await fetch(
			`https://api.github.com/repos/${args.owner}/${args.repository}/collaborators/${args.username}`,
			{
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
			}
		);
		console.log("collaborator", response.ok);
		return response.ok;
	} catch (error) {
		console.error(error);
	}
	return;
}

export async function onForkRepository(args: {
	encryptedAccessToken: NonNullable<
		LocalStorageSchema["user"]
	>["encryptedAccessToken"];
	username: NonNullable<LocalStorageSchema["user"]>["username"];
	owner: string;
	repository: string;
}) {
	const decryptedAccessToken = await AccessToken({
		encryptedAccessToken: args.encryptedAccessToken,
	});

	try {
		const response = await fetch(
			`https://api.github.com/repos/${args.owner}/${args.repository}/forks`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
				// body: JSON.stringify({
				// 	name: `inlangTranslationFor-${args.owner}-${args.repository}`,
				// }),
			}
		);
		if (response.ok) {
			const json = await response.json();
			return json;
		} else throw Error(await response.text());
	} catch (error) {
		console.error(error);
		return console.error(error);
	}
	return;
}
