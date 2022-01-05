import { adapters } from '@inlang/adapters';
import { Result } from '@inlang/common';
import { definitions } from '@inlang/database';
import { Resources } from '@inlang/fluent-syntax';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const database = supabase;

// TODO
/**
 * Updates all languages in the database of a project and their corresponding files.
 *
 * Make sure that a subscription for the corresponding project is active and depent on the
 * subscription to update the UI (instead of the return type of this function).
 */
// This ugly function is required since the simple database schema of "just save fluent source files"
// entails having no proper api to update the database. The supabase API (builder) can't be used since the
// data is not relational (yet?).
export async function updateResourcesInDatabase(args: {
	projectId: definitions['project']['id'];
	resources: Resources;
}): Promise<Result<void, Error>> {
	const serializedResources = args.resources.serialize({ adapter: adapters.fluent });
	if (serializedResources.isErr) {
		return Result.err(serializedResources.error);
	}
	const promises = [];
	for (const serializedResource of serializedResources.value) {
		promises.push(
			supabase
				.from<definitions['language']>('language')
				.update({ file: serializedResource.data })
				.eq('project_id', args.projectId)
				.eq('iso_code', serializedResource.languageCode)
		);
	}
	const responses = await Promise.all(promises);
	const errors = responses.filter((response) => response.error !== null);
	if (errors.length > 0) {
		const message =
			errors.length > 1
				? `Multiple errors occured: \n${errors
						.map((error) => error.error?.message)
						.reduce((a, b) => a + '\n' + b)}`
				: errors[0].error?.message;
		return Result.err(Error(message));
	}
	return Result.ok(undefined);
}
