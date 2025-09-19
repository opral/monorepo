import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";

test("log insert creates entries in the view", async () => {
	const lix = await openLix({});

	// Insert a log entry
	await lix.db
		.insertInto("log")
		.values({
			key: "test_log",
			message: "Test log message",
			payload: { meta: "value" },
			level: "info",
		})
		.execute();

	// Verify the log appears in the view
	const logs = await lix.db
		.selectFrom("log")
		.where("key", "=", "test_log")
		.selectAll()
		.execute();

	expect(logs).toHaveLength(1);
	expect(logs[0]).toMatchObject({
		key: "test_log",
		message: "Test log message",
		payload: { meta: "value" },
		level: "info",
	});
});

test("log insert with custom id", async () => {
	const lix = await openLix({});

	const customId = "custom-log-id";

	await lix.db
		.insertInto("log")
		.values({
			id: customId,
			key: "custom.log",
			message: null,
			payload: { context: "custom" },
			level: "debug",
		})
		.execute();

	const logs = await lix.db
		.selectFrom("log")
		.where("id", "=", customId)
		.selectAll()
		.execute();

	expect(logs).toHaveLength(1);
	expect(logs[0]?.id).toBe(customId);
	expect(logs[0]?.key).toBe("custom.log");
	expect(logs[0]?.message).toBeNull();
	expect(logs[0]?.payload).toEqual({ context: "custom" });
	expect(logs[0]?.level).toBe("debug");
});

test("log delete removes entries from the view", async () => {
	const lix = await openLix({});

	// Insert multiple logs
	await lix.db
		.insertInto("log")
		.values([
			{
				key: "test_log_to_keep",
				message: "Keep this log",
				payload: null,
				level: "info",
			},
			{
				key: "test_log_to_delete",
				message: "Delete this log",
				payload: { delete: true },
				level: "error",
			},
		])
		.execute();

	// Verify both logs exist
	const allLogs = await lix.db
		.selectFrom("log")
		.where("key", "in", ["test_log_to_keep", "test_log_to_delete"])
		.selectAll()
		.execute();
	expect(allLogs).toHaveLength(2);

	// Get the ID of the log to delete
	const logToDelete = allLogs.find((log) => log.key === "test_log_to_delete");
	expect(logToDelete).toBeDefined();

	// Delete one log by ID
	await lix.db.deleteFrom("log").where("id", "=", logToDelete!.id).execute();

	// Verify only one log remains
	const remainingLogs = await lix.db
		.selectFrom("log")
		.where("key", "in", ["test_log_to_keep", "test_log_to_delete"])
		.selectAll()
		.execute();
	expect(remainingLogs).toHaveLength(1);
	expect(remainingLogs[0]?.key).toBe("test_log_to_keep");
	expect(remainingLogs[0]?.message).toBe("Keep this log");
	expect(remainingLogs[0]?.payload).toBeNull();

	// Verify the deleted log is gone
	const deletedLogs = await lix.db
		.selectFrom("log")
		.where("id", "=", logToDelete!.id)
		.selectAll()
		.execute();
	expect(deletedLogs).toHaveLength(0);
});

test("multiple log inserts with unique ids", async () => {
	const lix = await openLix({});

	// Insert multiple logs
	await lix.db
		.insertInto("log")
		.values([
			{
				key: "test_log1",
				message: "First log",
				payload: { idx: 1 },
				level: "info",
			},
			{
				key: "test_log2",
				message: "Second log",
				payload: null,
				level: "warn",
			},
			{
				key: "test_log3",
				message: "Third log",
				payload: { idx: 3 },
				level: "error",
			},
		])
		.execute();

	const logs = await lix.db
		.selectFrom("log")
		.where("key", "like", "test_log%")
		.selectAll()
		.execute();

	expect(logs).toHaveLength(3);

	// Verify all have unique IDs
	const ids = logs.map((log) => log.id);
	const uniqueIds = new Set(ids);
	expect(uniqueIds.size).toBe(3);

	// Verify content
	expect(logs.find((log) => log.key === "test_log1")?.message).toBe(
		"First log"
	);
	expect(logs.find((log) => log.key === "test_log1")?.payload).toEqual({
		idx: 1,
	});
	expect(logs.find((log) => log.key === "test_log2")?.message).toBe(
		"Second log"
	);
	expect(logs.find((log) => log.key === "test_log2")?.payload).toBeNull();
	expect(logs.find((log) => log.key === "test_log3")?.message).toBe(
		"Third log"
	);
	expect(logs.find((log) => log.key === "test_log3")?.payload).toEqual({
		idx: 3,
	});
});
