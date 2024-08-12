import { type Lix } from "@lix-js/sdk";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../schema/settings.js";
import { contentFromDatabase, type SqliteDatabase } from "sqlite-wasm-kysely";
import { initKysely } from "../database/initKysely.js";
import { initHandleSaveToLixOnChange } from "./logic/initHandleSaveToLixOnChange.js";
import { importPlugins } from "../plugin/importPlugins.js";
import type { InlangProject, Subscription } from "./api.js";
import { createReactiveState } from "./logic/reactiveState.js";
import { BehaviorSubject, map } from "rxjs";
import { setSettings } from "./logic/setSettings.js";
import { withLanguageTagToLocaleMigration } from "../migrations/v2/withLanguageTagToLocaleMigration.js";

/**
 * Common load project logic.
 */
export async function loadProject(args: {
	sqlite: SqliteDatabase;
	lix: Lix;
	/**
	 * For testing purposes only.
	 *
	 * @example
	 *   const project = await loadProject({ _mockPlugins: { "my-plugin": InlangPlugin } })
	 *
	 */
	_mockPlugins?: Record<string, InlangPlugin>;
}): Promise<InlangProject> {
	const db = initKysely({ sqlite: args.sqlite });

	const settingsFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const settings = withLanguageTagToLocaleMigration(
		JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings
	);

	const { plugins, errors: pluginErrors } = await importPlugins({
		settings,
		mockPlugins: args._mockPlugins,
	});

	const reactiveState = await createReactiveState({
		plugins,
		errors: pluginErrors,
		settings,
	});

	await initHandleSaveToLixOnChange({ sqlite: args.sqlite, db, lix: args.lix });

	return {
		db,
		plugins: {
			get: () => reactiveState.plugins$.getValue() as InlangPlugin[],
			subscribe: withStructuredClone(reactiveState.plugins$)
				.subscribe as Subscription<InlangPlugin[]>,
		},
		errors: {
			get: () => structuredClone(reactiveState.errors$.getValue()) as Error[],
			subscribe: withStructuredClone(reactiveState.errors$)
				.subscribe as Subscription<Error[]>,
		},
		settings: {
			get: () =>
				structuredClone(reactiveState.settings$.getValue()) as ProjectSettings,
			subscribe: withStructuredClone(reactiveState.settings$)
				.subscribe as Subscription<ProjectSettings>,
			set: (newSettings) =>
				setSettings({ newSettings, lix: args.lix, reactiveState }),
		},
		importFiles: () => {
			throw new Error("Not implemented");
		},
		exportFiles: () => {
			throw new Error("Not implemented");
		},
		close: async () => {
			args.sqlite.close();
			await db.destroy();
			await args.lix.close();
		},
		_sqlite: args.sqlite,
		toBlob: async () => {
			const inlangDbContent = contentFromDatabase(args.sqlite);
			// flush db to lix
			await args.lix.db
				.updateTable("file")
				.where("path", "is", "/db.sqlite")
				.set({
					data: inlangDbContent,
				})
				.execute();
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
function withStructuredClone<T>(subject: BehaviorSubject<T>) {
	return subject.pipe(map((v) => structuredClone(v)));
}
