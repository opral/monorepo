import { test, expect, describe } from "vitest";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import type { LixCommitEdge } from "../../commit/schema.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";
import { commit } from "./commit.js";
import { openLix } from "../../lix/open-lix.js";
import { nanoId, timestamp, uuidV7 } from "../../deterministic/index.js";
import { switchAccount } from "../../account/switch-account.js";
import { commitIsAncestorOf } from "../../query-filter/commit-is-ancestor-of.js";
import { selectActiveVersion } from "../../version/select-active-version.js";

/**
 * TL;DR
 *   ──►  *Business* rows (actual user-domain data) are stored in the *active*
 *        version that the user is editing.
 *   ──►  *Graph* rows (everything that describes the history DAG: change-sets,
 *        commits, edges, version objects) are *always* stored in the
 *        special version called **global**.
 *
 *   This split gives us two key properties:
 *
 *     1. **Single source of truth for history topology**
 *        The entire DAG is materialised exactly once (under `global`), so
 *        graph traversals and lineage CTEs never need to bounce across version
 *        tables. Think "`.git/refs`-style catalogue", but in-DB.
 *
 *     2. **Version-local changes**
 *
 *
 *  BUSINESS DATA lives on the *active version*,
 *  GRAPH META-DATA lives on *global*.
 *
 *  ┌─────────────────┐                 ┌─────────────────────────┐
 *  │  version_active │  user-data      │   COMMIT  (active)      │
 *  └─────────────────┘ ───────────────▶│  entity                 │
 *                                      └─────────────────────────┘
 *                                             ▲
 *                                             │ graph rows that *describe* ↑
 *  ┌────────────┐                   ┌─────────┴───────────────────────────┐
 *  │  global    │  graph rows       │  COMMIT  (global) – graph-only      │
 *  └────────────┘ ─────────────────▶│  change_set, commit, edge, version  │
 *                                   └─────────────────────────────────────┘
 */
test("split-commit: business rows on active version, graph rows on global", async () => {
	/*──────────────────────── 1. initialise workspace ─────────────────────*/
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	/* Resolve IDs for the two versions involved */
	const activeRow = await db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();
	const activeVersionId = activeRow.version_id; // e.g. "main"
	expect(activeVersionId).not.toBe("global");

	const activeVersionBefore = await db
		.selectFrom("version")
		.where("id", "=", activeVersionId)
		.selectAll()
		.executeTakeFirstOrThrow();
	const globalVersionBefore = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const prevCommitActive = activeVersionBefore.commit_id;
	const prevCommitGlobal = globalVersionBefore.commit_id;

	/*──────────────────────── 2. stage two user changes ───────────────────*/
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "para-1",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({ key: "k1", value: "v1" }),
				schema_version: "1.0",
				version_id: activeVersionId,
				untracked: false,
			},
			{
				entity_id: "para-2",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({ key: "k2", value: "v2" }),
				schema_version: "1.0",
				version_id: activeVersionId,
				untracked: false,
			},
		],
	});

	/*──────────────────────── 3. COMMIT ───────────────────────────────────*/
	commit({ lix });

	const activeVersionAfter = await db
		.selectFrom("version")
		.where("id", "=", activeVersionId)
		.selectAll()
		.executeTakeFirstOrThrow();
	const globalVersionAfter = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const commitActiveId = activeVersionAfter.commit_id; // data commit
	const commitGlobalId = globalVersionAfter.commit_id; // graph commit

	expect(commitActiveId).not.toBe(prevCommitActive);
	expect(commitGlobalId).not.toBe(prevCommitGlobal);

	/* helper: build histogram of schema_key counts for a change_set --------*/
	const countSchemas = async (changeSetId: string) => {
		const rows = await db
			.selectFrom("change_set_element")
			.innerJoin("change", "change_set_element.change_id", "change.id")
			.where("change_set_id", "=", changeSetId)
			.select([
				"change.schema_key",
				"change.entity_id",
				"change_set_element.change_id",
				"change.snapshot_content",
			])
			.execute();

		return rows.reduce<Record<string, number>>((map, r) => {
			map[r.schema_key] = (map[r.schema_key] ?? 0) + 1;
			return map;
		}, {});
	};

	const commitActive = await db
		.selectFrom("commit")
		.where("id", "=", commitActiveId)
		.selectAll()
		.executeTakeFirstOrThrow();
	const commitGlobal = await db
		.selectFrom("commit")
		.where("id", "=", commitGlobalId)
		.selectAll()
		.executeTakeFirstOrThrow();

	const activeSchemas = await countSchemas(commitActive.change_set_id);
	const globalSchemas = await countSchemas(commitGlobal.change_set_id);

	/*──────────────────────── 4. assertions ───────────────────────────────*/
	/* COMMIT ON ACTIVE VERSION ────────────────────────────────────────────*/
	expect(activeSchemas["lix_key_value"]).toBe(2); // user rows

	// Must *not* contain any graph-rows which belong to global commit
	expect(activeSchemas["lix_change_author"]).toBeUndefined();
	expect(activeSchemas["lix_commit"]).toBeUndefined();
	expect(activeSchemas["lix_change_set"]).toBeUndefined();
	expect(activeSchemas["lix_commit_edge"]).toBeUndefined();
	expect(activeSchemas["lix_version"]).toBeUndefined();

	// COMMIT ON GLOBAL (graph-only)
	expect(globalSchemas["lix_key_value"]).toBeUndefined();

	expect(globalSchemas["lix_change_author"]).toBe(2); // two entities (para-1, para-2)
	expect(globalSchemas["lix_commit"]).toBe(2); // copy of active + self
    // Edges are derived now; no commit_edge change rows under global change set
    expect(globalSchemas["lix_commit_edge"]).toBeUndefined();
	expect(globalSchemas["lix_version"]).toBe(2); // version_active & global
	expect(globalSchemas["lix_change_set"]).toBe(2); // active + self
	// CSE-of-CSE rows are not surfaced by the view; only first-order CSEs are materialized
	expect(globalSchemas["lix_change_set_element"]).toBeUndefined();

	/*──────────────────── 5. graph edges exist exactly once ───────────────*/
	const edgeActive = await db
		.selectFrom("commit_edge")
		.where("parent_id", "=", prevCommitActive)
		.where("child_id", "=", commitActiveId)
		.selectAll()
		.execute();
	expect(edgeActive.length).toBe(1); // prevActive ─▶ active

	const edgeGlobal = await db
		.selectFrom("commit_edge")
		.where("parent_id", "=", prevCommitGlobal)
		.where("child_id", "=", commitGlobalId)
		.selectAll()
		.execute();
	expect(edgeGlobal.length).toBe(1); // prevGlobal ─▶ global
});

