import { executeSync } from "../../database/execute-sync.js";
import type { LixEngine } from "../../engine/boot.js";
import type { LixFile } from "./schema.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { ensureCompleteDescriptor } from "./descriptor-utils.js";
import { matchesGlob } from "../util/glob.js";

export function materializeFileData(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "getAllPluginsSync">;
	file: Pick<LixFile, "id" | "path"> &
		Partial<Omit<LixFile, "id" | "path" | "data">>;
	versionId: string;
}): Uint8Array {
	const plugins = args.engine.getAllPluginsSync();
	const descriptor = ensureCompleteDescriptor({
		engine: args.engine,
		versionId: args.versionId,
		file: args.file,
	});

	// First, try to find a specific plugin that can handle this file (excluding fallback)
	for (const plugin of plugins) {
		if (
			!plugin.detectChangesGlob ||
			!matchesGlob({
				engine: args.engine,
				path: descriptor.path,
				pattern: plugin.detectChangesGlob,
			})
		) {
			continue;
		}

		if (!plugin.applyChanges) {
			continue;
		}

		// Get plugin changes from state table
		const changes = executeSync({
			engine: args.engine,
			query: args.engine.db
				.selectFrom("state_all")
				.where("plugin_key", "=", plugin.key)
				.where("file_id", "=", descriptor.id)
				.where("version_id", "=", args.versionId)
				.select([
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"version_id",
					"created_at",
				]),
		});

		// Format changes for plugin
		const formattedChanges = changes.map((change) => ({
			...change,
			snapshot_content:
				typeof change.snapshot_content === "string"
					? JSON.parse(change.snapshot_content)
					: change.snapshot_content,
		}));

		const file = plugin.applyChanges({
			file: descriptor,
			changes: formattedChanges,
		});

		return file.fileData;
	}

	// If no specific plugin matched, use the fallback plugin
	const changes = executeSync({
		engine: args.engine,
		query: args.engine.db
			.selectFrom("state_all")
			.where("plugin_key", "=", lixUnknownFileFallbackPlugin.key)
			.where("file_id", "=", descriptor.id)
			.where("version_id", "=", args.versionId)
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"plugin_key",
				"snapshot_content",
				"version_id",
				"created_at",
			]),
	});

	// Format changes for plugin
	const formattedChanges = changes.map((change) => ({
		...change,
		snapshot_content:
			typeof change.snapshot_content === "string"
				? JSON.parse(change.snapshot_content)
				: change.snapshot_content,
	}));

	if (formattedChanges.length === 0) {
		throw new Error(
			`[materializeFileData] No changes found for file ${args.file.id} with plugin ${lixUnknownFileFallbackPlugin.key}. Cannot materialize file data.`
		);
	}

	const file = lixUnknownFileFallbackPlugin.applyChanges!({
		file: descriptor,
		changes: formattedChanges,
	});

	return file.fileData;
}
