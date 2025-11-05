import type { LixEngine } from "../../engine/boot.js";
import type { LixFile } from "./schema.js";
import type { LixChange } from "../../change/schema-definition.js";
import { lixUnknownFileFallbackPlugin } from "./unknown-file-fallback-plugin.js";
import { ensureCompleteDescriptor } from "./descriptor-utils.js";
import { matchesGlob } from "../util/glob.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";

export function materializeFileData(args: {
	engine: Pick<LixEngine, "getAllPluginsSync" | "executeSync">;
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

		const rows = args.engine.executeSync(
			internalQueryBuilder
				.selectFrom("state_by_version")
				.where("plugin_key", "=", plugin.key)
				.where("file_id", "=", descriptor.id)
				.where("version_id", "=", args.versionId)
				.select([
					"entity_id",
					"schema_key",
					"schema_version",
					"file_id",
					"plugin_key",
					"snapshot_content",
					"metadata",
					"created_at",
					"change_id",
				])
				.compile()
		).rows;

		const formattedChanges = mapStateRowsToLixChanges(rows);

		const file = plugin.applyChanges({
			file: descriptor,
			changes: formattedChanges,
		});

		return file.fileData;
	}

	// If no specific plugin matched, use the fallback plugin
	const fallbackRows = args.engine.executeSync(
		internalQueryBuilder
			.selectFrom("state_by_version")
			.where("plugin_key", "=", lixUnknownFileFallbackPlugin.key)
			.where("file_id", "=", descriptor.id)
			.where("version_id", "=", args.versionId)
			.select([
				"entity_id",
				"schema_key",
				"schema_version",
				"file_id",
				"plugin_key",
				"snapshot_content",
				"metadata",
				"created_at",
				"change_id",
			])
			.compile()
	).rows;

	const formattedChanges = mapStateRowsToLixChanges(fallbackRows);

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

function mapStateRowsToLixChanges(rows: any[]): LixChange[] {
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
			created_at: row.created_at as string,
			snapshot_content: snapshot as Record<string, any> | null,
		};
	});
}
