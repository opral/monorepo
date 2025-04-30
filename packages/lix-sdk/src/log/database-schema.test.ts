import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { toBlob } from "../lix/to-blob.js";

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
