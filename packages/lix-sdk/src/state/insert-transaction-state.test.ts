import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { commit } from "./commit.js";
import { insertTransactionState } from "./insert-transaction-state.js";

test("insertPendingState creates tracked entity with pending change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Use insertPendingState function
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db: lixInternalDb },
		data: {
			entity_id: "test-insert",
			schema_key: "lix_key_value",
			file_id: "mock",
			plugin_key: "mock",
			snapshot_content: JSON.stringify({ value: "inserted-value" }),
			schema_version: "1.0",
			version_id: activeVersion.version_id,
			untracked: false, // tracked entity
		},
	});

	const results = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(results).toHaveLength(1);
	expect(results[0]?.snapshot_content).toEqual({ value: "inserted-value" });

	// Check that the cache has been updated with a change_id
	const cacheBeforeCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(cacheBeforeCommit).toBeDefined();
	expect(cacheBeforeCommit.snapshot_content).toEqual({
		value: "inserted-value",
	});
	// Change ID should exist and match what's in the view
	expect(cacheBeforeCommit.change_id).toBeTruthy();
	expect(cacheBeforeCommit.change_id).toBe(results[0]?.change_id);

	// Check that the change is in the transaction table before commit
	const changeInTransaction = await lixInternalDb
		.selectFrom("internal_change_in_transaction")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changeInTransaction).toBeDefined();
	expect(changeInTransaction.id).toBe(cacheBeforeCommit.change_id);

	// Trigger a commit
	commit({ lix });

	// After commit, check that the change is in the internal_change table
	const changeAfterCommit = await lixInternalDb
		.selectFrom("change")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changeAfterCommit).toBeDefined();
	expect(changeAfterCommit.id).toBe(cacheBeforeCommit.change_id);

	// Verify the transaction table is cleared
	const transactionAfterCommit = await lixInternalDb
		.selectFrom("internal_change_in_transaction")
		.selectAll()
		.execute();

	expect(transactionAfterCommit).toHaveLength(0);

	// Verify state_all and underlying state are consistent
	const resultingState = await lix.db
		.selectFrom("state_all")
		.selectAll()
		// @ts-expect-error - internal state_all has a hidden _pk column
		.select("_pk")
		.execute();

	const resultingUnderlyingState = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.selectAll()
		.execute();

	expect(resultingState).toEqual(resultingUnderlyingState);
});

test("insertTransactionState creates tombstone for inherited entity deletion", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Insert a key_value in global version (parent)
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-key",
			value: "parent-value",
			lixcol_version_id: "global",
		})
		.execute();

	// Verify the entity is inherited in active version
	const beforeDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-key")
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(1);
	expect(beforeDelete[0]?.value).toBe("parent-value");

	// Use insertTransactionState directly for deletion (tracked)
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db: lixInternalDb },
		data: {
			entity_id: "inherited-key",
			schema_key: "lix_key_value",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: null, // Deletion
			schema_version: "1.0",
			version_id: activeVersion.version_id,
			untracked: false,
		},
	});

	// Verify tombstone exists in cache before commit
	const tombstoneBeforeCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "inherited-key")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(tombstoneBeforeCommit).toHaveLength(1);
	expect(tombstoneBeforeCommit[0]?.inheritance_delete_marker).toBe(1);
	expect(tombstoneBeforeCommit[0]?.snapshot_content).toBe(null);

	// Verify entity no longer appears in active version
	const afterDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-key")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);

	// Trigger a commit
	commit({ lix });

	// After commit, verify tombstone still exists
	const tombstoneAfterCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "inherited-key")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(tombstoneAfterCommit).toHaveLength(1);
	expect(tombstoneAfterCommit[0]?.inheritance_delete_marker).toBe(1);
	expect(tombstoneAfterCommit[0]?.snapshot_content).toBe(null);
});

test("insertTransactionState creates tombstone for inherited untracked entity deletion", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Insert an untracked key_value in global version (parent)
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "inherited-untracked-key",
			value: "parent-untracked-value",
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Verify the untracked entity is inherited in active version
	const beforeDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-untracked-key")
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(1);
	expect(beforeDelete[0]?.value).toBe("parent-untracked-value");

	// Use insertTransactionState directly for deletion (untracked)
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db: lixInternalDb },
		data: {
			entity_id: "inherited-untracked-key",
			schema_key: "lix_key_value",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: null, // Deletion
			schema_version: "1.0",
			version_id: activeVersion.version_id,
			untracked: true,
		},
	});

	// Verify tombstone exists in cache
	const tombstone = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.execute();

	expect(tombstone).toHaveLength(1);
	expect(tombstone[0]?.inheritance_delete_marker).toBe(1);
	expect(tombstone[0]?.snapshot_content).toBe(null);
	expect(tombstone[0]?.change_id).toBe("untracked-delete");

	// Verify entity no longer appears in active version
	const afterDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-untracked-key")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);

	// No commit needed for untracked entities - they don't participate in change control
});

test("untracked entities use same timestamp for created_at and updated_at", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Use insertTransactionState for untracked entity
	const result = insertTransactionState({
		lix: { sqlite: lix.sqlite, db: lixInternalDb },
		data: {
			entity_id: "test-untracked-timestamp",
			schema_key: "lix_key_value",
			file_id: "mock",
			plugin_key: "mock",
			snapshot_content: JSON.stringify({
				key: "test-key",
				value: "test-value",
			}),
			schema_version: "1.0",
			version_id: activeVersion.version_id,
			untracked: true,
		},
	});

	// Check returned data has same timestamps
	expect(result.data.created_at).toBe(result.data.updated_at);

	// Verify in the actual table
	const untrackedEntity = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "test-untracked-timestamp")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(untrackedEntity.created_at).toBe(untrackedEntity.updated_at);

	// Also verify through the state view
	const stateView = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "test-untracked-timestamp")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(stateView.created_at).toBe(stateView.updated_at);
});
