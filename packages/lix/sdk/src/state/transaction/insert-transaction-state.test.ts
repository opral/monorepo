import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { commit } from "../vtable/commit.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { getTimestamp } from "../../engine/deterministic/timestamp.js";

test("creates tracked entity with pending change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
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
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "test-insert",
				schema_key: "lix_key_value",
				file_id: "mock",
				plugin_key: "mock",
				snapshot_content: JSON.stringify({ value: "inserted-value" }),
				schema_version: "1.0",
				version_id: activeVersion.version_id,
				untracked: false, // tracked entity
			},
		],
	});

	const results = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(results).toHaveLength(1);
	expect(results[0]?.snapshot_content).toEqual({ value: "inserted-value" }); // Already parsed by the view
	expect(results[0]?.untracked).toBe(0); // tracked entity
	expect(results[0]?.commit_id).toBe("pending"); // should be pending before commit

	// Check that the change is in the transaction table before commit (not in cache)
	const changeInTransaction = await lixInternalDb
		.selectFrom("internal_transaction_state")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.executeTakeFirstOrThrow();

	expect(changeInTransaction).toBeDefined();
	expect(changeInTransaction.id).toBe(results[0]?.change_id);
	expect(changeInTransaction.lixcol_untracked).toBe(0); // tracked entity
	expect(changeInTransaction.snapshot_content).toEqual({
		value: "inserted-value",
	});

	// Verify cache is NOT updated before commit (new behavior)
	const cacheBeforeCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.execute();

	expect(cacheBeforeCommit).toHaveLength(0); // No cache entry before commit

	// Trigger a commit
	commit({
		engine: lix.engine!,
	});

	// After commit, check that the change is in the internal_change table
	const changeAfterCommit = await lixInternalDb
		.selectFrom("change")
		.where("entity_id", "=", "test-insert")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(changeAfterCommit).toBeDefined();
	expect(changeAfterCommit.id).toBe(changeInTransaction.id);

	// After commit, verify cache has been updated
	const cacheAfterCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "test-insert")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.executeTakeFirstOrThrow();

	expect(cacheAfterCommit).toBeDefined();
	expect(cacheAfterCommit.snapshot_content).toEqual({
		value: "inserted-value",
	});
	expect(cacheAfterCommit.change_id).toBe(changeInTransaction.id);

	// Verify the transaction table is cleared
	const transactionAfterCommit = await lixInternalDb
		.selectFrom("internal_transaction_state")
		.selectAll()
		.execute();

	expect(transactionAfterCommit).toHaveLength(0);

	// Verify state_all and underlying state are consistent
	const resultingState = await lix.db
		.selectFrom("state_all")
		.selectAll()
		.execute();

	const resultingUnderlyingStateRaw = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.selectAll()
		.execute();

	const resolvedStateWithoutPk = resultingUnderlyingStateRaw.map((r: any) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _pk, ...rest } = r || {};
		return rest;
	});

	expect(resultingState).toEqual(resolvedStateWithoutPk);
});

test("creates tombstone for inherited entity deletion", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
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
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "inherited-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Deletion
				schema_version: "1.0",
				version_id: activeVersion.version_id,
				untracked: false,
			},
		],
	});

	// Verify the deletion is in transaction table (not cache yet)
	const transactionDeletion = await lixInternalDb
		.selectFrom("internal_transaction_state")
		.where("entity_id", "=", "inherited-key")
		.where("schema_key", "=", "lix_key_value")
		.where("lixcol_version_id", "=", activeVersion.version_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(transactionDeletion.snapshot_content).toBe(null); // Deletion
	expect(transactionDeletion.lixcol_untracked).toBe(0); // tracked entity

	// Commit to create the tombstone
	commit({
		engine: lix.engine!,
	});

	// Verify tombstone exists in cache after commit
	const tombstoneAfterCommit = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "inherited-key")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.execute();

	expect(tombstoneAfterCommit).toHaveLength(1);
	expect(tombstoneAfterCommit[0]?.inheritance_delete_marker).toBe(1);
	expect(tombstoneAfterCommit[0]?.snapshot_content).toBe(null);

	// Verify entity no longer appears in active version
	const afterDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-key")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("creates tombstone for inherited untracked entity deletion", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
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
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "inherited-untracked-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Deletion
				schema_version: "1.0",
				version_id: activeVersion.version_id,
				untracked: true,
			},
		],
	});

	// Verify the deletion is in transaction table first
	const transactionDeletion = await lixInternalDb
		.selectFrom("internal_transaction_state")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("schema_key", "=", "lix_key_value")
		.where("lixcol_version_id", "=", activeVersion.version_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(transactionDeletion.snapshot_content).toBe(null); // Deletion
	expect(transactionDeletion.lixcol_untracked).toBe(1); // untracked entity

	// Commit to create the tombstone in untracked table
	commit({
		engine: lix.engine!,
	});

	// Verify tombstone exists in untracked table (not cache)
	const tombstone = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "inherited-untracked-key")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.execute();

	expect(tombstone).toHaveLength(1);
	expect(tombstone[0]?.inheritance_delete_marker).toBe(1);
	expect(tombstone[0]?.snapshot_content).toBe(null);

	// Verify entity no longer appears in active version
	const afterDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "inherited-untracked-key")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("untracked entities use same timestamp for created_at and updated_at", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
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
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
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
		],
	});

	// Check returned data has same timestamps
	expect(result[0]?.created_at).toBe(result[0]?.updated_at);

	// Verify the entity is in the transaction table (not untracked table yet)
	const transactionEntity = await lixInternalDb
		.selectFrom("internal_transaction_state")
		.where("entity_id", "=", "test-untracked-timestamp")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.executeTakeFirstOrThrow();

	expect(transactionEntity.lixcol_untracked).toBe(1); // marked as untracked
	expect(transactionEntity.snapshot_content).toEqual({
		key: "test-key",
		value: "test-value",
	});

	// Commit to move untracked entities to final state
	commit({
		engine: lix.engine!,
	});

	// After commit, verify in the untracked table
	const untrackedEntity = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "test-untracked-timestamp")
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
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

