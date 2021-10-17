import translate, { DeeplLanguages } from 'deepl';
import fetch from "node-fetch";

const deeplKey = "31a7ca11-e402-8551-4461-060eaa29a99c:fx" // process.env['DEEPL_SECRET_KEY'] as string;

export type CreateBaseTranslationRequestBody = {
	projectId: string;
	baseTranslation: {
		key_name: string;
		text: string;
	};
};

export async function postTranslateRequest(data: CreateBaseTranslationRequestBody) {
	const response = await fetch(
		"http://localhost:3000/api/internal/create-base-translation",
		{
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' }
		});
	return response
}
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

export async function str2translateRequest(s: string) {
	let r: TranslateRequestBody = {
		text: s,
		sourceLang: 'EN',
		targetLang: 'DE'
	}
	let r2 = await inl_translate(r)
	switch (typeof r2) {
		case "string": return r2;
		default: return "";
	}

}
export async function inl_translate(translateRequest: TranslateRequestBody) {

	const result = await translate({
		text: translateRequest.text,
		// source_lang: translateRequest.sourceLang,
		target_lang: translateRequest.targetLang,
		free_api: true,
		auth_key: deeplKey,
		formality: 'less',
		tag_handling: ['xml'],
		ignore_tags: ['variable']
	});
	console.log(result.statusText)
	if (result.status !== 200) {
		return {
			status: result.status
		};
	} else if (result.data.translations.length !== 1) {
		return {
			status: 500
		};
	}
	let text = result.data.translations[0].text
	let tgt = translateRequest.targetLang
	return text
}
