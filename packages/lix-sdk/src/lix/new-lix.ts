import {
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { v7 as uuid_v7 } from "uuid";
import { nanoid } from "../database/nano-id.js";
import { LixVersionSchema, type Version } from "../version/schema.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	type ChangeSet,
	type ChangeSetElement,
} from "../change-set/schema.js";
import { LixLabelSchema, type Label } from "../label/schema.js";
import { LixKeyValueSchema, type KeyValue } from "../key-value/schema.js";
import { LixSchemaViewMap } from "../database/schema.js";
import type { Change } from "../change/schema.js";
import type { StoredSchema } from "../stored-schema/schema.js";
import { createHooks } from "../hooks/create-hooks.js";

/**
 * Returns a new empty Lix file as a {@link Blob}.
 *
 * The function bootstraps an in‑memory SQLite database with all
 * required tables, change sets and metadata so that it represents
 * a valid Lix project. The caller is responsible for persisting the
 * resulting blob to disk, IndexedDB or any other storage location.
 *
 * @example
 * ```ts
 * const blob = await newLixFile()
 * await saveToDisk(blob)
 * ```
 */
export async function newLixFile(): Promise<Blob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	const hooks = createHooks();

	// applying the schema etc.
	const db = initDb({ sqlite, hooks });

	// Create bootstrap changes for initial data
	const bootstrapChanges = createBootstrapChanges();

	// Insert all bootstrap changes directly into the change tables
	for (const change of bootstrapChanges) {
		// Insert snapshot content if it exists
		let snapshotId = "no-content";
		if (change.snapshot_content) {
			const result = sqlite.exec({
				sql: `INSERT INTO internal_snapshot (content) VALUES (jsonb(?)) RETURNING id`,
				bind: [JSON.stringify(change.snapshot_content)],
				returnValue: "resultRows",
			});
			if (result && result.length > 0) {
				snapshotId = result[0]![0] as string;
			}
		}

		// Insert the change record
		sqlite.exec({
			sql: `INSERT INTO internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
				   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			bind: [
				change.id,
				change.entity_id,
				change.schema_key,
				change.schema_version,
				change.file_id,
				change.plugin_key,
				snapshotId,
				change.created_at,
			],
		});
	}

	// The initial version ID will be set by createBootstrapChanges
	const initialVersionId = bootstrapChanges.find(
		(c) => c.schema_key === "lix_version" && c.snapshot_content?.name === "main"
	)?.entity_id;

	sqlite.exec(`
		INSERT INTO active_version (version_id)
		SELECT '${initialVersionId}'
		WHERE NOT EXISTS (SELECT 1 FROM active_version);
`);

	try {
		return new Blob([contentFromDatabase(sqlite)]);
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		await db.destroy();
	}
}

type BootstrapChange = Omit<Change, "snapshot_id"> & {
	snapshot_content: any;
};

/**
 * Creates all bootstrap changes needed for a new lix file.
 * All entities are created in a single change set to avoid dependency ordering issues.
 */
function createBootstrapChanges(): BootstrapChange[] {
	const changes: BootstrapChange[] = [];
	const created_at = new Date().toISOString();

	// Generate random IDs for initial entities
	const initialVersionId = nanoid();
	const initialChangeSetId = nanoid();
	const initialWorkingChangeSetId = nanoid();
	const initialGlobalVersionChangeSetId = nanoid();
	const initialGlobalVersionWorkingChangeSetId = nanoid();

	// Create all required change sets
	const changeSets: ChangeSet[] = [
		{
			id: initialGlobalVersionChangeSetId,
		},
		{
			id: initialGlobalVersionWorkingChangeSetId,
		},
		{
			id: initialChangeSetId,
		},
		{
			id: initialWorkingChangeSetId,
		},
	];

	for (const changeSet of changeSets) {
		changes.push({
			id: uuid_v7(),
			entity_id: changeSet.id,
			schema_key: "lix_change_set",
			schema_version: LixChangeSetSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: changeSet,
			created_at,
		});
	}

	// Create global version
	changes.push({
		id: uuid_v7(),
		entity_id: "global",
		schema_key: "lix_version",
		schema_version: LixVersionSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: "global",
			name: "global",
			change_set_id: initialGlobalVersionChangeSetId,
			working_change_set_id: initialGlobalVersionWorkingChangeSetId,
			hidden: true,
		} satisfies Version,
		created_at,
	});

	// Create main version
	changes.push({
		id: uuid_v7(),
		entity_id: initialVersionId,
		schema_key: "lix_version",
		schema_version: LixVersionSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: initialVersionId,
			name: "main",
			change_set_id: initialChangeSetId,
			working_change_set_id: initialWorkingChangeSetId,
			inherits_from_version_id: "global",
			hidden: false,
		} satisfies Version,
		created_at,
	});

	// Create default checkpoint label
	const checkpointLabelId = nanoid();
	changes.push({
		id: uuid_v7(),
		entity_id: checkpointLabelId,
		schema_key: "lix_label",
		schema_version: LixLabelSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			id: checkpointLabelId,
			name: "checkpoint",
		} satisfies Label,
		created_at,
	});

	// Create lix_id key-value pair
	changes.push({
		id: uuid_v7(),
		entity_id: "lix_id",
		schema_key: "lix_key_value",
		schema_version: LixKeyValueSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			key: "lix_id",
			value: nanoid(10),
		} satisfies KeyValue,
		created_at,
	});

	// Create all schema definitions
	for (const schema of Object.values(LixSchemaViewMap)) {
		changes.push({
			id: uuid_v7(),
			entity_id: schema["x-lix-key"],
			schema_key: "lix_stored_schema",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				key: schema["x-lix-key"],
				version: schema["x-lix-version"],
				value: JSON.stringify(schema),
			} satisfies StoredSchema,
			created_at,
		});
	}

	// Create change set elements linking all changes to the global change set
	const originalChanges = [...changes]; // snapshot of original changes
	const changeSetElementChanges: BootstrapChange[] = [];

	// First, create change set elements for all original changes
	for (const change of originalChanges) {
		const changeSetElementChange = {
			id: uuid_v7(),
			entity_id: `${initialGlobalVersionChangeSetId}::${change.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				change_set_id: initialGlobalVersionChangeSetId,
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			} satisfies ChangeSetElement,
			created_at,
		};
		changes.push(changeSetElementChange);
		changeSetElementChanges.push(changeSetElementChange);
	}

	// TODO evaluate if we can come up with a better concept to avoid meta changes (if even desired)
	//
	// this is the cost of change set (elements). we need to track what's in a
	// change set itself. The struggle is that working change set is by definition
	// mutable, and probably other user interactions for a change set too.
	//
	//
	// Create change set elements for the change set element changes themselves
	// (one level of self-reference, then stop to avoid infinite recursion)
	for (const changeSetElementChange of changeSetElementChanges) {
		changes.push({
			id: uuid_v7(),
			entity_id: `${initialGlobalVersionChangeSetId}::${changeSetElementChange.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				change_set_id: initialGlobalVersionChangeSetId,
				change_id: changeSetElementChange.id,
				entity_id: changeSetElementChange.entity_id,
				schema_key: changeSetElementChange.schema_key,
				file_id: changeSetElementChange.file_id,
			} satisfies ChangeSetElement,
			created_at,
		});
	}

	return changes;
}
