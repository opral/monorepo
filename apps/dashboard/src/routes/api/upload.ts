import type { EndpointOutput, Request } from '@sveltejs/kit';
import * as dotenv from 'dotenv';
import { createServerSideSupabaseClient } from './_utils/serverSideServices';
import type { definitions } from '@inlang/database';
import { SerializedResource } from '@inlang/fluent-syntax';

/**
 * This is a middleware api endpoint for the CLI.
 *
 * API Endpoint exists because supabase has no way to authorize api keys yet.
 */

type RequestBody = {
	// yeah yeah don't put the api key in the body
	// pssst you never saw that
	apiKey: string;
	files: SerializedResource[];
};

export async function post(request: Request): Promise<EndpointOutput<string>> {
	dotenv.config();
	if (request.headers['content-type'] !== 'application/json') {
		return {
			status: 405
		};
	}
	const supabase = createServerSideSupabaseClient();
	const requestBody = (request.body as unknown) as RequestBody;
	const project = await supabase
		.from<definitions['project']>('project')
		.select()
		.match({ api_key: requestBody.apiKey })
		.single();
	if (project.error) {
		return {
			status: 500
		};
	}
	if (project.data === null) {
		return {
			status: 404
		};
	}
	for (const file of requestBody.files) {
		const languages = await supabase
			.from<definitions['language']>('language')
			.update({ file: file.data })
			.match({ project_id: project.data.id, iso_code: file.languageCode });
		if (languages.error) {
			return {
				status: 500
			};
		}
	}
	return {
		status: 200
	};
}
