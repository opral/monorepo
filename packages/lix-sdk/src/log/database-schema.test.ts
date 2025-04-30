import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createLog } from "./create-log.js";
import { applyLogDatabaseSchema } from "./database-schema.js";
import { toBlob } from "../lix/to-blob.js";

test("createLog should work", async () => {
	const lix = await openLixInMemory({});

	const result = await createLog({
		lix,
		key: "test.key",
		message: "test.message",
		level: "info",
	});

	// Check if the log was actually created (it should be, by default)
	expect(result).toBeDefined();
	if (result) {
		expect(result.key).toBe("test.key");
		expect(result.message).toBe("test.message");
		expect(result.level).toBe("info");
	}
});

test("logs older than 24 hours are deleted on schema application", async () => {
	const lix = await openLixInMemory({});

	// Insert a log with a created_at timestamp 2 days ago
	await lix.db
		.insertInto("log")
		.values({
			key: "old.log",
			message: "should be deleted",
			level: "info",
			created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		})
		.execute();

	const lixBlob = await toBlob({ lix });

	const lix2 = await openLixInMemory({ blob: lixBlob });

	const logs = await lix2.db.selectFrom("log").selectAll().execute();
	const keys = logs.map((log) => log.key);

	expect(keys).not.toContain("old.log");
});
