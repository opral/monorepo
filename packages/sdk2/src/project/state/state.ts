import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	merge,
	share,
	switchMap,
} from "rxjs";
import type { InlangPlugin } from "../../plugin/schema.js";
import type { ProjectSettings } from "../../schema/settings.js";
import {
	importPlugins,
	type PreprocessPluginBeforeImportFunction,
} from "../../plugin/importPlugins.js";

/**
 * State of a project.
 *
 * BehaviorSubject's are Readonly to prevent mutation bugs.
 * In case you wonder: The cost of structuredClone for every
 * getter or subscription is too high (internally).
 */
export type State = Awaited<ReturnType<typeof createState>>;

export function createState(args: {
	providePlugins?: InlangPlugin[];
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
	settings: ProjectSettings;
}) {
	/**
	 * Pending promises are used for the `project.settled()` api.
	 */
	// TODO implement garbage collection/a proper queue.
	//      for the protoype and tests, it seems good enough
	//      without garbage collection of old promises.
	const pendingPromises: Promise<unknown>[] = [];

	const settings$ = new BehaviorSubject<Readonly<ProjectSettings>>(
		args.settings
	);

	const _plugins$ = new BehaviorSubject<InlangPlugin[]>([]);

	const _pluginsImportResult$ = settings$.pipe(
		distinctUntilChanged((prev, curr) => {
			if (prev.modules?.length !== curr.modules?.length) {
				return false;
			}
			return true;
		}),
		switchMap((settings) =>
			importPlugins({
				settings,
				preprocessPluginBeforeImport: args.preprocessPluginBeforeImport,
			})
		)
	);

	_pluginsImportResult$.subscribe((v) => _plugins$.next(v));

	const plugins$ = _pluginsImportResult$.pipe(
		map((result) => [...(args.providePlugins ?? []), ...result.plugins]),
		share()
	);

	const errors$ = merge(
		_pluginsImportResult$.pipe(map((result) => result.errors))
	);

	return {
		settings: {
			get: () => settings$.getValue(),
			subscribe: settings$.subscribe.bind(settings$),
		},
		errors: {
			get: () => errors$.getValue(),
			subscribe: errors$.subscribe.bind(errors$),
		},
		plugins: {
			get: () => plugins$.getValue(),
			subscribe: plugins$.subscribe.bind(plugins$),
		},
	};
}