test("commit with no changes should not create a change set", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get initial state
	const changesBeforeCommit = await db
		.selectFrom("change")
		.selectAll()
		.execute();

	const changeSetsBeforeCommit = await db
		.selectFrom("change_set")
		.selectAll()
		.execute();
	// Commit with no changes
	commit({ lix });

	// Should have same number of changes and change sets
	const changesAfterCommit = await db
		.selectFrom("change")
		.selectAll()
		.execute();

	const changeSetsAfterCommit = await db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changesAfterCommit.length).toBe(changesBeforeCommit.length);
	expect(changeSetsAfterCommit.length).toBe(changeSetsBeforeCommit.length);
});

test("commit should handle multiple versions correctly", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Create version A with dynamic IDs
	const versionAId = nanoId({ lix });
	const versionACommitId = uuidV7({ lix });
	const versionAChangeSetId = nanoId({ lix });
	const versionAWorkingChangeSetId = nanoId({ lix });
	const versionAWorkingCommitId = uuidV7({ lix });

	// Create version B with dynamic IDs
	const versionBId = nanoId({ lix });
	const versionBCommitId = uuidV7({ lix });
	const versionBChangeSetId = nanoId({ lix });
	const versionBWorkingChangeSetId = nanoId({ lix });
	const versionBWorkingCommitId = uuidV7({ lix });

	// Create change sets for versions
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionAChangeSetId,
				schema_key: "lix_change_set",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionAChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionAWorkingChangeSetId,
				schema_key: "lix_change_set",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionAWorkingChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionBChangeSetId,
				schema_key: "lix_change_set",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionBChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionBWorkingChangeSetId,
				schema_key: "lix_change_set",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionBWorkingChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Create commits for version A
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionACommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionACommitId,
					change_set_id: versionAChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionAWorkingCommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionAWorkingCommitId,
					change_set_id: versionAWorkingChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Create version A
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionAId,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionAId,
					name: "version A",
					commit_id: versionACommitId,
					working_commit_id: versionAWorkingCommitId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Create commits for version B
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionBCommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionBCommitId,
					change_set_id: versionBChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionBWorkingCommitId,
				schema_key: "lix_commit",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionBWorkingCommitId,
					change_set_id: versionBWorkingChangeSetId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Create version B
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: versionBId,
				schema_key: "lix_version",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: versionBId,
					name: "version B",
					commit_id: versionBCommitId,
					working_commit_id: versionBWorkingCommitId,
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Insert entity for version A
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "version-a-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "version-a-key",
					value: "version-a-value",
				}),
				schema_version: "1.0",
				version_id: versionAId,
				untracked: false,
			},
		],
	});

	// Insert entity for version B
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "version-b-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "version-b-key",
					value: "version-b-value",
				}),
				schema_version: "1.0",
				version_id: versionBId,
				untracked: false,
			},
		],
	});

	// Commit
	commit({ lix });

	// Test what matters: the versions should be properly created and working
	// Version A should exist
	const versionA = await db
		.selectFrom("version")
		.where("id", "=", versionAId)
		.selectAll()
		.executeTakeFirst();

	expect(versionA).toBeDefined();
	expect(versionA?.id).toBe(versionAId);
	// After commit, the commit_id will be updated to the new commit containing changes
	expect(versionA?.commit_id).toBeDefined();
	expect(versionA?.working_commit_id).toBeDefined();

	// Version B should exist
	const versionB = await db
		.selectFrom("version")
		.where("id", "=", versionBId)
		.selectAll()
		.executeTakeFirst();

	expect(versionB).toBeDefined();
	expect(versionB?.id).toBe(versionBId);
	// After commit, the commit_id will be updated to the new commit containing changes
	expect(versionB?.commit_id).toBeDefined();
	expect(versionB?.working_commit_id).toBeDefined();

	// The test entities should exist in their respective versions
	const versionAEntity = await db
		.selectFrom("state_all")
		.where("entity_id", "=", "version-a-entity")
		.where("version_id", "=", versionAId)
		.selectAll()
		.executeTakeFirst();

	expect(versionAEntity).toBeDefined();

	const versionBEntity = await db
		.selectFrom("state_all")
		.where("entity_id", "=", "version-b-entity")
		.where("version_id", "=", versionBId)
		.selectAll()
		.executeTakeFirst();

	expect(versionBEntity).toBeDefined();

	// Verify version updates
	const versionChanges = await db
		.selectFrom("change")
		.selectAll()
		.where("schema_key", "=", "lix_version")
		.orderBy("created_at", "desc")
		.execute();

	// Should have version updates for all three versions (global, A, B)
	const updatedVersionIds = versionChanges.map((c) => c.entity_id);
	expect(updatedVersionIds).toContain("global");
	expect(updatedVersionIds).toContain(versionAId);
	expect(updatedVersionIds).toContain(versionBId);
});

