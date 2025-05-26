import { executeSync } from "../database/execute-sync.js";
import type { LixFile } from "./schema.js";
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

export function materializeFileData(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: Omit<LixFile, "data">;
}): Uint8Array {
	const plugins = [
		...args.lix.plugin.getAllSync(),
		lixUnknownFileFallbackPlugin,
	];

	// Find a plugin that can handle this file
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

		// Get plugin changes from state table
		const changes = executeSync({
			lix: args.lix,
			query: args.lix.db
				.selectFrom("state")
				.where("plugin_key", "=", plugin.key)
				.where("file_id", "=", args.file.id)
				.where("version_id", "=", args.file.version_id)
				.select([
					"entity_id",
					"schema_key",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"version_id",
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

	// This should never happen since lixUnknownFileFallbackPlugin matches all files
	throw new Error(
		`Unexpected: No plugin found to materialize file data for: ${args.file.path}`
	);
}