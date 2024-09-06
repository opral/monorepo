import { firstValueFrom, map, merge, Observable, share, switchMap } from "rxjs";
import type { InlangPlugin } from "../../plugin/schema.js";
import type { ProjectSettings } from "../../json-schema/settings.js";
import {
	importPlugins,
	type PreprocessPluginBeforeImportFunction,
} from "../../plugin/importPlugins.js";
import { setSettings } from "./setSettings.js";
import type { Lix } from "@lix-js/sdk";
import { createSettings$ } from "./settings$.js";
import { createId$ } from "./id$.js";

/**
 * State of a project.
 */
export type ProjectState = Awaited<ReturnType<typeof createProjectState>>;

/**
 * The state of a project derived from the settings file in lix.
 *
 * Everything that's not in the database is stored here. Settings,
 * loaded plugins etc. The principal is "everything is derived
 * from the settings file in lix":
 *
 *   - the source of truth is the file.
 *      - crash resistance: if the state is lost, it can be re-imported.
 *      - portable: copy the file, open on another machine = same state.
 *
 *   - simple(r) unit testing (provide the settings file observable, done)
 */
export function createProjectState(args: {
	lix: Lix;
	providePlugins?: InlangPlugin[];
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
	settings: ProjectSettings;
}) {
	const settings$ = createSettings$(args);

	const _importPluginsResult$ = settings$.pipe(
		// distinctUntilChanges is bypassed for whatever reason
		// not important for now if the plugins re-import even if the modules are identical.
		// distinctUntilChanged((prev, curr) => {
		// 	console.log("distinct called");
		// 	return true;
		// }),
		switchMap((settings) =>
			// re-import the plugins when the settings change
			importPlugins({
				settings,
				lix: args.lix,
				preprocessPluginBeforeImport: args.preprocessPluginBeforeImport,
			})
		),
		share()
	);

	const plugins$ = _importPluginsResult$.pipe(
		map((result) => [...(args.providePlugins ?? []), ...result.plugins]),
		share()
	);

	const errors$ = merge(
		_importPluginsResult$.pipe(map((result) => result.errors))
	).pipe(share());

	const id$ = createId$({ lix: args.lix });

	return {
		id: {
			get: () => firstValueFrom(id$),
			// bind to keep the context of this
			subscribe: id$.subscribe.bind(id$),
		},
		settings: {
			get: () => firstValueFrom(settings$),
			set: (settings: ProjectSettings) =>
				setSettings({
					newSettings: settings,
					lix: args.lix,
				}),
			subscribe: settings$.subscribe,
		},
		errors: {
			get: () => firstValueFrom(errors$),
			// bind to keep the context of this
			subscribe: errors$.subscribe.bind(errors$),
		},
		plugins: {
			get: () => firstValueFrom(plugins$),
			// bind to keep the context of this
			subscribe: plugins$.subscribe.bind(plugins$),
		},
	};
}
