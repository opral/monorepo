import { test, expect, describe } from "vitest";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { commit } from "./commit.js";
import { openLix } from "../lix/open-lix.js";
import { nanoId, uuidV7 } from "../deterministic/index.js";

test("commit should include meta changes (changeset, edges, version updates) in the change table", async () => {
	const lix = await openLix({
		account: { id: "test-account", name: "Test User" },
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// 1. Get the active version (should be 'global')
	const activeVersions = await db
		.selectFrom("active_version")
		.selectAll()
		.execute();

	expect(activeVersions.length).toBe(1);
	const activeVersion = activeVersions[0];
	expect(activeVersion).toBeDefined();
	const versionId = activeVersion!.version_id;

	// Get the previous change set for this version
	const versionBefore = await db
		.selectFrom("version")
		.where("id", "=", versionId)
		.selectAll()
		.executeTakeFirstOrThrow();
	const previousCommitId = versionBefore.commit_id;

	// 2. Insert transaction state
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
			entity_id: "test-entity-1",
			schema_key: "lix_key_value",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				key: "test-key-1",
				value: "test-value-1",
			}),
			schema_version: "1.0",
			version_id: versionId,
			untracked: false,
		},
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
			entity_id: "test-entity-2",
			schema_key: "lix_key_value",
			file_id: "lix",
			plugin_key: "lix_own_entity",
			snapshot_content: JSON.stringify({
				key: "test-key-2",
				value: "test-value-2",
			}),
			schema_version: "1.0",
			version_id: versionId,
			untracked: false,
		},
	});

	// 3. Commit
	commit({ lix });

	// 4. Expect the commit of the active version to have one edge to the previous one
	const versionAfter = await db
		.selectFrom("version")
		.where("id", "=", versionId)
		.selectAll()
		.executeTakeFirstOrThrow();

	const newCommitId = versionAfter.commit_id;
	expect(newCommitId).not.toBe(previousCommitId);

	// Check edges - should have exactly one edge from previous to new
	const edges = await db
		.selectFrom("commit_edge")
		.where("parent_id", "=", previousCommitId)
		.where("child_id", "=", newCommitId)
		.selectAll()
		.execute();

	expect(edges.length).toBe(1);

	// Get the change set ID from the commit
	const newCommit = await db
		.selectFrom("commit")
		.where("id", "=", newCommitId)
		.selectAll()
		.executeTakeFirstOrThrow();

	const newChangeSetId = newCommit.change_set_id;

	// 5. Directly expect on the elements in this new set to contain the expected changes
	const changeSetElements = await db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", newChangeSetId)
		.selectAll()
		.execute();

	// We expect exactly these elements:
	// - 2 user data changes (test-entity-1, test-entity-2)
	// - 2 change authors (one for each user data change)
	// - 1 changeset creation
	// - 1 commit creation
	// - 1 commit edge creation
	// - 1 version update
	// Total: 8 elements
	expect(changeSetElements.length).toBe(8);

	// Verify the specific changes are in the change set
	const elementChangeIds = changeSetElements.map((e) => e.change_id);

	// Get the actual changes to verify content
	const changes = await db
		.selectFrom("change")
		.where("id", "in", elementChangeIds)
		.selectAll()
		.execute();

	// Group by schema_key for easier verification
	const changesBySchema = changes.reduce(
		(acc, change) => {
			if (!acc[change.schema_key]) {
				acc[change.schema_key] = [];
			}
			acc[change.schema_key]!.push(change);
			return acc;
		},
		{} as Record<string, typeof changes>
	);

	// Verify we have the expected types of changes
	expect(changesBySchema["lix_key_value"]?.length).toBe(2); // Our test data
	expect(changesBySchema["lix_change_author"]?.length).toBe(2); // Change authors for test data
	expect(changesBySchema["lix_change_set"]?.length).toBe(1); // The new changeset
	expect(changesBySchema["lix_commit"]?.length).toBe(1); // The new commit
	expect(changesBySchema["lix_commit_edge"]?.length).toBe(1); // The commit edge
	expect(changesBySchema["lix_version"]?.length).toBe(1); // Version update

	// Verify the test entities are included
	const keyValueChanges = changesBySchema["lix_key_value"] || [];
	const keyValueEntities = keyValueChanges.map((c) => c.entity_id);
	expect(keyValueEntities).toContain("test-entity-1");
	expect(keyValueEntities).toContain("test-entity-2");

	// Verify change authors were created for user data changes
	const changeAuthors = changesBySchema["lix_change_author"] || [];
	expect(changeAuthors.length).toBe(2);

	// Change author entity IDs should reference the user data change IDs
	const userDataChangeIds = keyValueChanges.map((c) => c.id);
	for (const author of changeAuthors) {
		// Entity ID format for change authors is "changeId~accountId"
		const changeId = author.entity_id.split("~")[0];
		expect(userDataChangeIds).toContain(changeId);
	}
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
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Create commits for version A
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Create version A
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Create commits for version B
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Create version B
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Insert entity for version A
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Insert entity for version B
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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
	});

	// Commit
	commit({ lix });

	// Get all change sets created (excluding boot change sets)
	const changeSets = await db
		.selectFrom("change_set")
		.selectAll()
		.where("id", "not like", "boot_%")
		.where("id", "not like", "test_%") // Also exclude our initial change sets
		.orderBy("lixcol_created_at", "asc")
		.execute();

	// Should have created change sets for each version with changes
	// Version A has 1 change: version-a-entity
	// Version B has 1 change: version-b-entity
	// Global version has 2 changes: version A and version B creation
	expect(changeSets.length).toBeGreaterThanOrEqual(3);

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
		lix: { sqlite: lix.sqlite, db },
		data: {
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

	// Debug: Check all commits that exist initially
	const initialCommits = await db.selectFrom("commit").selectAll().execute();
	console.log(
		"Initial commits:",
		initialCommits.map((c) => c.id)
	);

	// Check what the version snapshots look like
	const versionSnapshots = lix.sqlite.exec({
		sql: `
			SELECT 
				entity_id,
				json_extract(snapshot_content,'$.commit_id') as commit_id,
				created_at
			FROM change 
			WHERE schema_key = 'lix_version'
			ORDER BY created_at
		`,
		returnValue: "resultRows",
	});
	console.log("Version snapshots:", versionSnapshots);

	// Insert data with version_id = "global"
	insertTransactionState({
		lix: { sqlite: lix.sqlite, db },
		data: {
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

	// CRITICAL: Verify that an actual edge CHANGE exists (not just an element)
	const edgeChanges = await db
		.selectFrom("change")
		.where("schema_key", "=", "lix_commit_edge")
		.where("entity_id", "=", `${previousCommitId}~${newCommitId}`)
		.selectAll()
		.execute();

	console.log("Edge changes found:", edgeChanges.length);
	console.log(
		"Looking for edge entity_id:",
		`${previousCommitId}~${newCommitId}`
	);

	// Let's also check all edge changes
	const allEdgeChanges = await db
		.selectFrom("change")
		.where("schema_key", "=", "lix_commit_edge")
		.selectAll()
		.execute();
	console.log(
		"All edge changes:",
		allEdgeChanges.map((e) => ({
			entity_id: e.entity_id,
			snapshot: e.snapshot_content,
		}))
	);

	expect(edgeChanges.length).toBe(1);

	const edgeChange = edgeChanges[0]!;
	expect(edgeChange.snapshot_content).toBeTruthy();

	// Verify the edge snapshot content
	const edgeSnapshot = edgeChange.snapshot_content as any;
	expect(edgeSnapshot.parent_id).toBe(previousCommitId);
	expect(edgeSnapshot.child_id).toBe(newCommitId);

	// First check what edges exist in the database
	const allEdgesDetailed = lix.sqlite.exec({
		sql: `
			SELECT 
				entity_id,
				json_extract(snapshot_content,'$.parent_id') as parent_id,
				json_extract(snapshot_content,'$.child_id') as child_id,
				created_at
			FROM change 
			WHERE schema_key = 'lix_commit_edge'
			ORDER BY created_at
		`,
		returnValue: "resultRows",
	});
	console.log("All edges in database:", allEdgesDetailed);

	// First check what the latest version change looks like
	const latestVersionChange = lix.sqlite.exec({
		sql: `
			SELECT 
				entity_id,
				json_extract(snapshot_content,'$.commit_id') AS commit_id,
				created_at
			FROM change v
			WHERE v.schema_key = 'lix_version'
			  AND v.entity_id = 'global'
			  AND NOT EXISTS (
				SELECT 1 
				FROM change newer
				WHERE newer.entity_id = v.entity_id
				  AND newer.schema_key = 'lix_version'
				  AND newer.created_at > v.created_at
			  )
		`,
		returnValue: "resultRows",
	});
	console.log("Latest global version change:", latestVersionChange);

	// Check ALL global version changes
	const allGlobalVersionChanges = lix.sqlite.exec({
		sql: `
			SELECT 
				id,
				entity_id,
				json_extract(snapshot_content,'$.commit_id') AS commit_id,
				created_at
			FROM change
			WHERE schema_key = 'lix_version'
			  AND entity_id = 'global'
			ORDER BY created_at DESC
		`,
		returnValue: "resultRows",
	});
	console.log("All global version changes:", allGlobalVersionChanges);

	// Test the edge-based approach for finding version roots
	const edgeBasedVersionRoot = lix.sqlite.exec({
		sql: `
			SELECT 
				json_extract(v.snapshot_content,'$.commit_id') AS tip_commit_id,
				v.entity_id AS version_id
			FROM change v
			WHERE v.schema_key = 'lix_version'
			  AND v.entity_id = 'global'
			  /* keep only the row whose commit_id has NO outgoing edge */
			  AND NOT EXISTS (
				SELECT 1
				FROM change edge
				WHERE edge.schema_key = 'lix_commit_edge'
				  AND json_extract(edge.snapshot_content,'$.parent_id') = json_extract(v.snapshot_content,'$.commit_id')
			  )
		`,
		returnValue: "resultRows",
	});
	console.log("Edge-based version root:", edgeBasedVersionRoot);

	// Verify the edge is discoverable by the lineage CTE
	// This simulates what internal_materialization_lineage does
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
					FROM change edge
					WHERE edge.schema_key = 'lix_commit_edge'
					  AND json_extract(edge.snapshot_content,'$.parent_id') = json_extract(v.snapshot_content,'$.commit_id')
				  )

				UNION

				/* recurse upwards via parent_id */
				SELECT 
					json_extract(edge.snapshot_content,'$.parent_id') AS id,
					l.version_id AS version_id
				FROM change edge
				JOIN lineage_commits l ON json_extract(edge.snapshot_content,'$.child_id') = l.id
				WHERE edge.schema_key = 'lix_commit_edge'
				  AND json_extract(edge.snapshot_content,'$.parent_id') IS NOT NULL
			)
			SELECT id FROM lineage_commits WHERE version_id = 'global' ORDER BY id;
		`,
		returnValue: "resultRows",
	});

	// Debug: Print what's in the lineage
	console.log("Lineage rows:", lineageRows);
	console.log("Previous commit ID:", previousCommitId);
	console.log("New commit ID:", newCommitId);

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
		lix: { sqlite: lix.sqlite, db },
		data: {
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
