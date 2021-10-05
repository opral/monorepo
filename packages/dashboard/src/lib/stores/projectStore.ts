import type { definitions } from '@inlang/database';
import { PostgrestError } from '@supabase/postgrest-js';
import { Updater, writable } from 'svelte/store';
import { database } from '../services/database';

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
		translations: definitions['translation'][];
		keys: definitions['key'][];
	};
	error: PostgrestError | null;
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
		.match({ project_id: args.projectId });

	const keys = await database
		.from<definitions['key']>('key')
		.select('*')
		.match({ project_id: args.projectId });

	const translations = await database
		.from<definitions['translation']>('translation')
		.select('*')
		.in('key_id', keys.data?.map((key) => key.id) ?? []);

	// multiple errors might slip i.e. project.error is true but translation.error is true as well.
	let error: ProjectStoreInterface['error'] | null = null;
	if (project.error) {
		error = project.error;
	} else if (languages.error) {
		error = languages.error;
	} else if (keys.error) {
		error = keys.error;
	} else if (translations.error) {
		error = translations.error;
	}
	if (error) {
		updateStore(() => ({ data: null, error: error }));
	} else {
		updateStore(() => {
			// null checking
			if (
				project.data === null ||
				languages.data === null ||
				keys.data === null ||
				translations.data === null
			) {
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
					keys: keys.data,
					languages: languages.data,
					translations: translations.data
				},
				error: null
			};
		});
	}
}
