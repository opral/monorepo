import type { definitions } from '../../../../database';
import { PostgrestError } from '@supabase/postgrest-js';
import { Updater, writable } from 'svelte/store';
import { database } from '../services/database';
import { TranslationAPI } from '@inlang/common/src/fluent/formatter';
import { FluentAdapter } from '@inlang/common/src/adapters/fluentAdapter';
import { Result } from '@inlang/common/src/types/result';

/**
 * Bundles project related information regarding one project tightly together in
 * one object. Corresponds to `/project/[projectId]` route.
 *
 * Avoids the need to repeat same queries over and over in each project/[projectId] subroute.
 */
export const projectStore = createProjectStore();

interface ProjectStoreInterface {
	data: null | {
		project: definitions['project'];
		languages: definitions['language'][];
		translations: TranslationAPI;
	};
	error: PostgrestError | Error | null;
}

function createProjectStore() {
	const { subscribe, update, set } = writable<ProjectStoreInterface>({
		data: null,
		error: null
	});

	return {
		subscribe,
		set,
		getData: (args: GetDataArgs) => getData(args, update)
	};
}

type GetDataArgs = {
	projectId: definitions['project']['id'];
};

// a true ugly monster function
async function getData(
	args: GetDataArgs,
	updateStore: (updater: Updater<ProjectStoreInterface>) => void
): Promise<void> {
	const project = await database
		.from<definitions['project']>('project')
		.select('*')
		.match({ id: args.projectId })
		.single();
	// in-efficient to query three times but doesn't matter for now
	const languages = await database
		.from<definitions['language']>('language')
		.select('*')
		.match({ project_id: args.projectId })
		.order('iso_code', { ascending: true });

	const translations: Result<TranslationAPI, Error> = TranslationAPI.parse({
		adapter: new FluentAdapter(),
		files:
			languages.data?.map((language) => ({
				data: language.file,
				languageCode: language.iso_code
			})) ?? [],
		baseLanguage: project.data?.default_iso_code ?? 'en' // Always defined according to schema
	});

	// multiple errors might slip i.e. project.error is true but translation.error is true as well.
	let error: ProjectStoreInterface['error'] | null = null;
	if (project.error) {
		error = project.error;
	} else if (languages.error) {
		error = languages.error;
	} else if (translations.isErr) {
		error = translations.error;
	}
	if (translations.isErr || error) {
		updateStore(() => ({ data: null, error: error }));
	} else {
		updateStore(() => {
			// null checking
			if (project.data === null || languages.data === null || translations.value === null) {
				return {
					data: null,
					// using postgresterror here to not have type `error:
					error: {
						code: '',
						details: 'Some value was null although it should not have been',
						message: 'Some value was null although it should not have been',
						hint: 'projectStore'
					}
				};
			}
			return {
				data: {
					project: project.data,
					languages: languages.data,
					translations: translations.value
				},
				error: null
			};
		});
	}
}