test("deletes direct untracked entity on null snapshot_content", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// First insert a direct untracked entity
	insertTransactionState({
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "direct-untracked-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "direct-untracked-key",
					value: "direct-value",
				}),
				schema_version: "1.0",
				version_id: activeVersion.version_id,
				untracked: true,
			},
		],
	});

	// Commit to move the untracked entity to its final state
	commit({
		engine: lix.engine!,
	});

	// Verify it exists in untracked table after commit
	const beforeDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "direct-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
		.select([
			"entity_id",
			"schema_key",
			"file_id",
			"version_id",
			"plugin_key",
			sql<string | null>`json(snapshot_content)`.as("snapshot_content"),
			"schema_version",
			"created_at",
			"updated_at",
			"inherited_from_version_id",
			"inheritance_delete_marker",
		])
		.execute();

	expect(beforeDelete).toHaveLength(1);
	const content = beforeDelete[0]!.snapshot_content;
	const parsedContent =
		typeof content === "string" ? JSON.parse(content) : content;
	expect(parsedContent).toEqual({
		key: "direct-untracked-key",
		value: "direct-value",
	});

	// Now delete the direct untracked entity
	insertTransactionState({
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "direct-untracked-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: null, // Deletion
				schema_version: "1.0",
				version_id: activeVersion.version_id,
				untracked: true,
			},
		],
	});

	// Commit to finalize the deletion
	commit({
		engine: lix.engine!,
	});

	// Verify it's deleted from untracked table
	const afterDelete = await lixInternalDb
		.selectFrom("internal_state_all_untracked")
		.where("entity_id", "=", "direct-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.execute();

	expect(afterDelete).toHaveLength(0);

	// Verify no tombstone was created in cache (direct untracked deletions don't need tombstones)
	const cacheEntry = await lixInternalDb
		.selectFrom("internal_state_cache")
		.where("entity_id", "=", "direct-untracked-key")
		.where("version_id", "=", activeVersion.version_id)
		.selectAll()
		.select(sql`json(snapshot_content)`.as("snapshot_content"))
		.execute();

	expect(cacheEntry).toHaveLength(0);

	// Verify entity no longer appears in state view
	const stateView = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "direct-untracked-key")
		.selectAll()
		.execute();

	expect(stateView).toHaveLength(0);
});

// Tests moved from handle-state-mutation.test.ts

test("should throw error when version_id is null", async () => {
	const lix = await openLix({});

	// Try to insert state with null version_id - should throw
	await expect(
		lix.db
			.insertInto("state_all")
			.values({
				entity_id: "test_entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: { key: "test", value: "test" },
				schema_version: "1.0",
				version_id: null as any, // Explicitly null version_id
			})
			.execute()
	).rejects.toThrow("version_id is required");
});

test("should throw error when version_id does not exist", async () => {
	const lix = await openLix({});

	const nonExistentVersionId = "non-existent-version-id";

	// Try to insert state with non-existent version_id - should throw
	await expect(
		lix.db
			.insertInto("state_all")
			.values({
				entity_id: "test_entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "test_plugin",
				snapshot_content: { key: "test", value: "test" },
				schema_version: "1.0",
				version_id: nonExistentVersionId,
			})
			.execute()
	).rejects.toThrow(`Version with id '${nonExistentVersionId}' does not exist`);
});

