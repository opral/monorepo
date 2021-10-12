import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { DeeplLanguages } from 'deepl';
// import { supabaseServerSide } from './_services/supabase';

dotenv.config();

const deeplKey = process.env['DEEPL_SECRET_KEY'] as string;

export type TranslateRequestBody = {
	text: string;
	sourceLang: DeeplLanguages;
	targetLang: DeeplLanguages;
};

export type TranslateResponseBody = {
	text: string;
	targetLang: DeeplLanguages;
};

type deeplResponse = {
	translations: { detected_source_lang: string; text: string }[];
};

export async function post(request: Request): Promise<EndpointOutput<TranslateResponseBody>> {
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
		wrapVariablesInTags(translateRequest.text) +
		'&target_lang=' +
		translateRequest.targetLang +
		'&source_lang=' +
		translateRequest.sourceLang;

	return new Promise((resolve, reject) => {
		fetch('https://api-free.deepl.com/v2/translate?auth_key=' + deeplKey, {
			method: 'post',
			headers: new Headers({
				'content-type': 'application/x-www-form-urlencoded'
			}),
			body: body
		})
			.then((response: Response) => {
				return response.json();
			})
			.then((response: deeplResponse) =>
				resolve({
					body: {
						text: response.translations[0].text,
						targetLang: translateRequest.targetLang
					},
					status: 200
				})
			)
			.catch((error) => {
				console.log(error);
			});
	});
}

/**
 *
 * @param text "Hello {user}."
 * @returns "Hello <variable>{user}</variable>."
 */
function wrapVariablesInTags(text: string): string {
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
