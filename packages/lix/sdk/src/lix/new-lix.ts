import {
	createInMemoryDatabase,
	contentFromDatabase,
} from "../database/sqlite/index.js";
import { initDb } from "../database/init-db.js";
import {
	LixActiveVersionSchema,
	LixVersionDescriptorSchema,
	LixVersionTipSchema,
	type LixVersionDescriptor,
	type LixVersionTip,
} from "../version/schema-definition.js";
import {
	LixChangeSetSchema,
	LixChangeSetElementSchema,
	type LixChangeSet,
	type LixChangeSetElement,
} from "../change-set/schema-definition.js";
import { LixLabelSchema, type LixLabel } from "../label/schema-definition.js";
import {
	LixKeyValueSchema,
	type LixKeyValue,
} from "../key-value/schema-definition.js";
import type { LixChange } from "../change/schema-definition.js";
import type { LixStoredSchema } from "../stored-schema/schema-definition.js";
import { createHooks } from "../hooks/create-hooks.js";
import { humanId } from "human-id";
import type { NewStateAll } from "../entity-views/types.js";
import { updateUntrackedState } from "../state/untracked/update-untracked-state.js";
import { populateStateCache } from "../state/cache/populate-state-cache.js";
import { markStateCacheAsFresh } from "../state/cache/mark-state-cache-as-stale.js";
import { v7 } from "uuid";
import { randomNanoId } from "../database/nano-id.js";
import {
	LixAccountSchema,
	LixActiveAccountSchema,
	type LixAccount,
	type LixActiveAccount,
} from "../account/schema-definition.js";
import { LixSchemaViewMap } from "../database/schema-view-map.js";
import { createExecuteSync } from "../engine/execute-sync.js";
import { setDeterministicBoot } from "../engine/deterministic-mode/bootstrap-pending.js";

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
	 * The `lixcol_version_id` defaults to the active version.
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
	// Configure persisted page size before schema creation so fresh Lix files use 8 KiB pages.
	sqlite.exec({ sql: "PRAGMA page_size = 8192;" });

	const hooks = createHooks();
	const runtimeCacheRef = {};
	const executeSync = await createExecuteSync({
		engine: {
			sqlite,
			hooks,
			runtimeCacheRef,
		},
	});

	const deterministicModeConfig = args?.keyValues?.find(
		(kv) => kv.key === "lix_deterministic_mode" && typeof kv.value === "object"
	);

	let isDeterministicBootstrap = false;
	let useRandomLixId = false;

	if (
		deterministicModeConfig?.value &&
		typeof deterministicModeConfig.value === "object"
	) {
		const config = deterministicModeConfig.value as any;
		// If deterministic mode is enabled, bootstrap is automatically deterministic
		isDeterministicBootstrap = config.enabled === true;
		// Check randomLixId flag (defaults to false)
		useRandomLixId = config.randomLixId === true;
	}

	setDeterministicBoot(isDeterministicBootstrap);

	// applying the schema etc.
	const db = initDb({ sqlite, hooks, executeSync, runtimeCacheRef });

	// Counter for deterministic IDs
	let deterministicIdCounter = 0;

	// Helper to generate IDs based on mode
	const generateUuid = () => {
		if (isDeterministicBootstrap) {
			const hex = (deterministicIdCounter++).toString(16).padStart(8, "0");
			// Use a different prefix (0192aaaa) for bootstrap changes to avoid collisions
			// from the normal deterministic uuidV7 generator
			return `0192aaaa-0000-7000-8000-0000${hex}`;
		}
		return v7();
	};

	const generateNanoid = () => {
		if (isDeterministicBootstrap) {
			// Use "boot_" prefix for bootstrap nanoids to avoid collisions
			return `boot_${(deterministicIdCounter++).toString().padStart(10, "0")}`;
		}
		return randomNanoId();
	};

	// Hardcode timestamp to epoch 0 for deterministic bootstrap
	const created_at = isDeterministicBootstrap
		? new Date(0).toISOString()
		: new Date().toISOString();

	// Create bootstrap changes for initial data
	const bootstrapChanges = createBootstrapChanges({
		providedKeyValues: args?.keyValues,
		created_at,
		generateUuid,
		generateNanoid,
		isDeterministicBootstrap,
		useRandomLixId,
	});

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
		if (change.snapshot_content) {
			sqlite.exec({
				sql: `INSERT INTO internal_snapshot (id, content) VALUES (?, jsonb(?))`,
				bind: [change.snapshot_id, JSON.stringify(change.snapshot_content)],
				returnValue: "resultRows",
			});
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
				change.snapshot_id,
				change.created_at,
			],
		});
	}

	// The initial version ID will be set by createBootstrapChanges
	const initialVersionId = bootstrapChanges.find(
		(c) =>
			c.schema_key === "lix_version_descriptor" &&
			c.snapshot_content?.name === "main"
	)?.entity_id;

	// Set active version using updateUntrackedState for proper inheritance handling
	updateUntrackedState({
		engine: { executeSync, runtimeCacheRef },
		changes: [
			{
				entity_id: "active",
				schema_key: "lix_active_version",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({ version_id: initialVersionId }),
				schema_version: "1.0",
				created_at: created_at,
				lixcol_version_id: "global",
			},
		],
	});

	// Create anonymous account as untracked for deterministic behavior
	const activeAccountId = generateNanoid();
	const humanName = isDeterministicBootstrap
		? "Deterministic"
		: humanId({ separator: "", capitalize: true });
	const anonymousAccountName = `Anonymous ${humanName}`;

	// Create the anonymous account as untracked
	updateUntrackedState({
		engine: { executeSync, runtimeCacheRef },
		changes: [
			{
				entity_id: activeAccountId,
				schema_key: LixAccountSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: activeAccountId,
					name: anonymousAccountName,
				} satisfies LixAccount),
				schema_version: LixAccountSchema["x-lix-version"],
				created_at: created_at,
				lixcol_version_id: "global",
			},
		],
	});

	// Set it as the active account
	updateUntrackedState({
		engine: { executeSync, runtimeCacheRef },
		changes: [
			{
				entity_id: `active_${activeAccountId}`,
				schema_key: LixActiveAccountSchema["x-lix-key"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					account_id: activeAccountId,
				} satisfies LixActiveAccount),
				schema_version: LixActiveAccountSchema["x-lix-version"],
				created_at: created_at,
				lixcol_version_id: "global",
			},
		],
	});

	// Handle other untracked key values
	const untrackedKeyValues = args?.keyValues?.filter(
		(kv) => kv.lixcol_untracked === true
	);
	if (untrackedKeyValues) {
		for (const kv of untrackedKeyValues) {
			const versionId = kv.lixcol_version_id ?? "global";
			updateUntrackedState({
				engine: { executeSync, runtimeCacheRef },
				changes: [
					{
						entity_id: kv.key,
						schema_key: "lix_key_value",
						file_id: "lix",
						plugin_key: "lix_own_entity",
						snapshot_content: JSON.stringify({
							key: kv.key,
							value: kv.value,
						}),
						schema_version: LixKeyValueSchema["x-lix-version"],
						created_at: created_at,
						lixcol_version_id: versionId,
					},
				],
			});
		}
	}

	// Initialize the cache stale flag so synchronous reads see a warm cache immediately.
	markStateCacheAsFresh({
		engine: { executeSync, runtimeCacheRef, hooks },
		timestamp: created_at,
	});
	populateStateCache({ engine: { sqlite, runtimeCacheRef, executeSync } });

	try {
		const blob = new Blob([
			contentFromDatabase(sqlite) as Uint8Array<ArrayBuffer>,
		]);
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
		setDeterministicBoot(false);
		await db.destroy();
	}
}

