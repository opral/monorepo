import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import { type Kysely } from "kysely";
import { insertTransactionState } from "../state/transaction/insert-transaction-state.js";
import { getTimestampSync } from "../engine/functions/timestamp.js";

test("insert on the change view", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity1", name: "Test Entity" };

	// Insert a change into the view with snapshot_content
	await lix.db
		.insertInto("change")
		.values({
			id: "change1",
			entity_id: "entity1",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: snapshotContent,
		})
		.execute();

	// Verify the change was inserted
	const viewAfterInsert = await lix.db
		.selectFrom("change")
		.where("id", "=", "change1")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toHaveLength(1);
	expect(viewAfterInsert[0]).toMatchObject({
		id: "change1",
		entity_id: "entity1",
		schema_key: "test_schema",
		file_id: "file1",
		plugin_key: "test_plugin",
		snapshot_content: snapshotContent,
	});
	expect(viewAfterInsert[0]?.created_at).toBeDefined();

	// Verify it was also inserted into the internal_change table
	const internalChange = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_change")
		.where("id", "=", "change1")
		.selectAll()
		.execute();

	expect(internalChange).toHaveLength(1);
	expect(internalChange[0]).toMatchObject({
		id: "change1",
		entity_id: "entity1",
		schema_key: "test_schema",
		file_id: "file1",
		plugin_key: "test_plugin",
	});
	// The snapshot_id should have been generated internally
	expect(internalChange[0]?.snapshot_id).toBeDefined();

	// Verify that an internal_snapshot was created
	const internalSnapshot = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where("id", "=", internalChange[0]!.snapshot_id)
		.select((eb) => eb.fn("json", [`content`]).as("content"))
		.executeTakeFirst();

	expect(internalSnapshot).toBeDefined();
	expect(internalSnapshot!.content).toEqual(snapshotContent);
});

test("insert with default id generation", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity2" };

	// Insert a change without specifying an id
	await lix.db
		.insertInto("change")
		.values({
			entity_id: "entity2",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file2",
			plugin_key: "test_plugin",
			snapshot_content: snapshotContent,
		})
		.execute();

	// Verify a change was inserted with a generated ID
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "entity2")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBeDefined();
	expect(changes[0]?.id).not.toBe("");
	expect(changes[0]).toMatchObject({
		entity_id: "entity2",
		schema_key: "test_schema",
		file_id: "file2",
		plugin_key: "test_plugin",
		snapshot_content: snapshotContent,
	});
});

test("insert with default timestamp", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity3" };

	// Insert a change without specifying created_at
	await lix.db
		.insertInto("change")
		.values({
			id: "change3",
			entity_id: "entity3",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file3",
			plugin_key: "test_plugin",
			snapshot_content: snapshotContent,
		})
		.execute();

	// Verify the change has a timestamp
	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "change3")
		.selectAll()
		.execute();

	expect(change).toHaveLength(1);
	expect(change[0]?.created_at).toBeDefined();
	expect(change[0]?.created_at).not.toBe("");
});

// the default SQLite timestamp is only precise to seconds,
// changes can happen rapidly and while the graph is usually
// used to order changes, certain queries may require
// more precision, so we test that the timestamp format includes milliseconds
test("timestamp format includes milliseconds", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity_timestamp" };

	await lix.db
		.insertInto("change")
		.values({
			id: "change_timestamp",
			entity_id: "entity_timestamp",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file_timestamp",
			plugin_key: "test_plugin",
			snapshot_content: snapshotContent,
		})
		.execute();

	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "change_timestamp")
		.selectAll()
		.execute();

	expect(change).toHaveLength(1);
	const timestamp = change[0]?.created_at;
	expect(timestamp).toBeDefined();

	// Verify format: YYYY-MM-DDTHH:MM:SS.SSSSSSZ (ISO 8601 with fractional seconds)
	const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}Z$/;
	expect(timestamp).toMatch(timestampRegex);

	// Verify it contains a decimal point (fractional seconds)
	expect(timestamp).toContain(".");
});

test("can insert with custom timestamp", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity_custom" };
	const customTimestamp = "2023-01-01T12:00:00.123456Z";

	await lix.db
		.insertInto("change")
		.values({
			id: "change_custom",
			entity_id: "entity_custom",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file_custom",
			plugin_key: "test_plugin",
			snapshot_content: snapshotContent,
			created_at: customTimestamp,
		})
		.execute();

	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "change_custom")
		.selectAll()
		.execute();

	expect(change).toHaveLength(1);
	expect(change[0]?.created_at).toBe(customTimestamp);
});

