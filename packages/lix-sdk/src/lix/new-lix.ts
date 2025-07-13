import {
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";
import { v7 as uuid_v7 } from "uuid";
import { nanoid } from "../database/nano-id.js";
import { LixVersionSchema, type LixVersion } from "../version/schema.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	type LixChangeSet,
	type LixChangeSetElement,
} from "../change-set/schema.js";
import { LixLabelSchema, type LixLabel } from "../label/schema.js";
import { LixKeyValueSchema, type LixKeyValue } from "../key-value/schema.js";
import { LixSchemaViewMap } from "../database/schema.js";
import type { LixChange } from "../change/schema.js";
import type { LixStoredSchema } from "../stored-schema/schema.js";
import { createHooks } from "../hooks/create-hooks.js";
import { humanId } from "human-id";
import type { NewStateAll } from "../entity-views/types.js";

/**
 * A Blob with an attached `._lix` property for easy access to some lix properties.
 *
 * For example, the `._lix` property provides immediate access to essential metadata
 * like `id` and `name` without needing to parse the file. This is particularly useful
 * for scenarios where you need to identify a Lix file before fully opening it.
 *
 * @example
 * // With `._lix`, the ID is instantly available:
 * const blob = await newLixFile();
 * console.log(blob._lix.id); // e.g., "z2k9j6d"
 *
 * @example
 * // Without `._lix`, you would need to open the lix to get its ID:
 * const blob = await newLixFile();
 * // Open the lix to access its metadata
 * const lix = await openLix({ blob });
 * const id = await lix.db.selectFrom("key_value")
 *   .where("key", "=", "lix_id")
 *   .select("value")
 *   .executeTakeFirst();
 * await lix.close();
 *
 */
export interface NewLixBlob extends Blob {
	_lix: {
		id: string;
		name: string;
	};
}

/**
 * Creates a new Lix file as a {@link NewLixBlob}.
 *
 * This function bootstraps an in-memory SQLite database with the necessary
 * schema and metadata to represent a valid Lix project. The resulting
 * blob is ready to be persisted to disk, IndexedDB, or other storage.
 *
 * The returned blob has a `._lix` property for immediate access to the
 * lix identifier and name without needing to open the file.
 *
 * @example
 * ```ts
 * // Create a new lix file with default values
 * const blob = await newLixFile();
 * console.log(blob._lix.id); // e.g. "z2k9j6d"
 * console.log(blob._lix.name); // e.g. "blue-gorilla"
 * ```
 *
 * @example
 * ```ts
 * // Create a new lix file with specific key-values
 * const blob = await newLixFile({
 *   keyValues: [
 *     { key: "lix_name", value: "my-project", lixcol_version_id: "global" },
 *     { key: "lix_id", value: "custom-id", lixcol_version_id: "global" },
 *     { key: "my_custom_key", value: "my_custom_value", lixcol_version_id: "global" }
 *   ],
 * });
 * console.log(blob._lix.id); // "custom-id"
 * console.log(blob._lix.name); // "my-project"
 * ```
 */
export async function newLixFile(args?: {
	/**
	 * Pre-populates the key-value store of the new lix file.
	 *
	 * Use this to set initial values for `lix_id`, `lix_name`, or other custom keys.
	 * If `lix_id` or `lix_name` are not provided, they will be generated automatically.
	 *
	 * @example
	 *  keyValues: [
	 *    { key: "lix_name", value: "my-project", lixcol_version_id: "global" },
	 *    { key: "lix_id", value: "custom-id", lixcol_version_id: "global" },
	 *    { key: "my_custom_key", value: "my_custom_value", lixcol_version_id: "global" },
	 *  ]
	 */
	keyValues?: NewStateAll<LixKeyValue>[];
}): Promise<NewLixBlob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	const hooks = createHooks();

	// applying the schema etc.
	const db = initDb({ sqlite, hooks });

	// Create bootstrap changes for initial data
	const bootstrapChanges = createBootstrapChanges(args?.keyValues);

	// Extract the lix_id from bootstrap changes
	const lixId = bootstrapChanges.find(
		(c) =>
			c.schema_key === "lix_key_value" && c.snapshot_content?.key === "lix_id"
	)?.snapshot_content.value;

	const lixName = bootstrapChanges.find(
		(c) =>
			c.schema_key === "lix_key_value" && c.snapshot_content?.key === "lix_name"
	)?.snapshot_content.value;

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
		const blob = new Blob([contentFromDatabase(sqlite)]);
		// Create a LixBlob by extending the blob with the lix property
		const lixBlob = Object.assign(blob, {
			_lix: {
				id: lixId,
				name: lixName,
			},
		}) as NewLixBlob;
		return lixBlob;
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		await db.destroy();
	}
}

