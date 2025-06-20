import { executeSync } from "../database/execute-sync.js";
import type { LixFileType } from "./schema.js";
import type { Lix } from "../lix/open-lix.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";

function globSync(args: {
	lix: Pick<Lix, "sqlite">;
	glob: string;
	path: string;
}): boolean {
	const columnNames: string[] = [];
	const result = args.lix.sqlite.exec({
		sql: `SELECT CASE WHEN ? GLOB ? THEN 1 ELSE 0 END AS matches`,
		bind: [args.path, args.glob],
		returnValue: "resultRows",
		columnNames,
	});

	return (result[0]?.[0] as any) === 1;
}

export function materializeFileDataAtChangeset(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: LixFileType;
	changeSetId: string;
	depth: number;
}): Uint8Array {
	const plugins = args.lix.plugin.getAllSync();

	// First, try to find a specific plugin that can handle this file (excluding fallback)
	for (const plugin of plugins) {
		if (
			!plugin.detectChangesGlob ||
			!globSync({
				lix: args.lix,
				path: args.file.path,
				glob: plugin.detectChangesGlob,
			})
		) {
			continue;
		}

		if (!plugin.applyChanges) {
			continue;
		}

		// Get plugin changes from state_history table
		const changes = executeSync({
			lix: args.lix,
			query: args.lix.db
				.selectFrom("state_history")
				.where("plugin_key", "=", plugin.key)
				.where("file_id", "=", args.file.id)
				.where("change_set_id", "=", args.changeSetId)
				.where("depth", "=", args.depth)
				.select([
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"change_set_id as version_id", // Map to maintain compatibility
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
			file: args.file,
			changes: formattedChanges,
		});

		return file.fileData;
	}

	// If no specific plugin matched, use the fallback plugin
	const changes = executeSync({
		lix: args.lix,
		query: args.lix.db
			.selectFrom("state_history")
			.where("plugin_key", "=", lixUnknownFileFallbackPlugin.key)
			.where("file_id", "=", args.file.id)
			.where("change_set_id", "=", args.changeSetId)
			.where("depth", "=", args.depth)
			.select([
				"entity_id",
				"schema_key",
				"file_id",
				"plugin_key",
				"snapshot_content",
				"change_set_id as version_id", // Map to maintain compatibility
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
			`[materializeFileDataAtChangeset] No changes found for file ${args.file.id} with plugin ${lixUnknownFileFallbackPlugin.key} at changeset ${args.changeSetId} depth ${args.depth}. Cannot materialize file data.`
		);
	}

	const file = lixUnknownFileFallbackPlugin.applyChanges!({
		file: args.file,
		changes: formattedChanges,
	});

	return file.fileData;
}