import { executeSync } from "../database/execute-sync.js";
import type { Lix } from "../lix/open-lix.js";
import type { LixFile } from "./schema.js";
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

export function materializeFileDataAtCommit(args: {
	lix: Pick<Lix, "sqlite" | "plugin" | "db">;
	file: Omit<LixFile, "data">;
	rootCommitId: string;
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
			query: selectFileChanges({
				lix: args.lix,
				pluginKey: plugin.key,
				fileId: args.file.id,
				rootCommitId: args.rootCommitId,
				depth: args.depth,
			}),
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
		query: selectFileChanges({
			lix: args.lix,
			pluginKey: lixUnknownFileFallbackPlugin.key,
			fileId: args.file.id,
			rootCommitId: args.rootCommitId,
			depth: args.depth,
		}),
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
			`[materializeFileDataAtCommit] No changes found for file ${args.file.id} with plugin ${lixUnknownFileFallbackPlugin.key} at root commit ${args.rootCommitId} depth ${args.depth}. Cannot materialize file data.`
		);
	}

	const file = lixUnknownFileFallbackPlugin.applyChanges!({
		file: args.file,
		changes: formattedChanges,
	});

	return file.fileData;
}

function selectFileChanges(args: {
	lix: Pick<Lix, "db">;
	pluginKey: string;
	fileId: string;
	rootCommitId: string;
	depth: number;
}) {
	return args.lix.db
		.selectFrom("state_history as sh1")
		.where("sh1.plugin_key", "=", args.pluginKey)
		.where("sh1.file_id", "=", args.fileId)
		.where("sh1.root_commit_id", "=", args.rootCommitId)
		.where("sh1.depth", ">=", args.depth)
		.where("sh1.depth", "=", (eb) =>
			// This subquery finds the "leaf state" for each entity at the requested depth in history.
			//
			// What this does: "For each entity in the file, find its most recent state that existed
			// at or before the requested depth. Some entities might have changed at depth 0, others
			// might be unchanged since depth 5 - we need all of them to reconstruct the complete file."
			//
			// Example: Requesting depth=1 for a JSON file
			// - "name" entity: last changed at depth=3 (unchanged for 3 changesets)
			// - "value" entity: last changed at depth=1 (changed 1 changeset ago)
			// - "description" entity: last changed at depth=0 (just changed)
			//
			// Result: We get "name" from depth=3 and "value" from depth=1 (ignoring "description" at depth=0)
			//
			// args.depth: The depth we want to reconstruct the file at (0=current, higher=further back in history)
			// >= args.depth: Go backwards in history to find all entities that existed at or before this point
			// min(depth): For each entity, get its most recent state (leaf) at or after the requested depth
			eb
				.selectFrom("state_history as sh2")
				.select((eb) => eb.fn.min("sh2.depth").as("min_depth"))
				.whereRef("sh2.entity_id", "=", "sh1.entity_id")
				.whereRef("sh2.file_id", "=", "sh1.file_id")
				.whereRef("sh2.plugin_key", "=", "sh1.plugin_key")
				.whereRef("sh2.root_commit_id", "=", "sh1.root_commit_id")
				.where("sh2.depth", ">=", args.depth)
		)
		.select([
			"sh1.entity_id",
			"sh1.schema_key",
			"sh1.file_id",
			"sh1.plugin_key",
			"sh1.snapshot_content",
		]);
}
