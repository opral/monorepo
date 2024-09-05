import { type Lix } from "@lix-js/sdk";
import type { InlangPlugin } from "../plugin/schema.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import { type SqliteDatabase } from "sqlite-wasm-kysely";
import { initDb } from "../database/initDb.js";
import { initHandleSaveToLixOnChange } from "./initHandleSaveToLixOnChange.js";
import { type PreprocessPluginBeforeImportFunction } from "../plugin/importPlugins.js";
import type { InlangProject } from "./api.js";
import { createProjectState } from "./state/state.js";
import { withLanguageTagToLocaleMigration } from "../migrations/v2/withLanguageTagToLocaleMigration.js";
import { exportFiles, importFiles } from "../import-export/index.js";
import { v4 } from "uuid";
import { maybeCaptureLoadedProject } from "./maybeCaptureTelemetry.js";

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
	/**
	 * The id of the app that is using the SDK.
	 *
	 * The is used for telemetry purposes. To derive insights like
	 * which app is using the SDK, how many projects are loaded, etc.
	 *
	 * The app id can be removed at any time in the future
	 */
	applicationId?: string;
	/**
	 * The version of the application that is using the SDK.
	 *
	 * This is used for telemetry purposes. To derive insights like
	 * which version of the SDK is used, how many projects are loaded, etc.
	 *
	 * The application version can be removed at any time in the future.
	 */
	applicationVersion?: string;
}): Promise<InlangProject> {
	const db = initDb({ sqlite: args.sqlite });

	await maybeMigrateFirstProjectId({ lix: args.lix });

	const settingsFile = await args.lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const settings = withLanguageTagToLocaleMigration(
		JSON.parse(new TextDecoder().decode(settingsFile.data)) as ProjectSettings
	);

	const state = createProjectState({
		...args,
		settings,
	});

	/**
	 * Pending promises are used for the `project.settled()` api.
	 */
	// TODO implement garbage collection/a proper queue.
	//      for the protoype and tests, it seems good enough
	//      without garbage collection of old promises.
	const pendingPromises: Promise<unknown>[] = [];

	await initHandleSaveToLixOnChange({
		sqlite: args.sqlite,
		db,
		lix: args.lix,
		pendingPromises,
	});

	// todo not garbage collected
	// todo2 settled is not needed if lix has an attach mode for sqlite
	const settled = async () => {
		await Promise.all(pendingPromises);
		await args.lix.settled();
	};

	// not awaiting to not block the load time of a project
	maybeCaptureLoadedProject({
		db,
		state,
		applicationId: args.applicationId,
		applicationVersion: args.applicationVersion,
	});

	return {
		db,
		id: state.id,
		settings: state.settings,
		plugins: state.plugins,
		errors: state.errors,
		settled,
		importFiles: async ({ files, pluginKey }) => {
			return await importFiles({
				files,
				pluginKey,
				settings: await state.settings.get(),
				plugins: await state.plugins.get(),
				db,
			});
		},
		exportFiles: async ({ pluginKey }) => {
			return await exportFiles({
				pluginKey,
				db,
				settings: await state.settings.get(),
				plugins: await state.plugins.get(),
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
