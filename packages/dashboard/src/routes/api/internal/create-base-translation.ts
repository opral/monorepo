import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { DeeplLanguages } from 'deepl';
import { definitions } from '@inlang/database';
import { createServerSideSupabaseClient } from '../_utils/serverSideServices';

/**
 * This endpoint uses the base translation to create machine translations
 * for other languages of the specified project.
 *
 * Use this endpoint whenever the base translation for a project is created.
 * You can identify a base translation by the `iso_code`. If the `iso_code` equals
 * the `project.default_iso_code`, then you know it's the base translation.
 *
 *
 * @returns status: 2xx | status: unknown
 * In case of a 2xx status the translations have been created. The consumer of the API
 * is responsible for fetching the translations from the database themselves.
 */

// this type is only exportable to be consumed in the front-end.
//* DO NOT import this type outside of the dashboard.
export type CreateBaseTranslationRequestBody = {
	baseTranslation: definitions['translation'];
};

export async function post(request: Request): Promise<EndpointOutput> {
	dotenv.config();

	if (request.headers['content-type'] !== 'application/json') {
		return {
			status: 405
		};
	}
	try {
        const requestBody = (request.body as unknown) as CreateBaseTranslationRequestBody;
        const supabase = createServerSideSupabaseClient()
        const projectLanguages = await supabase.from<definitions['language']>('language').select().match({project_id: requestBody.baseTranslation.project_id})
        if (projectLanguages.data === null || projectLanguages.error){
            throw projectLanguages.error
        }
        // iterating over all language iso codes of the project
        for (const language of [requestBody.baseTranslation.iso_code, projectLanguages.data.map(lang => lang.iso_code)]){
            
        }        
		let urls = [];
		for (const l of $projectStore.data.languages) {
			if (l.iso_code !== $projectStore.data.project.default_iso_code) {
				if (deeplLanguages.indexOf(l.iso_code.toUpperCase()) !== -1) {
					let request: TranslateRequestBody = {
						sourceLang: 'EN',
						targetLang: l.iso_code.toUpperCase(),
						text: text
					};
					urls.push({
						url: '/api/translate',
						params: {
							method: 'post',
							headers: new Headers({ 'content-type': 'application/json' }),
							body: JSON.stringify(request)
						}
					});
				} else {
					await database.from<definitions['translation']>('translation').insert({
						key_name: key,
						project_id: $projectStore.data.project.id,
						iso_code: l.iso_code,
						is_reviewed: false,
						text: ''
					});
				}
			} else {
				await database.from<definitions['translation']>('translation').insert({
					key_name: key,
					project_id: $projectStore.data.project.id,
					iso_code: $projectStore.data.project.default_iso_code,
					is_reviewed: false,
					text: text
				});
			}
		}
		const requests = urls.map((u) => fetch(u.url, u.params));

		Promise.all(requests).then((responses) => {
			isLoading = 2;
			const errors = responses.filter((response) => !response.ok);

			if (errors.length > 0) {
				throw errors.map((response) => Error(response.statusText));
			}

			const json = responses.map((response) => response.json());

			for (const r of json) {
				r.then(async (v) => {
					await database.from<definitions['translation']>('translation').insert({
						key_name: key,
						project_id: $projectStore.data.project.id,
						iso_code: v.targetLang.toLowerCase(),
						is_reviewed: false,
						text: v.text
					});
				});
			}
        
	} catch (e) {
		console.error(e);
	}
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
// function removeVariableTags(text: string): string {
// 	return text.replace(/<variable>/g, '').replace(/<\/variable>/g, '');
// }

const deeplIsoCodes = [
	'BG',
	'CS',
	'DA',
	'DE',
	'EL',
	'EN',
	'ES',
	'ET',
	'FI',
	'FR',
	'HU',
	'IT',
	'JA',
	'LT',
	'LV',
	'NL',
	'PL',
	'PT',
	'RO',
	'RU',
	'SK',
	'SL',
	'SV',
	'ZH'
];