test("inserts working change set elements", async () => {
	const lix = await openLix({});

	// Get initial version and working change set
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make a mutation
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Get the working commit to find its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that working change set element was created by mutation handler
	const workingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElements).toHaveLength(1);
	expect(workingElements[0]).toMatchObject({
		change_set_id: workingCommit.change_set_id,
		entity_id: "test_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// Verify the change_id points to a real change
	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", workingElements[0]!.change_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.entity_id).toBe("test_key");
	expect(change.schema_key).toBe("lix_key_value");
});

test("updates working change set elements on entity updates (latest change wins)", async () => {
	const lix = await openLix({});

	// Get initial version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Commit to create working changeset element for the insert
	commit({
		engine: lix.engine!,
	});

	// Get the working commit to find its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Get initial working element
	const initialWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(initialWorkingElements).toHaveLength(1);
	const initialChangeId = initialWorkingElements[0]!.change_id;

	// Update the same entity
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "test_key")
		.set({ value: "updated_value" })
		.execute();

	// Commit the transaction to process working changeset logic
	commit({
		engine: lix.engine!,
	});

	// Check that working change set still has only one element for this entity (latest change)
	const workingElementsAfterUpdate = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	// DEBUG: Get all changes to see what changes exist
	const allChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "desc")
		.selectAll()
		.execute();

	// DEBUG: Throw error with detailed info if we have the wrong count
	if (workingElementsAfterUpdate.length !== 1) {
		const debugInfo = {
			workingElementsCount: workingElementsAfterUpdate.length,
			workingElements: workingElementsAfterUpdate.map((element, i) => ({
				index: i,
				entity_id: element.entity_id,
				change_id: element.change_id,
				change_set_id: element.change_set_id,
				schema_key: element.schema_key,
				file_id: element.file_id,
			})),
			allChangesCount: allChanges.length,
			allChanges: allChanges.map((change, i) => ({
				index: i,
				id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
				created_at: change.created_at,
				snapshot_content: change.snapshot_content,
			})),
		};
		throw new Error(
			`DEBUG: Working change set elements not properly replaced. Expected 1 but got ${workingElementsAfterUpdate.length}. Details: ${JSON.stringify(debugInfo, null, 2)}`
		);
	}

	expect(workingElementsAfterUpdate).toHaveLength(1);

	// Verify the change_id was updated to latest change
	expect(workingElementsAfterUpdate[0]!.change_id).not.toBe(initialChangeId);

	expect(allChanges).toHaveLength(2); // Insert + Update
	expect(workingElementsAfterUpdate[0]!.change_id).toBe(allChanges[0]!.id); // Latest change
});

test("mutation handler removes working change set elements on entity deletion", async () => {
	const lix = await openLix({});

	// Get initial version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test_key",
			value: "test_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Commit to create working changeset element for the insert
	commit({
		engine: lix.engine!,
	});

	// Get the working commit to find its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify element exists in working change set
	const workingElementsAfterInsert = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterInsert).toHaveLength(1);

	// Delete the entity
	await lix.db.deleteFrom("key_value").where("key", "=", "test_key").execute();

	// Commit the transaction to process working changeset logic
	commit({
		engine: lix.engine!,
	});

	// Check that working change set no longer includes this entity
	const workingElementsAfterDelete = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterDelete).toHaveLength(0);

	// Verify the delete change was still recorded
	const allChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "desc")
		.selectAll()
		.execute();

	expect(allChanges).toHaveLength(2); // Insert + Delete
	expect(allChanges[0]!.snapshot_content).toBe(null); // Latest change is deletion
});

test("delete reconciliation: entities added after checkpoint then deleted are excluded from working change set", async () => {
	const lix = await openLix({});

	// Get initial version and working change set
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Create a checkpoint label to mark the current state
	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	// Get the change set from the commit to add checkpoint label
	const currentCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Add checkpoint label to the current change set (simulating a checkpoint)
	await lix.db
		.insertInto("change_set_label_all")
		.values({
			change_set_id: currentCommit.change_set_id,
			label_id: checkpointLabel.id,
			lixcol_version_id: "global",
		})
		.execute();

	// AFTER checkpoint: Insert an entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "post_checkpoint_key",
			value: "post_checkpoint_value",
			lixcol_version_id: activeVersion.id,
		})
		.execute();

	// Commit to create working changeset element for the insert
	commit({
		engine: lix.engine!,
	});

	// Get the working commit to find its change set
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", activeVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify entity appears in working change set after insert
	const workingElementsAfterInsert = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "post_checkpoint_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterInsert).toHaveLength(1);

	// AFTER checkpoint: Delete the same entity
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "post_checkpoint_key")
		.execute();

	// Commit the transaction to process working changeset logic
	commit({
		engine: lix.engine!,
	});

	// Verify entity is excluded from working change set (added after checkpoint then deleted)
	const workingElementsAfterDelete = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", workingCommit.change_set_id)
		.where("lixcol_version_id", "=", activeVersion.id)
		.where("entity_id", "=", "post_checkpoint_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(workingElementsAfterDelete).toHaveLength(0);

	// Verify the changes were recorded
	const allChanges = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "post_checkpoint_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "asc")
		.selectAll()
		.execute();

	expect(allChanges).toHaveLength(2); // Insert + Delete
	expect(allChanges[1]!.snapshot_content).toBe(null); // Delete change
});