describe("onStateCommit", () => {
	test("fires when inserting data", async () => {
		const lix = await openLix({});

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute an INSERT
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires when updating data", async () => {
		const lix = await openLix({});

		// Insert initial data
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "initial" })
			.execute();

		// Register hook after initial data
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute an UPDATE
		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "test")
			.execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires when deleting data", async () => {
		const lix = await openLix({});

		// Insert initial data
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Register hook after initial data
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute a DELETE
		await lix.db.deleteFrom("key_value").where("key", "=", "test").execute();

		// Hook should fire once for the commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires for batch operations", async () => {
		const lix = await openLix({});

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute multiple INSERTs in one operation
		await lix.db
			.insertInto("key_value")
			.values([
				{ key: "test1", value: "value1" },
				{ key: "test2", value: "value2" },
				{ key: "test3", value: "value3" },
			])
			.execute();

		// Hook should fire once for the single commit
		expect(hookCallCount).toBe(1);

		unsubscribe();
	});

	test("fires once per transaction", async () => {
		const lix = await openLix({});

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute multiple separate operations
		await lix.db
			.insertInto("key_value")
			.values({ key: "test1", value: "value1" })
			.execute();

		await lix.db
			.insertInto("key_value")
			.values({ key: "test2", value: "value2" })
			.execute();

		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "test1")
			.execute();

		// Hook should fire once for each operation
		expect(hookCallCount).toBe(3);

		unsubscribe();
	});

	test("multiple listeners all fire", async () => {
		const lix = await openLix({});

		// Register multiple hooks
		let listener1Count = 0;
		let listener2Count = 0;
		let listener3Count = 0;

		const unsubscribe1 = lix.hooks.onStateCommit(() => {
			listener1Count++;
		});

		const unsubscribe2 = lix.hooks.onStateCommit(() => {
			listener2Count++;
		});

		const unsubscribe3 = lix.hooks.onStateCommit(() => {
			listener3Count++;
		});

		// Execute an operation
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// All listeners should have fired
		expect(listener1Count).toBe(1);
		expect(listener2Count).toBe(1);
		expect(listener3Count).toBe(1);

		unsubscribe1();
		unsubscribe2();
		unsubscribe3();
	});

	test("unsubscribed listeners do not fire", async () => {
		const lix = await openLix({});

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// First operation - hook should fire
		await lix.db
			.insertInto("key_value")
			.values({ key: "test1", value: "value1" })
			.execute();
		expect(hookCallCount).toBe(1);

		// Unsubscribe
		unsubscribe();

		// Second operation - hook should not fire
		await lix.db
			.insertInto("key_value")
			.values({ key: "test2", value: "value2" })
			.execute();
		expect(hookCallCount).toBe(1); // Should not increase
	});

	test("does not fire for SELECT operations", async () => {
		const lix = await openLix({});

		// Insert some data first
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Register hook
		let hookCallCount = 0;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			hookCallCount++;
		});

		// Execute SELECT operations
		await lix.db.selectFrom("key_value").selectAll().execute();
		await lix.db.selectFrom("state").selectAll().execute();
		await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test")
			.selectAll()
			.execute();

		// Hook should not fire for SELECT operations
		expect(hookCallCount).toBe(0);

		unsubscribe();
	});

	test("hook can access lix instance via closure", async () => {
		const lix = await openLix({});

		// Register hook that uses lix instance
		let capturedValue: any = null;
		const unsubscribe = lix.hooks.onStateCommit(() => {
			// Access lix instance in the hook
			capturedValue = lix.db;
		});

		// Execute an operation
		await lix.db
			.insertInto("key_value")
			.values({ key: "test", value: "value" })
			.execute();

		// Hook should have access to lix instance
		expect(capturedValue).toBeDefined();
		expect(capturedValue).toBe(lix.db);

		unsubscribe();
	});

	// TODO hooks throwing is uncaught
	test.todo("errors in hook do not prevent commit", async () => {
		const lix = await openLix({});

		// Register hook that throws an error
		const unsubscribe = lix.hooks.onStateCommit(() => {
			throw new Error("Hook error");
		});

		// Operation should still succeed despite hook error
		await expect(
			lix.db
				.insertInto("key_value")
				.values({ key: "test", value: "value" })
				.execute()
		).resolves.not.toThrow();

		// Verify data was inserted
		const result = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "test")
			.selectAll()
			.execute();
		expect(result).toHaveLength(1);

		unsubscribe();
	});
});