type BootstrapChange = Omit<LixChange, "snapshot_id" | "metadata"> & {
	snapshot_content: any;
	snapshot_id: string;
	metadata?: Record<string, any> | null;
};

/**
 * Creates all bootstrap changes needed for a new lix file.
 * All entities are created in a single change set to avoid dependency ordering issues.
 */
function createBootstrapChanges(args: {
	providedKeyValues?: NewStateAll<LixKeyValue>[];
	created_at: string;
	generateUuid: () => string;
	generateNanoid: () => string;
	isDeterministicBootstrap: boolean;
	useRandomLixId: boolean;
}): BootstrapChange[] {
	const changes: BootstrapChange[] = [];

	// Generate random IDs for initial entities
	const initialVersionId = args.generateNanoid();
	const initialChangeSetId = args.generateNanoid();
	const initialWorkingChangeSetId = args.generateNanoid();
	const initialGlobalVersionChangeSetId = args.generateNanoid();
	const initialGlobalVersionWorkingChangeSetId = args.generateNanoid();

	// Generate IDs for working commits
	const mainWorkingCommitId = args.generateUuid();
	const globalWorkingCommitId = args.generateUuid();

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
			id: args.generateUuid(),
			entity_id: changeSet.id,
			schema_key: "lix_change_set",
			schema_version: LixChangeSetSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_id: args.generateUuid(),
			snapshot_content: changeSet,
			created_at: args.created_at,
		});
	}

	// Create commits for the two versions
	const globalCommitId = args.generateUuid();
	const mainCommitId = args.generateUuid();

	// Create commit for global version
	const globalCommitChange = {
		id: args.generateUuid(),
		entity_id: globalCommitId,
		schema_key: "lix_commit",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: globalCommitId,
			change_set_id: initialGlobalVersionChangeSetId,
		},
		created_at: args.created_at,
	} as BootstrapChange;
	changes.push(globalCommitChange);

	// Create commit for main version
	const mainCommitChange = {
		id: args.generateUuid(),
		entity_id: mainCommitId,
		schema_key: "lix_commit",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: mainCommitId,
			change_set_id: initialChangeSetId,
		},
		created_at: args.created_at,
	} as BootstrapChange;
	changes.push(mainCommitChange);

	// Create working commits for both versions
	const globalWorkingCommitChange = {
		id: args.generateUuid(),
		entity_id: globalWorkingCommitId,
		schema_key: "lix_commit",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: globalWorkingCommitId,
			change_set_id: initialGlobalVersionWorkingChangeSetId,
		},
		created_at: args.created_at,
	} as BootstrapChange;
	changes.push(globalWorkingCommitChange);

	const mainWorkingCommitChange = {
		id: args.generateUuid(),
		entity_id: mainWorkingCommitId,
		schema_key: "lix_commit",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: mainWorkingCommitId,
			change_set_id: initialWorkingChangeSetId,
		},
		created_at: args.created_at,
	} as BootstrapChange;
	changes.push(mainWorkingCommitChange);

	// Create global version (split only: descriptor + tip)
	changes.push({
		id: args.generateUuid(),
		entity_id: "global",
		schema_key: LixVersionDescriptorSchema["x-lix-key"],
		schema_version: LixVersionDescriptorSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: "global",
			name: "global",
			inherits_from_version_id: null,
			hidden: true,
		} satisfies LixVersionDescriptor,
		created_at: args.created_at,
	});

	changes.push({
		id: args.generateUuid(),
		entity_id: "global",
		schema_key: LixVersionTipSchema["x-lix-key"],
		schema_version: LixVersionTipSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: "global",
			commit_id: globalCommitId,
			working_commit_id: globalWorkingCommitId,
		} satisfies LixVersionTip,
		created_at: args.created_at,
	});

	// Create main version (split only: descriptor + tip)
	changes.push({
		id: args.generateUuid(),
		entity_id: initialVersionId,
		schema_key: LixVersionDescriptorSchema["x-lix-key"],
		schema_version: LixVersionDescriptorSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: initialVersionId,
			name: "main",
			inherits_from_version_id: "global",
			hidden: false,
		} satisfies LixVersionDescriptor,
		created_at: args.created_at,
	});

	changes.push({
		id: args.generateUuid(),
		entity_id: initialVersionId,
		schema_key: LixVersionTipSchema["x-lix-key"],
		schema_version: LixVersionTipSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: initialVersionId,
			commit_id: mainCommitId,
			working_commit_id: mainWorkingCommitId,
		} satisfies LixVersionTip,
		created_at: args.created_at,
	});

	// Create default checkpoint label
	const checkpointLabelId = args.generateNanoid();
	changes.push({
		id: args.generateUuid(),
		entity_id: checkpointLabelId,
		schema_key: "lix_label",
		schema_version: LixLabelSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			id: checkpointLabelId,
			name: "checkpoint",
		} satisfies LixLabel,
		created_at: args.created_at,
	});

	// Create lix_id key-value pair
	const lixId = args.providedKeyValues?.find(
		(kv) => kv.key === "lix_id"
	)?.value;

	// Generate lix_id based on flags
	let generatedLixId: string;
	if (lixId) {
		generatedLixId = lixId;
	} else if (args.useRandomLixId) {
		// Use actual random nanoid when randomLixId is true
		generatedLixId = randomNanoId();
	} else if (args.isDeterministicBootstrap) {
		generatedLixId = "deterministic-lix-id";
	} else {
		// Regular mode - use the generator (which is random)
		generatedLixId = args.generateNanoid();
	}

	changes.push({
		id: args.generateUuid(),
		entity_id: "lix_id",
		schema_key: "lix_key_value",
		schema_version: LixKeyValueSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			key: "lix_id",
			value: generatedLixId,
		} satisfies LixKeyValue,
		created_at: args.created_at,
	});

	// create lix_name key-value pair
	const lixName = args.providedKeyValues?.find(
		(kv) => kv.key === "lix_name"
	)?.value;
	changes.push({
		id: args.generateUuid(),
		entity_id: "lix_name",
		schema_key: "lix_key_value",
		schema_version: LixKeyValueSchema["x-lix-version"],
		file_id: "lix",
		plugin_key: "lix_own_entity",
		snapshot_id: args.generateUuid(),
		snapshot_content: {
			key: "lix_name",
			value:
				lixName ??
				(args.isDeterministicBootstrap
					? "deterministic-lix-name"
					: humanId({ separator: "-", capitalize: false })),
		} satisfies LixKeyValue,
		created_at: args.created_at,
	});

	// Create any other provided key-values (excluding untracked ones)
	if (args.providedKeyValues) {
		for (const kv of args.providedKeyValues) {
			if (
				kv.key === "lix_id" ||
				kv.key === "lix_name" ||
				!kv.key ||
				kv.value === undefined ||
				kv.value === null
			)
				continue;

			// Skip untracked keys - they're handled separately
			if (kv.lixcol_untracked === true) continue;

			changes.push({
				id: args.generateUuid(),
				entity_id: kv.key,
				schema_key: "lix_key_value",
				schema_version: LixKeyValueSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_id: args.generateUuid(),
				snapshot_content: {
					key: kv.key,
					value: kv.value,
				} satisfies LixKeyValue,
				created_at: args.created_at,
			});
		}
	}

	// Create all schema definitions
	for (const schema of Object.values(LixSchemaViewMap)) {
		changes.push({
			id: args.generateUuid(),
			entity_id: schema["x-lix-key"],
			schema_key: "lix_stored_schema",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_id: args.generateUuid(),
			snapshot_content: {
				key: schema["x-lix-key"],
				version: schema["x-lix-version"],
				value: JSON.stringify(schema),
			} satisfies LixStoredSchema,
			created_at: args.created_at,
		});
	}

	// Also store version schemas (descriptor, tip, active_version) for validation
	for (const schema of [
		LixVersionDescriptorSchema,
		LixVersionTipSchema,
		LixActiveVersionSchema,
	]) {
		changes.push({
			id: args.generateUuid(),
			entity_id: schema["x-lix-key"],
			schema_key: "lix_stored_schema",
			schema_version: "1.0",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_id: args.generateUuid(),
			snapshot_content: {
				key: schema["x-lix-key"],
				version: schema["x-lix-version"],
				value: JSON.stringify(schema),
			} satisfies LixStoredSchema,
			created_at: args.created_at,
		});
	}

	// Anonymous account is now created during bootstrap for deterministic behavior

	// Create change set elements linking all changes to the global change set
	const originalChanges = [...changes]; // snapshot of original changes
	const changeSetElementChanges: BootstrapChange[] = [];

	// First, create change set elements for all original changes
	for (const change of originalChanges) {
		// Determine which change set this change should belong to
		let targetChangeSetId = initialGlobalVersionChangeSetId;

		// Check if this is a key-value change from provided key values
		if (change.schema_key === "lix_key_value" && args.providedKeyValues) {
			const providedKv = args.providedKeyValues.find(
				(kv) => kv.key === change.snapshot_content?.key
			);
			if (providedKv && !providedKv.lixcol_version_id) {
				// If no version specified, use main version's change set
				targetChangeSetId = initialChangeSetId;
			}
		}

		const changeSetElementChange = {
			id: args.generateUuid(),
			entity_id: `${targetChangeSetId}~${change.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_id: args.generateUuid(),
			snapshot_content: {
				change_set_id: targetChangeSetId,
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			} satisfies LixChangeSetElement,
			created_at: args.created_at,
		};
		changes.push(changeSetElementChange);
		changeSetElementChanges.push(changeSetElementChange);
	}

	// Map change_set_id -> list of change_ids so commits reference their members
	const changeIdsByChangeSet = new Map<string, string[]>();
	for (const cse of changeSetElementChanges) {
		const snap = cse.snapshot_content as any;
		const cs = snap.change_set_id as string;
		const cid = snap.change_id as string;
		if (!cs || !cid) continue;
		const list = changeIdsByChangeSet.get(cs) ?? [];
		list.push(cid);
		changeIdsByChangeSet.set(cs, list);
	}

	// Assign change_ids (and empty parent_commit_ids) to initial commits
	const setCommitMembers = (commitChange: BootstrapChange) => {
		const csId = (commitChange.snapshot_content as any).change_set_id as string;
		const ids = changeIdsByChangeSet.get(csId) ?? [];
		(commitChange.snapshot_content as any).change_ids = ids;
		(commitChange.snapshot_content as any).parent_commit_ids = [];
	};

	setCommitMembers(globalCommitChange);
	setCommitMembers(mainCommitChange);
	setCommitMembers(globalWorkingCommitChange);
	setCommitMembers(mainWorkingCommitChange);

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
			id: args.generateUuid(),
			entity_id: `${initialGlobalVersionChangeSetId}~${changeSetElementChange.id}`,
			schema_key: "lix_change_set_element",
			schema_version: LixChangeSetElementSchema["x-lix-version"],
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_id: args.generateUuid(),
			snapshot_content: {
				change_set_id: initialGlobalVersionChangeSetId,
				change_id: changeSetElementChange.id,
				entity_id: changeSetElementChange.entity_id,
				schema_key: changeSetElementChange.schema_key,
				file_id: changeSetElementChange.file_id,
			} satisfies LixChangeSetElement,
			created_at: args.created_at,
		});
	}

	return changes;
}
