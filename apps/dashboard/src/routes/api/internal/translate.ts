import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { DeeplLanguages } from 'deepl';

export type TranslateRequestBody = {
	text: string;
	sourceLang: DeeplLanguages;
	targetLang: DeeplLanguages;
};

export type TranslateResponseBody = {
	text: string;
	targetLang: DeeplLanguages;
};

type DeeplResponse = {
	translations: { detected_source_lang: string; text: string }[];
};

export async function post(request: Request): Promise<EndpointOutput<TranslateResponseBody>> {
	dotenv.config();
	const deeplKey = process.env['DEEPL_SECRET_KEY'] as string;

	if (request.headers['content-type'] !== 'application/json') {
		return {
			status: 405
		};
	}
	// const { user, error } = await supabaseServerSide.auth.api.getUser(
	// 	request.headers['authorization']
	// );
	// if (user === null || error) {
	// 	return {
	// 		status: 401
	// 	};
	// }
	const translateRequest = (request.body as unknown) as TranslateRequestBody;
	const body =
		'auth_key=' +
		deeplKey +
		'&text=' +
		escapeVariablesInTags(translateRequest.text) +
		'&target_lang=' +
		translateRequest.targetLang +
		'&source_lang=' +
		translateRequest.sourceLang +
		// tag handling ensures that <variable> {some variable} </varibale> is excaped.
		'&tag_handling=xml' +
		'&ignore_tags=variable';

	const response = await fetch('https://api-free.deepl.com/v2/translate?auth_key=' + deeplKey, {
		method: 'post',
		headers: new Headers({
			'content-type': 'application/x-www-form-urlencoded'
		}),
		body: body
	});
	if (response.ok !== true) {
		return {
			status: 500
		};
	}
	const machineTranslation: DeeplResponse = await response.json();
	if (machineTranslation.translations.length < 1) {
		return {
			status: 500
		};
	}
	return {
		body: <TranslateResponseBody>{
			text: removeVariableTags(machineTranslation.translations[0].text),
			targetLang: translateRequest.targetLang
		}
	};
}

/**
 *
 * @param text "Hello {user}."
 * @returns "Hello <variable>{user}</variable>."
 */
function escapeVariablesInTags(text: string): string {
	return text.replace(/{.*?}/g, '<variable>$&</variable>');
}

/**
 *
 * @param text Hello <variable>{user}</variable>.
 * @returns Hello {user}.
 */
function removeVariableTags(text: string): string {
	return text.replace(/<variable>/g, '').replace(/<\/variable>/g, '');
}