/**
 * Tests that when changes are made directly to the global version,
 * the global version's change_set_id is updated to reflect those changes.
 *
 * This is a simpler case than non-global versions because:
 * - Only one version needs to be updated (global itself)
 * - The changes and the version update are both stored in the same version (global)
 */
test("global version should move forward when mutations occur", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the global version before any changes
	const globalVersionBefore = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const initialCommitId = globalVersionBefore.commit_id;

	// Insert data with version_id = "global"
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "test-global-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "test-global-key",
					value: "test-global-value",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Commit the changes
	commit({ lix });

	// Get the global version after changes
	const globalVersionAfter = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// The global version's commit_id should have been updated
	expect(globalVersionAfter.commit_id).not.toBe(initialCommitId);

	// Verify a new commit was created and linked
	const edges = await db
		.selectFrom("commit_edge")
		.where("parent_id", "=", initialCommitId)
		.where("child_id", "=", globalVersionAfter.commit_id)
		.selectAll()
		.execute();

	expect(edges.length).toBe(1);

	// Get the change set ID from the new commit
	const newCommit = await db
		.selectFrom("commit")
		.where("id", "=", globalVersionAfter.commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify the change set contains our change
	const changeSetElements = await db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", newCommit.change_set_id)
		.selectAll()
		.execute();

	// Should contain our test entity change and the meta changes
	const elementIds = changeSetElements.map((e) => e.entity_id);
	expect(elementIds.some((id) => id.includes("test-global-entity"))).toBe(true);
});

// https://github.com/opral/lix-sdk/issues/364#issuecomment-3218464923
// 
// Verifies that working change set elements are NOT updated for the global version.
// We intentionally assert no working elements are written for global's working commit.
// This documents current behavior and makes it explicit until a future lazy design.
test("does not update working change set elements for global version", async () => {
  const lix = await openLix({});

  // Stage a tracked change in the global version
  await lix.db
    .insertInto("key_value_all")
    .values({ key: "global_key", value: "global_value", lixcol_version_id: "global" })
    .execute();

  // Resolve global version and its working commit
  const globalVersion = await lix.db
    .selectFrom("version")
    .where("id", "=", "global")
    .selectAll()
    .executeTakeFirstOrThrow();

  const workingCommit = await lix.db
    .selectFrom("commit")
    .where("id", "=", globalVersion.working_commit_id)
    .selectAll()
    .executeTakeFirstOrThrow();

  // There should be no working change set element for the global working change set
  const workingElements = await lix.db
    .selectFrom("change_set_element_all")
    .where("lixcol_version_id", "=", "global")
    .where("change_set_id", "=", workingCommit.change_set_id)
    .where("entity_id", "=", "global_key")
    .where("schema_key", "=", "lix_key_value")
    .selectAll()
    .execute();

  expect(workingElements).toHaveLength(0);
});

/**
 * Tests that edge changes are properly created during commit.
 *
 * When a version moves forward (creates a new commit), an edge change must be created
 * with schema_key='lix_commit_edge' that links the old commit to the new one.
 * This is critical for the materialization lineage CTE to traverse the commit history.
 */
