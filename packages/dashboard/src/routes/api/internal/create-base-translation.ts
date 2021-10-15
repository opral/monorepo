import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { DeeplLanguages } from 'deepl';
import { definitions } from '@inlang/database';
import { createServerSideSupabaseClient } from '../_utils/serverSideServices';
import { TranslateRequestBody, TranslateResponseBody } from './translate';

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
	projectId: definitions['project']['id'];
	baseTranslation: {
		key_name: definitions['translation']['key_name'];
		text: definitions['translation']['text'];
	};
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
		const supabase = createServerSideSupabaseClient();
		const project = await supabase
			.from<definitions['project']>('project')
			.select()
			.match({ id: requestBody.projectId })
			.single();
		if (project.data === null || project.error) {
			console.error('project likely does not exist');
			return {
				status: 500
			};
		}

		// just in case upserting the key, in case it does not exist yet.
		const key = await supabase
			.from<definitions['key']>('key')
			.upsert(
				{ name: requestBody.baseTranslation.key_name, project_id: requestBody.projectId },
				{ onConflict: 'name, project_id' }
			);

		if (key.error) {
			console.error(key.error);
			return {
				status: 500
			};
		}

		const projectLanguages = await supabase
			.from<definitions['language']>('language')
			.select()
			.match({ project_id: requestBody.projectId });
		if (projectLanguages.data === null || projectLanguages.error) {
			throw projectLanguages.error;
		}
		// wrapping all translations below in promises and execute in `Promise.all` speeds up
		// the function fundamentaly through parallelism
		const promises: Promise<void>[] = [];
		// iterating over all language iso codes of the project
		// assumes that https://linear.app/inlang/issue/INL-95/database-project-should-have-a-default-language-model is implemented
		for (const language of projectLanguages.data) {
			promises.push(
				(async () => {
					let text: definitions['translation']['text'] | null = null;
					if (language.iso_code === project.data.default_iso_code) {
						text = requestBody.baseTranslation.text;
					} else if (
						language.iso_code !== project.data.default_iso_code &&
						deeplIsoCodes.includes(language.iso_code.toUpperCase())
					) {
						const machineTranslationRequest: TranslateRequestBody = {
							sourceLang: 'EN',
							targetLang: language.iso_code.toUpperCase() as DeeplLanguages,
							text: requestBody.baseTranslation.text
						};
						// since this is server side, realtive url paths don't work.
						const machineTranslationResponse = await fetch(
							process.env['VITE_PUBLIC_AUTH_REDIRECT_URL'] + '/api/internal/translate',
							{
								method: 'post',
								headers: new Headers({ 'content-type': 'application/json' }),
								body: JSON.stringify(machineTranslationRequest)
							}
						);
						if (machineTranslationResponse.ok) {
							const json = ((await machineTranslationResponse.json()) as unknown) as TranslateResponseBody;
							text = json.text;
						} else {
							// we pass on the error for now
							console.warn('Error from /api/internal/translation endpoint');
						}
					}
					if (text === null || text === undefined) {
						console.warn(
							'Text of a to be created translation was null or undefined. Thus, has not been created.'
						);
					} else {
						// insert translation into database
						const insertion = await supabase
							.from<definitions['translation']>('translation')
							.insert({
								key_name: requestBody.baseTranslation.key_name,
								project_id: requestBody.projectId,
								iso_code: language.iso_code,
								text: text
							});
						if (insertion.error) {
							throw `Insertion of ${requestBody.baseTranslation.key_name}-${language.iso_code} went wrong:`;
						}
					}
					// additional parantheses to execute the function, otherwise the array is not an array of promises
				})()
			);
		}
		await Promise.all(promises);
		return {
			status: 200
		};
	} catch (e) {
		console.error(e);
		return {
			status: 500
		};
	}
}

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
