import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import translate, { DeeplLanguages } from 'deepl';
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

export type TranslateSupportedLanguages = DeeplLanguages;

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
	const result = await translate({
		text: wrapVariablesInTags(translateRequest.text),
		// source_lang: translateRequest.sourceLang,
		target_lang: translateRequest.targetLang,
		free_api: true,
		auth_key: deeplKey,
		formality: 'less',
		tag_handling: ['xml'],
		ignore_tags: ['variable']
	});
	if (result.status !== 200) {
		return {
			status: result.status
		};
	} else if (result.data.translations.length !== 1) {
		return {
			status: 500
		};
	}
	return {
		body: {
			text: removeVariableTags(result.data.translations[0].text),
			targetLang: translateRequest.targetLang
		}
	};
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