test("working change set elements are separated per version", async () => {
	const lix = await openLix({});

	// Get the initial main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Make changes in the main version context
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "main_version_key",
			value: "main_version_value",
			lixcol_version_id: mainVersion.id,
		})
		.execute();

	// Create a new change set, commit and version
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "new_cs", lixcol_version_id: "global" },
			{ id: "new_working_cs", lixcol_version_id: "global" },
		])
		.execute();

	// Create a commit that points to the change set
	await lix.db
		.insertInto("commit_all")
		.values({
			id: "new_commit",
			change_set_id: "new_cs",
			lixcol_version_id: "global",
		})
		.execute();

	// Create a working commit for the new version
	await lix.db
		.insertInto("commit_all")
		.values({
			id: "new_working_commit",
			change_set_id: "new_working_cs",
			lixcol_version_id: "global",
		})
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "new_version",
			name: "new_version",
			commit_id: "new_commit",
			working_commit_id: "new_working_commit",
			inherits_from_version_id: "global",
		})
		.execute();

	// Switch to the new version and make changes
	await lix.db
		.updateTable("active_version")
		.set({ version_id: "new_version" })
		.execute();

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "new_version_key",
			value: "new_version_value",
			lixcol_version_id: "new_version",
		})
		.execute();

	// Get the main version's working commit
	const mainWorkingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", mainVersion.working_commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check main version's working change set elements
	const mainWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", mainWorkingCommit.change_set_id)
		.where("lixcol_version_id", "=", mainVersion.id)
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	// Check new version's working change set elements
	const newWorkingElements = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", "new_working_cs")
		.where("lixcol_version_id", "=", "new_version")
		.where("entity_id", "=", "new_version_key")
		.selectAll()
		.execute();

	// Main version should see its own changes
	expect(mainWorkingElements).toHaveLength(1);
	expect(mainWorkingElements[0]).toMatchObject({
		change_set_id: mainWorkingCommit.change_set_id,
		entity_id: "main_version_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// New version should see its own changes
	expect(newWorkingElements).toHaveLength(1);
	expect(newWorkingElements[0]).toMatchObject({
		change_set_id: "new_working_cs",
		entity_id: "new_version_key",
		schema_key: "lix_key_value",
		file_id: "lix",
	});

	// Verify isolation - main working change set should not contain new version changes
	const mainCrossCheck = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", mainWorkingCommit.change_set_id)
		.where("lixcol_version_id", "=", mainVersion.id)
		.where("entity_id", "=", "new_version_key")
		.selectAll()
		.execute();

	// New working change set should not contain main version changes
	const newCrossCheck = await lix.db
		.selectFrom("change_set_element_all")
		.where("change_set_id", "=", "new_working_cs")
		.where("lixcol_version_id", "=", "new_version")
		.where("entity_id", "=", "main_version_key")
		.selectAll()
		.execute();

	expect(mainCrossCheck).toHaveLength(0);
	expect(newCrossCheck).toHaveLength(0);
});

test("inheritance works with resolved view before committing", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const lixInternalDb = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (should inherit from global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	// Insert a global entity in transaction state
	insertTransactionState({
		engine: lix.engine!,
		timestamp: await getTimestamp({ lix }),
		data: [
			{
				entity_id: "test-global-key",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_key_value",
				snapshot_content: JSON.stringify({
					key: "test-global-key",
					value: "global-value",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Query resolved view for the active version - should inherit the global entity
	const resolvedEntitiesForActiveVersion = await lixInternalDb
		.selectFrom("internal_resolved_state_all")
		.where("schema_key", "=", "lix_key_value")
		.where("version_id", "=", activeVersion.id)
		.where("entity_id", "=", "test-global-key")
		.selectAll()
		.execute();

	// Should inherit the global entity even though it was only inserted into global version
	expect(resolvedEntitiesForActiveVersion).toHaveLength(1);
	expect(resolvedEntitiesForActiveVersion[0]?.entity_id).toBe(
		"test-global-key"
	);

	const parsedContent = resolvedEntitiesForActiveVersion[0]!
		.snapshot_content as any;
	expect(parsedContent.key).toBe("test-global-key");
	expect(parsedContent.value).toBe("global-value");
});