test("commit should create edge changes that are discoverable by lineage CTE", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: false },
				lixcol_version_id: "global",
			},
		],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the global version before any changes
	const globalVersionBefore = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const previousCommitId = globalVersionBefore.commit_id;

	// Insert data with version_id = "global"
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "test-edge-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "test-edge-key",
					value: "test-edge-value",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Commit the changes
	commit({ lix });

	// Get the global version after changes
	const globalVersionAfter = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	const newCommitId = globalVersionAfter.commit_id;
	expect(newCommitId).not.toBe(previousCommitId);

  // CRITICAL: edges are derived in Step 2; there are no edge change rows
  const edgeChanges = await db
    .selectFrom("change")
    .where("schema_key", "=", "lix_commit_edge")
    .where("entity_id", "=", `${previousCommitId}~${newCommitId}`)
    .selectAll()
    .execute();

  expect(edgeChanges.length).toBe(0);

  // Verify the derived edge via the commit_edge view
  const derivedEdge = await db
    .selectFrom("commit_edge")
    .where("parent_id", "=", previousCommitId)
    .where("child_id", "=", newCommitId)
    .selectAll()
    .execute();
  expect(derivedEdge.length).toBe(1);

  // Verify the edge is discoverable by the lineage CTE using derived edges
  const lineageRows = lix.sqlite.exec({
    sql: `
      WITH RECURSIVE lineage_commits(id, version_id) AS (
        /* anchor: use edge-based approach to find the tip */
        SELECT 
          json_extract(v.snapshot_content,'$.commit_id') AS id,
          v.entity_id AS version_id 
        FROM change v
        WHERE v.schema_key = 'lix_version'
          AND v.entity_id = 'global'
          /* keep only the row whose commit_id has NO outgoing edge */
          AND NOT EXISTS (
            SELECT 1
            FROM internal_materialization_all_commit_edges e
            WHERE e.parent_id = json_extract(v.snapshot_content,'$.commit_id')
          )

        UNION

        /* recurse upwards via parent_id */
        SELECT 
          e.parent_id AS id,
          l.version_id AS version_id
        FROM internal_materialization_all_commit_edges e
        JOIN lineage_commits l ON e.child_id = l.id
        WHERE e.parent_id IS NOT NULL
      )
      SELECT id FROM lineage_commits WHERE version_id = 'global' ORDER BY id;
    `,
    returnValue: "resultRows",
  });

	// Should have at least 2 entries: the new commit and its parent
	expect(lineageRows.length).toBeGreaterThanOrEqual(2);

	// Verify both commits are in the lineage
	const lineageIds = lineageRows.map((row) => row[0]);
	expect(lineageIds).toContain(newCommitId);
	expect(lineageIds).toContain(previousCommitId);
});

/**
 * Tests that when changes are made to a non-global version (like the active/main version),
 * both the version itself AND the global version are updated.
 *
 * This is critical because:
 * 1. The non-global version's commit_id moves forward to include its data changes
 * 2. The global version's commit_id ALSO moves forward to track the version update itself
 * 3. All version changes (updates to any version entity) are stored in the global version's history
 *
 * Without this behavior, each version would need to maintain its own history of all other versions,
 * which would be redundant and complex. Instead, the global version serves as the central registry
 * of all version state changes.
 */
test("active version should move forward when mutations occur", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, bootstrap: true },
			},
		],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the global version before for comparison
	const globalVersionBefore = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Get the active version (should be the main version, not global)
	const activeVersion = await db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	const activeVersionId = activeVersion.version_id;
	expect(activeVersionId).not.toBe("global"); // Ensure we're testing a non-global version

	// Get the version before any changes
	const versionBefore = await db
		.selectFrom("version")
		.where("id", "=", activeVersionId)
		.selectAll()
		.executeTakeFirstOrThrow();

	const initialActiveVersionCommitId = versionBefore.commit_id;

	// Insert data with version_id = activeVersionId
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "test-active-entity",
				schema_key: "lix_key_value",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					key: "test-active-key",
					value: "test-active-value",
				}),
				schema_version: "1.0",
				version_id: activeVersionId,
				untracked: false,
			},
		],
	});

	// Commit the changes
	commit({ lix });

	// Get the version after changes
	const versionAfter = await db
		.selectFrom("version")
		.where("id", "=", activeVersionId)
		.selectAll()
		.executeTakeFirstOrThrow();

	// The version's commit_id should have been updated
	expect(versionAfter.commit_id).not.toBe(initialActiveVersionCommitId);

	// Verify a new commit was created and linked
	const edges = await db
		.selectFrom("commit_edge")
		.where("parent_id", "=", initialActiveVersionCommitId)
		.where("child_id", "=", versionAfter.commit_id)
		.selectAll()
		.execute();

	expect(edges.length).toBe(1);

	// Get the change set ID from the new commit
	const newCommit = await db
		.selectFrom("commit")
		.where("id", "=", versionAfter.commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify the change set contains our change
	const changeSetElements = await db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", newCommit.change_set_id)
		.selectAll()
		.execute();

	// Should contain our test entity change and the meta changes
	const elementIds = changeSetElements.map((e) => e.entity_id);
	expect(elementIds.some((id) => id.includes("test-active-entity"))).toBe(true);

	// Also verify that the global version DID move forward
	// (because all version changes are tracked in global)
	const globalVersionAfter = await db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Global version should have been updated to track the version change
	expect(globalVersionAfter.commit_id).not.toBe(globalVersionBefore.commit_id);

	// Get the change set ID from the global version's new commit
	const globalNewCommit = await db
		.selectFrom("commit")
		.where("id", "=", globalVersionAfter.commit_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify the global version's new changeset contains the version updates
	const globalChangeSetElements = await db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", globalNewCommit.change_set_id)
		.selectAll()
		.execute();

	// Should contain exactly two version updates: global and active version
	const versionUpdateElements = globalChangeSetElements.filter(
		(e) => e.schema_key === "lix_version"
	);
	expect(versionUpdateElements.length).toBe(2);

	// Verify both version updates point to the correct entities
	const versionUpdateEntityIds = versionUpdateElements.map((e) => e.entity_id);
	expect(versionUpdateEntityIds).toContain("global");
	expect(versionUpdateEntityIds).toContain(activeVersionId);

	// Get the actual version changes to verify they have the correct change_set_ids
	const versionChanges = await db
		.selectFrom("change")
		.where(
			"id",
			"in",
			versionUpdateElements.map((e) => e.change_id)
		)
		.where("schema_key", "=", "lix_version")
		.selectAll()
		.execute();

	// Verify the version snapshots contain the correct commit_ids
	for (const change of versionChanges) {
		if (change.entity_id === "global") {
			expect(change.snapshot_content?.commit_id).toBe(
				globalVersionAfter.commit_id
			);
		} else if (change.entity_id === activeVersionId) {
			expect(change.snapshot_content?.commit_id).toBe(versionAfter.commit_id);
		}
	}
});