type BootstrapChange = Omit<LixChange, "snapshot_id"> & {
	snapshot_content: any;
};

/**
 * Creates all bootstrap changes needed for a new lix file.
 * All entities are created in a single change set to avoid dependency ordering issues.
 */
function createBootstrapChanges(
	providedKeyValues?: NewStateAll<LixKeyValue>[]
): BootstrapChange[] {
	const changes: BootstrapChange[] = [];
	const created_at = new Date().toISOString();

	// Generate random IDs for initial entities
	const initialVersionId = nanoid();
	const initialChangeSetId = nanoid();
	const initialWorkingChangeSetId = nanoid();
	const initialGlobalVersionChangeSetId = nanoid();
	const initialGlobalVersionWorkingChangeSetId = nanoid();

	// Create all required change sets
	const changeSets: LixChangeSet[] = [
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
		} satisfies LixVersion,
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
		} satisfies LixVersion,
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
		} satisfies LixLabel,
		created_at,
	});

	// Create lix_id key-value pair
	const lixId = providedKeyValues?.find((kv) => kv.key === "lix_id")?.value;
	changes.push({
		id: uuid_v7(),
		entity_id: "lix_id",
		schema_key: "lix_key_value",
		schema_version: LixKeyValueSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			key: "lix_id",
			value: lixId ?? nanoid(10),
		} satisfies LixKeyValue,
		created_at,
	});

	// create lix_name key-value pair
	const lixName = providedKeyValues?.find((kv) => kv.key === "lix_name")?.value;
	changes.push({
		id: uuid_v7(),
		entity_id: "lix_name",
		schema_key: "lix_key_value",
		schema_version: LixKeyValueSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			key: "lix_name",
			value: lixName ?? humanId({ separator: "-", capitalize: false }),
		} satisfies LixKeyValue,
		created_at,
	});

	// Create any other provided key-values
	if (providedKeyValues) {
		for (const kv of providedKeyValues) {
			if (kv.key === "lix_id" || kv.key === "lix_name" || !kv.key || !kv.value)
				continue;

			changes.push({
				id: uuid_v7(),
				entity_id: kv.key,
				schema_key: "lix_key_value",
				schema_version: LixKeyValueSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: {
					key: kv.key,
					value: kv.value,
				} satisfies LixKeyValue,
				created_at,
			});
		}
	}

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
			} satisfies LixStoredSchema,
			created_at,
		});
	}

	// Create default active account
	const activeAccountId = nanoid();
	const anonymousAccountName = `Anonymous ${humanId({
		capitalize: true,
		adjectiveCount: 0,
		separator: "_",
	})
		// Human ID has two words, remove the last one
		.split("_")[0]!
		// Human ID uses plural, remove the last character to make it singular
		.slice(0, -1)}`;

	// Create the active account entry (the account entity will be created on first change)
	changes.push({
		id: uuid_v7(),
		entity_id: activeAccountId,
		schema_key: "lix_active_account",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_content: {
			name: anonymousAccountName,
		},
		created_at,
	});

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
			} satisfies LixChangeSetElement,
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
			} satisfies LixChangeSetElement,
			created_at,
		});
	}

	return changes;
}