test("rejects non-UTC timestamps", async () => {
	const lix = await openLix({});

	const snapshotContent = { id: "entity_invalid_tz" };

	// Test various invalid timezone formats
	const invalidTimestamps = [
		"2023-01-01T12:00:00.123456", // No timezone
		"2023-01-01T12:00:00.123456+05:30", // Non-UTC timezone
		"2023-01-01T12:00:00.123456-08:00", // Non-UTC timezone
		"2023-01-01T12:00:00.123456+00:00", // UTC but wrong format (should be Z)
		"2023-01-01 12:00:00.123456", // Space separator, no timezone
	];

	for (const invalidTimestamp of invalidTimestamps) {
		await expect(
			lix.db
				.insertInto("change")
				.values({
					entity_id: "entity_invalid_tz",
					schema_key: "test_schema",
					schema_version: "1.0",
					file_id: "file_invalid_tz",
					plugin_key: "test_plugin",
					snapshot_content: snapshotContent,
					created_at: invalidTimestamp,
				})
				.execute()
		).rejects.toThrow(/CHECK constraint failed.*created_at/i);
	}
});

test("inserting a change with snapshot_content: null uses no-content snapshot", async () => {
	const lix = await openLix({});

	// Insert a change with null snapshot_content (deletion)
	await lix.db
		.insertInto("change")
		.values({
			id: "change_deletion",
			entity_id: "entity_to_delete",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: null,
		})
		.execute();

	// Verify the change was created with null snapshot_content
	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "change_deletion")
		.selectAll()
		.executeTakeFirst();

	expect(change).toBeDefined();
	expect(change?.snapshot_content).toBe(null);

	// Verify that the internal_change references the no-content snapshot
	const internalChange = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_change")
		.where("id", "=", "change_deletion")
		.selectAll()
		.executeTakeFirst();

	expect(internalChange).toBeDefined();
	expect(internalChange?.snapshot_id).toBe("no-content");
});

test("changes in transaction can be accessed via change view", async () => {
	const lix = await openLix({});

	await lix.db.transaction().execute(async (trx) => {
		// Insert a key-value entity within transaction
		await trx
			.insertInto("key_value")
			.values({
				key: "test_key_in_transaction",
				value: "test_value",
			})
			.execute();

		// This should create a change in internal_transaction_state
		// The change view should include changes from both internal_change and internal_transaction_state

		// Try to find the change within the transaction via the change view
		const changesInTransaction = await trx
			.selectFrom("change")
			.where("entity_id", "=", "test_key_in_transaction")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		// This should find the change that was created in internal_transaction_state
		expect(changesInTransaction).toHaveLength(1);
		expect(changesInTransaction[0]).toMatchObject({
			entity_id: "test_key_in_transaction",
			schema_key: "lix_key_value",
			file_id: "lix",
			snapshot_content: {
				key: "test_key_in_transaction",
				value: "test_value",
			},
		});
	});
});

test("JSON null handling: change view returns SQL NULL not JSON 'null' string for deletions", async () => {
	const lix = await openLix({});

	// Insert a change with null snapshot_content (deletion/tombstone)
	await lix.db
		.insertInto("change")
		.values({
			id: "change_null_test",
			entity_id: "entity_null_test",
			schema_key: "test_schema",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "test_plugin",
			snapshot_content: null,
		})
		.execute();

	// Query the change view directly using raw SQL to verify the actual value
	const rawResult = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("change")
		.where("id", "=", "change_null_test")
		.select("snapshot_content")
		.executeTakeFirst();

	// The bug: json(NULL) returns the string "null" instead of SQL NULL
	// This test should verify that snapshot_content is actually SQL NULL, not the string "null"
	expect(rawResult?.snapshot_content).toBe(null);
	expect(rawResult?.snapshot_content).not.toBe("null");

	// Also verify through the normal Kysely query
	const change = await lix.db
		.selectFrom("change")
		.where("id", "=", "change_null_test")
		.selectAll()
		.executeTakeFirst();

	expect(change).toBeDefined();
	expect(change?.snapshot_content).toBe(null);
	expect(change?.snapshot_content).not.toBe("null");
});

test("untracked changes in transaction don't show up in change view after commit", async () => {
	const lix = await openLix({});
	const db = lix.db as unknown as Kysely<LixInternalDatabaseSchema>;

	// Get initial change count
	const initialChanges = await lix.db
		.selectFrom("change")
		.selectAll()
		.orderBy("id")
		.execute();

	// Insert an untracked change into the transaction state
	insertTransactionState({
		engine: lix.engine!,
		timestamp: await (
			await import("../engine/functions/timestamp.js")
		).getTimestamp({ lix }),
		data: [
			{
				entity_id: "test_untracked_entity",
				schema_key: "lix_log",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: "test_log_id",
					key: "test_log_key",
					message: "This is an untracked log entry",
					level: "debug",
				}),
				schema_version: "1.0",
				version_id: "global",
				untracked: true, // This is the key - it's untracked
			},
		],
	});

	// Verify the change is in the transaction table
	const changesAfter = await db
		.selectFrom("change")
		.selectAll()
		.orderBy("id")
		.execute();

	expect(initialChanges).toEqual(changesAfter);
});