// Tests moved from handle-state-mutation.test.ts since they test commit behavior

test("creates a new commit and updates the version's commit id for mutations", async () => {
	const lix = await openLix({});

	const versionBeforeInsert = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("key_value")
		.values({
			key: "mock_key",
			value: "mock_value",
		})
		.execute();

	const versionAfterInsert = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", versionBeforeInsert.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterInsert.commit_id).not.toEqual(
		versionBeforeInsert.commit_id
	);

	await lix.db
		.updateTable("key_value_all")
		.where("key", "=", "mock_key")
		.where(
			"lixcol_version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.set({
			value: "mock_value_updated",
		})
		.execute();

	const versionAfterUpdate = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", versionAfterInsert.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterUpdate.commit_id).not.toEqual(
		versionAfterInsert.commit_id
	);

	await lix.db.deleteFrom("key_value").where("key", "=", "mock_key").execute();

	const versionAfterDelete = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", versionAfterUpdate.id)
		.executeTakeFirstOrThrow();

	expect(versionAfterDelete.commit_id).not.toEqual(
		versionAfterUpdate.commit_id
	);

	const edges = await lix.db
		.selectFrom("commit_edge")
		.select(["parent_id", "child_id"])
		.execute();

	expect(edges).toEqual(
		expect.arrayContaining([
			{
				parent_id: versionBeforeInsert.commit_id,
				child_id: versionAfterInsert.commit_id,
			},
			{
				parent_id: versionAfterInsert.commit_id,
				child_id: versionAfterUpdate.commit_id,
			},
			{
				parent_id: versionAfterUpdate.commit_id,
				child_id: versionAfterDelete.commit_id,
			},
		] satisfies LixCommitEdge[])
	);
});

test("groups changes of a transaction into the same change set for the given version", async () => {
	const lix = await openLix({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const commitAncestryBefore = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: activeVersion.commit_id }))
		.selectAll()
		.execute();

	await lix.db.transaction().execute(async (trx) => {
		await trx
			.insertInto("key_value")
			.values({
				key: "mock_key",
				value: "mock_value",
			})
			.execute();

		await trx
			.insertInto("key_value")
			.values({
				key: "mock_key2",
				value: "mock_value2",
			})
			.execute();
	});

	const activeVersionAfterTransaction = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const commitAncestryAfter = await lix.db
		.selectFrom("commit")
		.where(commitIsAncestorOf({ id: activeVersionAfterTransaction.commit_id }))
		.selectAll()
		.execute();

	expect(commitAncestryAfter).toHaveLength(commitAncestryBefore.length + 1);
});

