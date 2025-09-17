import { type Account, type Lix } from "@lix-js/sdk";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import {
	contentFromDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import {
	importPlugins,
	type PreprocessPluginBeforeImportFunction,
} from "../plugin/importPlugins.js";
import type { InlangProject } from "./api.js";
import { withLanguageTagToLocaleMigration } from "../migrations/v2/withLanguageTagToLocaleMigration.js";
import { v4 } from "uuid";
import { maybeCaptureLoadedProject } from "./maybeCaptureTelemetry.js";
import { importFiles } from "../import-export/importFiles.js";
import { exportFiles } from "../import-export/exportFiles.js";

/**
 * Common load project logic.
 */
export async function loadProject(args: {
	sqlite: SqliteWasmDatabase;
	lix: Lix;
	/**
	 * The account that loaded the project.
	 *
	 * Defaults to an anonymous/new account if undefined.
	 *
	 * @example
	 *   const account = localStorage.getItem("account")
	 *   const project = await loadProject({ account })
	 */
	account?: Account;
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
	/**
	 * The id of the app that is using the SDK.
	 *
	 * The is used for telemetry purposes. To derive insights like
	 * which app is using the SDK, how many projects are loaded, etc.
	 *
	 * The app id can be removed at any time in the future
	 */
	appId?: string;
}): Promise<InlangProject> {
	const db = initDb({ lix: args.lix });

	await maybeMigrateFirstProjectId({ lix: args.lix });

	const settingsFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const settings = withLanguageTagToLocaleMigration(
		JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings
	);

	const importedPlugins = await importPlugins({
		settings,
		lix: args.lix,
		preprocessPluginBeforeImport: args.preprocessPluginBeforeImport,
	});

	const plugins = [...(args.providePlugins ?? []), ...importedPlugins.plugins];

	const idFile = await args.lix.db
		.selectFrom("file")
		.where("path", "=", "/project_id")
		.select("data")
		.executeTakeFirstOrThrow();

	const id = new TextDecoder().decode(idFile.data);

	// const state = createProjectState({
	// 	...args,
	// 	settings,
	// });

	// not awaiting to not block the load time of a project
	maybeCaptureLoadedProject({
		db,
		id,
		settings,
		plugins,
		lix: args.lix,
		appId: args.appId,
	});

	return {
		db,
		id: {
			get: async () => {
				const file = await args.lix.db
					.selectFrom("file")
					.where("path", "=", "/project_id")
					.select("file.data")
					.executeTakeFirstOrThrow();
				return new TextDecoder().decode(file.data);
			},
		},
		settings: {
			get: async () => {
				const file = await args.lix.db
					.selectFrom("file")
					.where("path", "=", "/settings.json")
					.select("file.data")
					.executeTakeFirstOrThrow();
				return withLanguageTagToLocaleMigration(
					JSON.parse(new TextDecoder().decode(file.data))
				);
			},
			set: async (newSettings) => {
				const cloned = JSON.parse(JSON.stringify(newSettings));
				cloned.languageTags = cloned.locales;
				cloned.sourceLanguageTag = cloned.baseLocale;

				await args.lix.db
					.updateTable("file")
					.where("path", "=", "/settings.json")
					.set({
						data: new TextEncoder().encode(
							JSON.stringify(cloned, undefined, 2)
						),
					})
					.execute();
			},
		},
		plugins: {
			get: async () => plugins,
		},
		errors: {
			get: async () => [...importedPlugins.errors],
		},
		// errors: state.errors,
		importFiles: async ({ files, pluginKey }) => {
			const settingsFile = await args.lix.db
				.selectFrom("file")
				.where("path", "=", "/settings.json")
				.select("file.data")
				.executeTakeFirstOrThrow();

			const settings = JSON.parse(
				new TextDecoder().decode(settingsFile.data)
			) as ProjectSettings;

			return await importFiles({
				files,
				pluginKey,
				settings,
				// TODO don't use global state, might be stale
				plugins,
				db,
			});
		},
		exportFiles: async ({ pluginKey }) => {
			const settingsFile = await args.lix.db
				.selectFrom("file")
				.where("path", "=", "/settings.json")
				.select("file.data")
				.executeTakeFirstOrThrow();

			const settings = JSON.parse(
				new TextDecoder().decode(settingsFile.data)
			) as ProjectSettings;

			return (
				await exportFiles({
					pluginKey,
					db,
					settings,
					// TODO don't use global state, might be stale
					plugins,
				})
			).map((output) => ({ ...output, pluginKey }));
		},
		close: async () => {
			await saveDbToLix({ sqlite: args.sqlite, lix: args.lix });
			await db.destroy();
			await args.lix.db.destroy();
		},
		_sqlite: args.sqlite,
		toBlob: async () => {
			await saveDbToLix({ sqlite: args.sqlite, lix: args.lix });
			return await args.lix.toBlob();
		},
		lix: args.lix,
	};
}

async function saveDbToLix(args: {
	sqlite: SqliteWasmDatabase;
	lix: Lix;
}): Promise<void> {
	const data = contentFromDatabase(args.sqlite);
	await args.lix.db
		.updateTable("file")
		.set("data", data)
		.where("path", "=", "/db.sqlite")
		.execute();
}

/**
 * Old leftover migration from v1. Probably not needed anymore.
 *
 * Kept it in just in case.
 */
async function maybeMigrateFirstProjectId(args: { lix: Lix }): Promise<void> {
	const firstProjectIdFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/project_id")
		.executeTakeFirst();

	if (!firstProjectIdFile) {
		await args.lix.db
			.insertInto("file")
			.values({
				path: "/project_id",
				data: new TextEncoder().encode(v4()),
			})
			.execute();
	}
}
