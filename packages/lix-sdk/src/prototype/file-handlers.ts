import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { mockJsonPluginV2 } from "./json-plugin.js";
import type { LixFile } from "./file-schema.js";
import type { InternalDatabaseSchema, NewChange } from "./database-schema.js";
import type { Kysely } from "kysely";
import { executeSync } from "../database/execute-sync.js";

export function materializeFileData(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<InternalDatabaseSchema>;
	file: {
		id: string;
		path: string;
		version_id: string;
	};
}): Uint8Array {
	let changes = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.selectFrom("change")
			.where("plugin_key", "=", mockJsonPluginV2.key)
			.where("file_id", "=", args.file.id)
			.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
			.selectAll("change")
			.select("snapshot.content as snapshot"),
	});

	changes = changes.map((change) => ({
		...change,
		snapshot: JSON.parse(change.snapshot),
	}));

	const file = mockJsonPluginV2.applyChanges({
		file: args.file,
		changes,
	});

	return file.fileData;
}

export function handleFileInsert(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<InternalDatabaseSchema>;
	file: LixFile;
}): 0 | 1 {
	const detectedChanges = mockJsonPluginV2.detectChanges({
		after: { data: args.file.data },
	});

	// file change itself
	createChange({
		sqlite: args.sqlite,
		db: args.db,
		change: {
			entity_id: args.file.id,
			file_id: "lix_own_change_control",
			plugin_key: "lix_own_change_control",
			schema_key: "lix_file_table",
			snapshot: {
				id: args.file.id,
				path: args.file.path,
				version_id: args.file.version_id,
			},
		},
	});

	// plugin detected changes
	for (const change of detectedChanges) {
		createChange({
			sqlite: args.sqlite,
			db: args.db,
			change: {
				entity_id: change.entity_id,
				file_id: args.file.id,
				plugin_key: mockJsonPluginV2.key,
				schema_key: change.schema.key,
				snapshot: change.snapshot,
			},
		});
	}

	return 0;
}

export function handleFileUpdate(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<InternalDatabaseSchema>;
	file: LixFile;
}): 0 | 1 {
	const updatedFile = args.file;
	const [currentFile] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.selectFrom("file")
			.where("id", "=", args.file.id)
			.selectAll(),
	}) as [LixFile];

	const detectedChanges = mockJsonPluginV2.detectChanges({
		before: { data: currentFile.data },
		after: { data: updatedFile.data },
	});

	if (
		currentFile.path !== updatedFile.path ||
		currentFile.version_id !== updatedFile.version_id
	) {
		createChange({
			sqlite: args.sqlite,
			db: args.db,
			change: {
				entity_id: args.file.id,
				file_id: "lix_own_change_control",
				plugin_key: "lix_own_change_control",
				schema_key: "lix_file_table",
				snapshot: {
					id: args.file.id,
					path: args.file.path,
					version_id: args.file.version_id,
				},
			},
		});
	}

	for (const change of detectedChanges) {
		createChange({
			sqlite: args.sqlite,
			db: args.db,
			change: {
				entity_id: change.entity_id,
				file_id: args.file.id,
				plugin_key: mockJsonPluginV2.key,
				schema_key: change.schema.key,
				snapshot: change.snapshot,
			},
		});
	}

	return 0;
}

function createChange(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<InternalDatabaseSchema>;
	change: Omit<NewChange, "snapshot_id"> & { snapshot: Record<string, any> };
}) {
	const [snapshot] = executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db
			.insertInto("snapshot")
			.values({
				id: Math.random().toString(36),
				content: JSON.stringify(args.change.snapshot) as any,
			})
			.returning("id"),
	});

	// file change itself
	executeSync({
		lix: { sqlite: args.sqlite },
		query: args.db.insertInto("change").values({
			entity_id: args.change.entity_id,
			file_id: args.change.file_id,
			plugin_key: args.change.plugin_key,
			schema_key: args.change.schema_key,
			snapshot_id: snapshot.id,
		}),
	});
}