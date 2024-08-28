import { type Lix } from "@lix-js/sdk";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../schema/settings.js";
import { type SqliteDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import { initHandleSaveToLixOnChange } from "./initHandleSaveToLixOnChange.js";
import { type PreprocessPluginBeforeImportFunction } from "../plugin/importPlugins.js";
import type { InlangProject, Subscription } from "./api.js";
import { createState } from "./state/state.js";
import { BehaviorSubject, map, Observable } from "rxjs";
import { setSettings } from "./state/setSettings.js";
import { withLanguageTagToLocaleMigration } from "../migrations/v2/withLanguageTagToLocaleMigration.js";
import { exportFiles, importFiles } from "../import-export/index.js";

/**
 * Common load project logic.
 */
export async function loadProject(args: {
	sqlite: SqliteDatabase;
	lix: Lix;
	/**
	 * Provide plugins to the project.
	 *
	 * This is useful for testing or providing plugins that are
	 * app specific. Keep in mind that provided plugins
	 * are not shared with other instances.
	 */
	providePlugins?: InlangPlugin[];
	/**
	 * Function that preprocesses the plugin before importing it.
	 *
	 * The callback can be used to process plugins as needed in the
	 * environment of the app. For example, Sherlock uses this to convert
	 * ESM, which all inlang plugins are written in, to CJS which Sherlock
	 * runs in.
	 *
	 * @example
	 *   const project = await loadProject({ preprocessPluginBeforeImport: (moduleText) => convertEsmToCjs(moduleText) })
	 *
	 */
	preprocessPluginBeforeImport?: PreprocessPluginBeforeImportFunction;
}): Promise<InlangProject> {
	const db = initDb({ sqlite: args.sqlite });

	const settingsFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const settings = withLanguageTagToLocaleMigration(
		JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings
	);

	const state = await createState({
		...args,
		settings,
	});

	await initHandleSaveToLixOnChange({
		sqlite: args.sqlite,
		db,
		lix: args.lix,
		state,
	});

	const settled = async () => {
		await Promise.all(state.pendingPromises);
		await args.lix.settled();
	};

	return {
		db,
		settings: {
			get: () => structuredClone(state.settings$.getValue()) as ProjectSettings,
			subscribe: withStructuredClone(state.settings$)
				.subscribe as Subscription<ProjectSettings>,
			set: (newSettings) => setSettings({ newSettings, lix: args.lix, state }),
		},
		plugins: {
			get: () => state.plugins$.getValue() as InlangPlugin[],
			subscribe: withStructuredClone(state.plugins$).subscribe as Subscription<
				InlangPlugin[]
			>,
		},
		errors: {
			get: () => structuredClone(state.errors$.getValue()) as Error[],
			subscribe: withStructuredClone(state.errors$).subscribe as Subscription<
				Error[]
			>,
		},
		settled,
		importFiles: async ({ files, pluginKey }) => {
			return await importFiles({
				files,
				pluginKey,
				settings: state.settings$.getValue(),
				plugins: state.plugins$.getValue(),
				db,
			});
		},
		exportFiles: async ({ pluginKey }) => {
			return await exportFiles({
				pluginKey,
				db,
				plugins: state.plugins$.getValue(),
				settings: state.settings$.getValue(),
			});
		},
		close: async () => {
			args.sqlite.close();
			await db.destroy();
			await args.lix.close();
		},
		_sqlite: args.sqlite,
		toBlob: async () => {
			await settled();
			return await args.lix.toBlob();
		},
		lix: args.lix,
	};
}

/**
 * Ensures that the given value is a clone of the original value.
 *
 * The DX is higher and risks for bugs lower if the project API
 * returns immutable values.
 */
function withStructuredClone<T>(subject: BehaviorSubject<T> | Observable<T>) {
	return subject.pipe(map((v) => structuredClone(v)));
}