test("creates change_author records for insert, update, and delete operations", async () => {
	const lix = await openLix({});

	// Create test accounts
	await lix.db
		.insertInto("account")
		.values([
			{ id: "test-account-1", name: "Test User 1" },
			{ id: "test-account-2", name: "Test User 2" },
		])
		.execute();

	// Switch to single active account for insert
	await switchAccount({
		lix,
		to: [{ id: "test-account-1", name: "Test User 1" }],
	});

	// INSERT: Create initial entity
	await lix.db
		.insertInto("key_value")
		.values({
			key: "crud_test_key",
			value: "initial_value",
		})
		.execute();

	// Switch to multiple active accounts for update
	await switchAccount({
		lix,
		to: [
			{ id: "test-account-1", name: "Test User 1" },
			{ id: "test-account-2", name: "Test User 2" },
		],
	});

	// UPDATE: Modify the entity
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "crud_test_key")
		.set({ value: "updated_value" })
		.execute();

	// Switch back to single account for delete
	await switchAccount({
		lix,
		to: [{ id: "test-account-2", name: "Test User 2" }],
	});

	// DELETE: Remove the entity
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "crud_test_key")
		.execute();

	// Get all changes for this entity
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "crud_test_key")
		.where("schema_key", "=", "lix_key_value")
		.orderBy("created_at", "asc")
		.select(["id"])
		.execute();

	expect(changes).toHaveLength(3); // Insert + Update + Delete

	const insertChangeId = changes[0]!.id;
	const updateChangeId = changes[1]!.id;
	const deleteChangeId = changes[2]!.id;

	// Verify change_author records for INSERT (single account)
	const insertAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", insertChangeId)
		.selectAll()
		.execute();

	expect(insertAuthors).toHaveLength(1);
	expect(insertAuthors[0]).toMatchObject({
		change_id: insertChangeId,
		account_id: "test-account-1",
	});

	// Verify change_author records for UPDATE (multiple accounts)
	const updateAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", updateChangeId)
		.selectAll()
		.execute();

	expect(updateAuthors).toHaveLength(2);

	// Check that both accounts are represented
	const updateAccountIds = updateAuthors.map((author) => author.account_id);
	expect(updateAccountIds).toContain("test-account-1");
	expect(updateAccountIds).toContain("test-account-2");

	// Check that all records have the correct change_id
	updateAuthors.forEach((author) => {
		expect(author).toMatchObject({
			change_id: updateChangeId,
		});
	});

	// Verify change_author records for DELETE (single account)
	const deleteAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", deleteChangeId)
		.selectAll()
		.execute();

	expect(deleteAuthors).toHaveLength(1);
	expect(deleteAuthors[0]).toMatchObject({
		change_id: deleteChangeId,
		account_id: "test-account-2",
	});
});

