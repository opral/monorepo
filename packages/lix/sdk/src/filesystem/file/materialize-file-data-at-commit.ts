import type { LixEngine } from "../../engine/boot.js";
import type { LixFile } from "./schema.js";
import type { LixChange } from "../../change/schema-definition.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import {
	readFileDescriptorAtCommit,
	composeFilePathAtCommit,
} from "./descriptor-utils.js";
import { matchesGlob } from "../util/glob.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

export function materializeFileDataAtCommit(args: {
	engine: Pick<LixEngine, "getAllPluginsSync" | "executeSync">;
	file: Pick<LixFile, "id" | "path"> &
		Partial<Omit<LixFile, "id" | "path" | "data">>;
	rootCommitId: string;
	depth: number;
}): Uint8Array {
	const plugins = args.engine.getAllPluginsSync();
	const historicalSnapshot = readFileDescriptorAtCommit({
		engine: args.engine,
		fileId: args.file.id,
		rootCommitId: args.rootCommitId,
		depth: args.depth,
	});
	if (!historicalSnapshot) {
		throw new Error(
			`[materializeFileDataAtCommit] Missing descriptor snapshot for file ${args.file.id} at commit ${args.rootCommitId}`
		);
	}

	const historicalPath =
		composeFilePathAtCommit({
			engine: args.engine,
			directoryId: historicalSnapshot.directory_id,
			name: historicalSnapshot.name,
			extension: historicalSnapshot.extension ?? null,
			rootCommitId: args.rootCommitId,
			depth: args.depth,
		}) ?? args.file.path;

	const initialData = (args.file as Partial<LixFile>).data ?? new Uint8Array();

	const descriptor: LixFile = {
		id: args.file.id,
		path: historicalPath,
		directory_id: historicalSnapshot.directory_id,
		name: historicalSnapshot.name,
		extension: historicalSnapshot.extension ?? null,
		metadata: args.file.metadata ?? historicalSnapshot.metadata ?? null,
		hidden: historicalSnapshot.hidden,
		data: initialData,
	};

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

		// Get plugin changes from state_history table
		const rows = args.engine.executeSync(
			selectFileChanges({
				pluginKey: plugin.key,
				fileId: descriptor.id,
				rootCommitId: args.rootCommitId,
				depth: args.depth,
			}).compile()
		).rows;

		const formattedChanges = mapHistoryRowsToLixChanges(rows);

		const file = plugin.applyChanges({
			file: descriptor,
			changes: formattedChanges,
		});

		return file.fileData;
	}

	// If no specific plugin matched, use the fallback plugin
	const fallbackRows = args.engine.executeSync(
		selectFileChanges({
			pluginKey: lixUnknownFileFallbackPlugin.key,
			fileId: descriptor.id,
			rootCommitId: args.rootCommitId,
			depth: args.depth,
		}).compile()
	).rows;

	const formattedChanges = mapHistoryRowsToLixChanges(fallbackRows);

	if (formattedChanges.length === 0) {
		throw new Error(
			`[materializeFileDataAtCommit] No changes found for file ${args.file.id} with plugin ${lixUnknownFileFallbackPlugin.key} at root commit ${args.rootCommitId} depth ${args.depth}. Cannot materialize file data.`
		);
	}

	const file = lixUnknownFileFallbackPlugin.applyChanges!({
		file: descriptor,
		changes: formattedChanges,
	});

	return file.fileData;
}

function selectFileChanges(args: {
	pluginKey: string;
	fileId: string;
	rootCommitId: string;
	depth: number;
}) {
	return internalQueryBuilder
		.selectFrom("state_history as sh1")
		.where("sh1.plugin_key", "=", args.pluginKey)
		.where("sh1.file_id", "=", args.fileId)
		.where("sh1.root_commit_id", "=", args.rootCommitId)
		.where("sh1.depth", ">=", args.depth)
		.where("sh1.depth", "=", (eb: any) =>
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
				.select((eb: any) => eb.fn.min("sh2.depth").as("min_depth"))
				.whereRef("sh2.entity_id", "=", "sh1.entity_id")
				.whereRef("sh2.file_id", "=", "sh1.file_id")
				.whereRef("sh2.plugin_key", "=", "sh1.plugin_key")
				.whereRef("sh2.root_commit_id", "=", "sh1.root_commit_id")
				.where("sh2.depth", ">=", args.depth)
		)
		.select([
			"sh1.entity_id",
			"sh1.schema_key",
			"sh1.schema_version",
			"sh1.file_id",
			"sh1.plugin_key",
			"sh1.snapshot_content",
			"sh1.metadata",
			"sh1.change_id",
		]);
}

function mapHistoryRowsToLixChanges(rows: any[]): LixChange[] {
	return rows.map((row) => {
		const snapshotValue = row.snapshot_content;
		const snapshot =
			typeof snapshotValue === "string"
				? JSON.parse(snapshotValue)
				: (snapshotValue ?? null);

		const metadataValue = row.metadata;
		let metadata: Record<string, any> | null = null;
		if (metadataValue != null) {
			if (typeof metadataValue === "string") {
				try {
					metadata = JSON.parse(metadataValue);
				} catch {
					metadata = null;
				}
			} else if (typeof metadataValue === "object") {
				metadata = metadataValue as Record<string, any>;
			}
		}

		return {
			id: (row.change_id as string | undefined) ?? (row.entity_id as string),
			entity_id: row.entity_id as string,
			schema_key: row.schema_key as string,
			schema_version: row.schema_version as string,
			file_id: row.file_id as string,
			plugin_key: row.plugin_key as string,
			metadata,
			created_at:
				(row.created_at as string | undefined) ?? new Date(0).toISOString(),
			snapshot_content: snapshot as Record<string, any> | null,
		};
	});
}
