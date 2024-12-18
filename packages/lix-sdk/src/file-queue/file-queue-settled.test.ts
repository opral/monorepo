import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { fileQueueSettled } from "./file-queue-settled.js";

test("should wait until the file queue is settled", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change_queue")
		.values([
			{
				id: 1,
				file_id: "file1",
				path_after: "path1",
				data_after: new TextEncoder().encode("data1"),
				metadata_after: null,
			},
			{
				id: 2,
				file_id: "file2",
				path_after: "path2",
				data_after: new TextEncoder().encode("data2"),
				metadata_after: null,
			},
		])
		.execute();

	// Start a background task to remove entries from the change_queue after a delay
	setTimeout(async () => {
		await lix.db.deleteFrom("change_queue").where("id", "=", 1).execute();
		await lix.db.deleteFrom("change_queue").where("id", "=", 2).execute();
	}, 110);

	await fileQueueSettled({ lix });

	const remainingEntries = await lix.db
		.selectFrom("change_queue")
		.selectAll()
		.execute();

	expect(remainingEntries).toEqual([]);
});

test("should return immediately if the file queue is already empty", async () => {
	const lix = await openLixInMemory({});

	await lix.db.deleteFrom("change_queue").execute();

	await fileQueueSettled({ lix });

	const remainingEntries = await lix.db
		.selectFrom("change_queue")
		.selectAll()
		.execute();
	expect(remainingEntries).toEqual([]);
});
