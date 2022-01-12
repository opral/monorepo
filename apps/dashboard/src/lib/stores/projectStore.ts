import type { definitions } from '@inlang/database';
import { PostgrestError } from '@supabase/postgrest-js';
import { Updater, writable } from 'svelte/store';
import { database } from '../services/database';
import { Result } from '@inlang/common';
import { Resources } from '@inlang/fluent-syntax';
import { adapters } from '@inlang/adapters';
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
		resources: Resources;
	};
	error: PostgrestError | Error | null;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createProjectStore() {
	const { subscribe, update, set } = writable<ProjectStoreInterface>({
		data: null,
		error: null
	});

	return {
		subscribe,
		set,
		getData: (args: GetDataArgs): Promise<void> => getData(args, update),
		updateResourcesInDatabase: () => updateResourcesInDatabase({ updater: update })
	};
}

type GetDataArgs = {
	projectId: definitions['project']['id'];
};

/**
 * Updates all languages in the database of a project and their corresponding files.
 *
 * Make sure that a subscription for the corresponding project is active and depent on the
 * subscription to update the UI (instead of the return type of this function).
 */
// This ugly function is required since the simple database schema of "just save fluent source files"
// entails having no proper api to update the database. The supabase API (builder) can't be used since the
// data is not relational (yet?).
async function updateResourcesInDatabase(args: {
	updater: (updater: Updater<ProjectStoreInterface>) => void;
}): Promise<Result<void, Error>> {
	let project: ProjectStoreInterface | undefined;
	// little hack to get the current value of the project store
	projectStore.subscribe((p) => {
		project = p;
	});
	while (project === undefined) {
		// wait 10 milliseconds
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
	if (project.data === null) {
		return Result.err(Error('project.data was null'));
	}
	const serializedResources = project.data.resources.serialize({ adapter: adapters.fluent });
	if (serializedResources.isErr) {
		return Result.err(serializedResources.error);
	}
	const promises = [];
	for (const serializedResource of serializedResources.value) {
		promises.push(
			database
				.from<definitions['language']>('language')
				.update({ file: serializedResource.data })
				.eq('project_id', project.data.project.id)
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
	getData({ projectId: project.data.project.id }, args.updater);
	return Result.ok(undefined);
}

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

	const resources: Result<Resources, Error> = Resources.parse({
		adapter: adapters.fluent,
		files:
			languages.data?.map((language) => ({
				data: language.file,
				languageCode: language.iso_code
			})) ?? [],
		baseLanguageCode: project.data?.default_iso_code ?? 'en' // Always defined according to schema
	});

	// multiple errors might slip i.e. project.error is true but translation.error is true as well.
	let error: ProjectStoreInterface['error'] | null = null;
	if (project.error) {
		error = project.error;
	} else if (languages.error) {
		error = languages.error;
	} else if (resources.isErr) {
		error = resources.error;
	}
	if (resources.isErr || error) {
		updateStore(() => ({ data: null, error: error }));
	} else {
		updateStore(() => {
			// null checking
			if (project.data === null || languages.data === null || resources.value === null) {
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
					resources: resources.value
				},
				error: null
			};
		});
	}
}
