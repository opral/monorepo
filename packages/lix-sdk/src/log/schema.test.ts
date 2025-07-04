import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";

test("log insert creates entries in the view", async () => {
	const lix = await openLix({});

	// Insert a log entry
	await lix.db
		.insertInto("log")
		.values({
			key: "test.log",
			message: "Test log message",
			level: "info",
		})
		.execute();

	// Verify the log appears in the view
	const logs = await lix.db.selectFrom("log").selectAll().execute();

	expect(logs).toHaveLength(1);
	expect(logs[0]).toMatchObject({
		key: "test.log",
		message: "Test log message",
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
			message: "Custom ID log",
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
	expect(logs[0]?.message).toBe("Custom ID log");
	expect(logs[0]?.level).toBe("debug");
});

test("log delete removes entries from the view", async () => {
	const lix = await openLix({});

	// Insert multiple logs
	await lix.db
		.insertInto("log")
		.values([
			{
				key: "log.to.keep",
				message: "Keep this log",
				level: "info",
			},
			{
				key: "log.to.delete",
				message: "Delete this log",
				level: "error",
			},
		])
		.execute();

	// Verify both logs exist
	const allLogs = await lix.db.selectFrom("log").selectAll().execute();
	expect(allLogs).toHaveLength(2);

	// Get the ID of the log to delete
	const logToDelete = allLogs.find((log) => log.key === "log.to.delete");
	expect(logToDelete).toBeDefined();

	// Delete one log by ID
	await lix.db.deleteFrom("log").where("id", "=", logToDelete!.id).execute();

	// Verify only one log remains
	const remainingLogs = await lix.db.selectFrom("log").selectAll().execute();
	expect(remainingLogs).toHaveLength(1);
	expect(remainingLogs[0]?.key).toBe("log.to.keep");
	expect(remainingLogs[0]?.message).toBe("Keep this log");

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
				key: "log1",
				message: "First log",
				level: "info",
			},
			{
				key: "log2",
				message: "Second log",
				level: "warn",
			},
			{
				key: "log3",
				message: "Third log",
				level: "error",
			},
		])
		.execute();

	const logs = await lix.db.selectFrom("log").selectAll().execute();

	expect(logs).toHaveLength(3);

	// Verify all have unique IDs
	const ids = logs.map((log) => log.id);
	const uniqueIds = new Set(ids);
	expect(uniqueIds.size).toBe(3);

	// Verify content
	expect(logs.find((log) => log.key === "log1")?.message).toBe("First log");
	expect(logs.find((log) => log.key === "log2")?.message).toBe("Second log");
	expect(logs.find((log) => log.key === "log3")?.message).toBe("Third log");
});
