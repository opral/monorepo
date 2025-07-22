import { test, expect, describe } from "vitest";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { insertTransactionState } from "./insert-transaction-state.js";
import { commit } from "./commit.js";
import { openLix } from "../lix/open-lix.js";
import { nanoId } from "../deterministic/index.js";

test("commit should include meta changes (changeset, edges, version updates) in the change table", async () => {
	const lix = await openLix({
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
	const previousChangeSetId = versionBefore.change_set_id;

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

	// 4. Expect the change set of the active version to have one edge to the previous one
	const versionAfter = await db
		.selectFrom("version")
		.where("id", "=", versionId)
		.selectAll()
		.executeTakeFirstOrThrow();

	const newChangeSetId = versionAfter.change_set_id;
	expect(newChangeSetId).not.toBe(previousChangeSetId);

	// Check edges - should have exactly one edge from previous to new
	const edges = await db
		.selectFrom("change_set_edge")
		.where("parent_id", "=", previousChangeSetId)
		.where("child_id", "=", newChangeSetId)
		.selectAll()
		.execute();

	expect(edges.length).toBe(1);

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
	// - 1 edge creation
	// - 1 version update
	// Total: 7 elements
	expect(changeSetElements.length).toBe(7);

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
	expect(changesBySchema["lix_change_set_edge"]?.length).toBe(1); // The edge
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
	const versionAChangeSetId = nanoId({ lix });
	const versionAWorkingChangeSetId = nanoId({ lix });

	// Create version B with dynamic IDs
	const versionBId = nanoId({ lix });
	const versionBChangeSetId = nanoId({ lix });
	const versionBWorkingChangeSetId = nanoId({ lix });

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
				change_set_id: versionAChangeSetId,
				working_change_set_id: versionAWorkingChangeSetId,
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
				change_set_id: versionBChangeSetId,
				working_change_set_id: versionBWorkingChangeSetId,
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
