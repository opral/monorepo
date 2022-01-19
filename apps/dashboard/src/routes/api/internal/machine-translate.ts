import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';

export type MachineTranslateRequestBody = {
	serializedSourcePattern: string;
	sourceLanguageCode: SupportedLanguageCode;
	targetLanguageCode: SupportedLanguageCode;
};

export type MachineTranslateResponseBody = {
	serializedPattern: string;
};

export type SupportedLanguageCode = typeof supportedLanguageCodes[number];

export const supportedLanguageCodes = [
	'bg',
	'cs',
	'da',
	'de',
	'el',
	'en-gb',
	'en-us',
	'en',
	'es',
	'et',
	'fi',
	'fr',
	'hu',
	'it',
	'ja',
	'lt',
	'lv',
	'nl',
	'pl',
	'pt-pt',
	'pt-br',
	'pt',
	'ro',
	'ru',
	'sk',
	'sl',
	'sv',
	'zh'
] as const;

type DeeplResponse = {
	translations: { text: string }[];
};

export async function post(
	request: Request
): Promise<EndpointOutput<MachineTranslateResponseBody>> {
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
	const translateRequest = (request.body as unknown) as MachineTranslateRequestBody;

	const deeplRequestBody =
		'auth_key=' +
		deeplKey +
		'&text=' +
		wrapPlaceablesInTags(translateRequest.serializedSourcePattern) +
		'&target_lang=' +
		translateRequest.targetLanguageCode +
		'&source_lang=' +
		translateRequest.sourceLanguageCode +
		// tag handling ensures that <placeable> { $variable } </placeable> is excaped.
		'&tag_handling=xml' +
		'&ignore_tags=placeable';

	const response = await fetch('https://api-free.deepl.com/v2/translate?auth_key=' + deeplKey, {
		method: 'post',
		headers: new Headers({
			'content-type': 'application/x-www-form-urlencoded'
		}),
		body: deeplRequestBody
	});
	if (response.ok !== true) {
		return {
			status: 500
		};
	}
	const machineTranslation: DeeplResponse = await response.json();
	if (machineTranslation.translations.length !== 1) {
		return {
			status: 500
		};
	}

	return {
		body: <MachineTranslateResponseBody>{
			serializedPattern: extractPlaceablesFromTags(machineTranslation.translations[0].text)
		}
	};
}

/**
 *
 * @param text "Hello {user}."
 * @returns "Hello <placeable>{user}</placeable>."
 */
function wrapPlaceablesInTags(text: string): string {
	return text.replace(/{.*?}/g, '<placeable>$&</placeable>');
}

/**
 *
 * @param text Hello <placeable>{user}</placeable>.
 * @returns Hello {user}.
 */
function extractPlaceablesFromTags(text: string): string {
	return text.replace(/<placeable>/g, '').replace(/<\/placeable>/g, '');
}
