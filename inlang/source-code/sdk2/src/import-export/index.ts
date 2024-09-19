import type { Kysely } from "kysely";
import {
	PluginDoesNotImplementFunctionError,
	PluginMissingError,
} from "../plugin/errors.js";
import type { ProjectSettings } from "../json-schema/settings.js";
import type { InlangDatabaseSchema } from "../database/schema.js";
import { selectBundleNested } from "../query-utilities/selectBundleNested.js";
import type { InlangPlugin } from "../plugin/schema.js";
import { insertBundleNested } from "../query-utilities/insertBundleNested.js";
import type { ResourceFile } from "../project/api.js";
import { upsertBundleNestedMatchByProperties } from "../query-utilities/upsertBundleNestedMatchByProperties.js";

export async function importFiles(opts: {
	files: ResourceFile[];
	readonly pluginKey: string;
	readonly settings: ProjectSettings;
	readonly plugins: readonly InlangPlugin[];
	readonly db: Kysely<InlangDatabaseSchema>;
}) {
	const plugin = opts.plugins.find((p) => p.key === opts.pluginKey);
	if (!plugin) throw new PluginMissingError({ plugin: opts.pluginKey });
	if (!plugin.importFiles) {
		throw new PluginDoesNotImplementFunctionError({
			plugin: opts.pluginKey,
			function: "importFiles",
		});
	}

	const { bundles } = await plugin.importFiles({
		files: opts.files,
		settings: structuredClone(opts.settings),
	});

	const insertPromises = bundles.map((bundle) =>
		upsertBundleNestedMatchByProperties(opts.db, bundle)
	);

	await Promise.all(insertPromises);
	return bundles;
}

export async function exportFiles(opts: {
	readonly pluginKey: string;
	readonly settings: ProjectSettings;
	readonly plugins: readonly InlangPlugin[];
	readonly db: Kysely<InlangDatabaseSchema>;
}) {
	const plugin = opts.plugins.find((p) => p.key === opts.pluginKey);
	if (!plugin) throw new PluginMissingError({ plugin: opts.pluginKey });
	if (!plugin.exportFiles) {
		throw new PluginDoesNotImplementFunctionError({
			plugin: opts.pluginKey,
			function: "exportFiles",
		});
	}

	const bundles = await selectBundleNested(opts.db).selectAll().execute();
	const files = plugin.exportFiles({
		bundles: bundles,
		settings: structuredClone(opts.settings),
	});
	return files;
}