test("global cache entry should be inherited by child versions in resolved view", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get the active version (should be main, not global)
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	expect(activeVersion.version_id).not.toBe("global");

	// Insert a mock entity into global version via transaction
	insertTransactionState({
		lix,
		timestamp: timestamp({ lix }),
		data: [
			{
				entity_id: "mock-global-entity",
				schema_key: "mock_schema",
				file_id: "mock-file",
				plugin_key: "mock_plugin",
				snapshot_content: JSON.stringify({
					id: "mock-global-entity",
					data: "test-data",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: false,
			},
		],
	});

	// Commit the changes
	commit({ lix });

	// Verify cache has exactly one entry for this entity (in global version)
	const cacheEntries = await db
		.selectFrom("internal_state_cache")
		.selectAll()
		.where("entity_id", "=", "mock-global-entity")
		.execute();

	expect(cacheEntries).toHaveLength(1);
	expect(cacheEntries[0]?.version_id).toBe("global");

	// Verify resolved view returns the entity for both global and active version
	const resolvedEntries = await db
		.selectFrom("internal_resolved_state_all")
		.select(["version_id", "entity_id", "schema_key"])
		.where("entity_id", "=", "mock-global-entity")
		.orderBy("version_id", "asc")
		.execute();

	// Should have two entries: one for active version (inherited) and one for global
	expect(resolvedEntries).toHaveLength(2);

	const versionIds = resolvedEntries.map((e) => e.version_id).sort();
	expect(versionIds).toContain("global");
	expect(versionIds).toContain(activeVersion.version_id);
});

describe("file lixcol cache updates", () => {
	test("should update cache on file insert", async () => {
		const lix = await openLix({});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert a file
		await lix.db
			.insertInto("file")
			.values({
				path: "/test.txt",
				data: new TextEncoder().encode("test content"),
			})
			.execute();

		// Check that the cache was populated
		const cacheEntries = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.execute();

		expect(cacheEntries.length).toBe(1);
		const entry = cacheEntries[0]!;

		// Should have all required fields
		expect(entry.file_id).toBeDefined();
		expect(entry.version_id).toBeDefined();
		expect(entry.latest_change_id).toBeDefined();
		expect(entry.latest_commit_id).toBeDefined();
		expect(entry.created_at).toBeDefined();
		expect(entry.updated_at).toBeDefined();

		// created_at should equal updated_at for new files
		expect(entry.created_at).toBe(entry.updated_at);
	});

	test("should update cache on file update", async () => {
		const lix = await openLix({
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
		});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert a file
		await lix.db
			.insertInto("file")
			.values({
				path: "/test.txt",
				data: new TextEncoder().encode("initial content"),
			})
			.execute();

		// Get initial cache entry
		const initialCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Update the file
		await lix.db
			.updateTable("file")
			.where("path", "=", "/test.txt")
			.set({
				data: new TextEncoder().encode("updated content"),
			})
			.execute();

		// Check that cache was updated
		const updatedCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.where("file_id", "=", initialCache.file_id)
			.selectAll()
			.executeTakeFirstOrThrow();

		// Should have new change_id and commit_id
		expect(updatedCache.latest_change_id).not.toBe(
			initialCache.latest_change_id
		);
		expect(updatedCache.latest_commit_id).not.toBe(
			initialCache.latest_commit_id
		);

		// created_at should be preserved, updated_at should change
		expect(updatedCache.created_at).toBe(initialCache.created_at);
		expect(updatedCache.updated_at).not.toBe(initialCache.updated_at);
	});

	test("should remove cache entry on file delete", async () => {
		const lix = await openLix({});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert a file
		await lix.db
			.insertInto("file")
			.values({
				path: "/test.txt",
				data: new TextEncoder().encode("test content"),
			})
			.execute();

		// Verify cache exists
		const cacheBeforeDelete = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.execute();
		expect(cacheBeforeDelete.length).toBe(1);

		// Delete the file
		await lix.db.deleteFrom("file").where("path", "=", "/test.txt").execute();

		// Cache entry should be removed
		const cacheAfterDelete = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.execute();
		expect(cacheAfterDelete.length).toBe(0);
	});

	test("should batch update cache for multiple files", async () => {
		const lix = await openLix({});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert multiple files in one transaction
		await lix.db
			.insertInto("file")
			.values([
				{ path: "/file1.txt", data: new TextEncoder().encode("content1") },
				{ path: "/file2.txt", data: new TextEncoder().encode("content2") },
				{ path: "/file3.txt", data: new TextEncoder().encode("content3") },
			])
			.execute();

		// All files should have cache entries
		const cacheEntries = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.execute();

		expect(cacheEntries.length).toBe(3);

		// All should have the same commit_id (batched in one commit)
		const commitIds = cacheEntries.map((e) => e.latest_commit_id);
		expect(new Set(commitIds).size).toBe(1);
	});

	test("should preserve created_at on conflict", async () => {
		const lix = await openLix({
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
		});
		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Insert a file into global version using file_all
		await lix.db
			.insertInto("file_all")
			.values({
				path: "/test.txt",
				data: new TextEncoder().encode("initial"),
				lixcol_version_id: "global",
			})
			.execute();

		const initialCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.where("version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// Update the file multiple times using file_all (in deterministic mode, timestamps auto-increment)
		await lix.db
			.updateTable("file_all")
			.where("path", "=", "/test.txt")
			.where("lixcol_version_id", "=", "global")
			.set({ data: new TextEncoder().encode("update1") })
			.execute();

		await lix.db
			.updateTable("file_all")
			.where("path", "=", "/test.txt")
			.where("lixcol_version_id", "=", "global")
			.set({ data: new TextEncoder().encode("update2") })
			.execute();

		const finalCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.where("file_id", "=", initialCache.file_id)
			.where("version_id", "=", "global")
			.selectAll()
			.executeTakeFirstOrThrow();

		// created_at should be preserved from the initial insert
		expect(finalCache.created_at).toBe(initialCache.created_at);
		// updated_at should be different
		expect(finalCache.updated_at).not.toBe(initialCache.updated_at);
	});

	test("should handle mixed insert, update, and delete in one commit", async () => {
		const lix = await openLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		const activeVersion = await selectActiveVersion(lix)
			.selectAll()
			.executeTakeFirstOrThrow();

		const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

		// Setup initial files
		await lix.db
			.insertInto("file")
			.values([
				{
					id: "keep-file-id",
					path: "/keep.txt",
					data: new TextEncoder().encode("keep"),
				},
				{
					id: "update-file-id",
					path: "/update.txt",
					data: new TextEncoder().encode("update"),
				},
				{
					id: "delete-file-id",
					path: "/delete.txt",
					data: new TextEncoder().encode("delete"),
				},
			])
			.execute();

		// Get initial state
		const initialCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.execute();
		expect(initialCache.length).toBe(3);

		// Perform mixed operations
		insertTransactionState({
			lix,
			timestamp: timestamp({ lix }),
			data: [
				// New file
				{
					entity_id: "new-file-id",
					schema_key: "lix_file_descriptor",
					file_id: "new-file-id",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						id: "new-file-id",
						path: "/new.txt",
					}),
					schema_version: "1.0",
					version_id: activeVersion.id,
					untracked: false,
				},
				// Update existing file
				{
					entity_id: "update-file-id",
					schema_key: "lix_file_descriptor",
					file_id: "update-file-id",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						id: "update-file-id",
						path: "/update.txt",
						metadata: { updated: true },
					}),
					schema_version: "1.0",
					version_id: activeVersion.id,
					untracked: false,
				},
				// Delete file
				{
					entity_id: "delete-file-id",
					schema_key: "lix_file_descriptor",
					file_id: "delete-file-id",
					plugin_key: "lix_own_entity",
					snapshot_content: null, // Deletion
					schema_version: "1.0",
					version_id: activeVersion.id,
					untracked: false,
				},
			],
		});

		// Commit the transaction
		commit({ lix });

		// Check final cache state
		const finalCache = await db
			.selectFrom("internal_file_lixcol_cache")
			.selectAll()
			.orderBy("file_id")
			.execute();

		// Should have: keep, update, new (delete should be gone)
		expect(finalCache.length).toBe(3);

		const filePaths = await lix.db
			.selectFrom("file")
			.select("path")
			.orderBy("path")
			.execute();

		expect(filePaths.map((f) => f.path).sort()).toEqual([
			"/keep.txt",
			"/new.txt",
			"/update.txt",
		]);
	});
});
