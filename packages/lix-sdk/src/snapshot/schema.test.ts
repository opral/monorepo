import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("insert, select, delete on the snapshot view", async () => {
	const lix = await openLixInMemory({});

	// Insert a snapshot into the view
	await lix.db
		.insertInto("snapshot")
		.values({
			id: "snap1",
			content: { name: "Test Entity", value: 42 },
		})
		.execute();

	// Verify the snapshot was inserted
	const viewAfterInsert = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "snap1")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toHaveLength(1);
	expect(viewAfterInsert[0]).toMatchObject({
		id: "snap1",
		content: { name: "Test Entity", value: 42 },
	});

	// Verify it was also inserted into the internal_snapshot table
	const internalSnapshot = await lix.db
		// @ts-expect-error - internal snapshot table
		.selectFrom("internal_snapshot")
		.where("id", "=", "snap1")
		.selectAll()
		.execute();

	expect(internalSnapshot).toHaveLength(1);
	expect(internalSnapshot[0]?.id).toBe("snap1");

	// Delete the snapshot
	await lix.db.deleteFrom("snapshot").where("id", "=", "snap1").execute();

	// Verify it was deleted from both view and table
	const viewAfterDelete = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "snap1")
		.selectAll()
		.execute();

	const internalAfterDelete = await lix.db
		// @ts-expect-error - internal snapshot table
		.selectFrom("internal_snapshot")
		.where("id", "=", "snap1")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
	expect(internalAfterDelete).toHaveLength(0);
});

test("insert with default id generation", async () => {
	const lix = await openLixInMemory({});

	// Insert a snapshot without specifying an id
	await lix.db
		.insertInto("snapshot")
		.values({
			content: { text: "Auto-generated ID test" },
		})
		.execute();

	// Find the snapshot by content to verify it was inserted with a generated ID
	const snapshots = await lix.db
		.selectFrom("snapshot")
		// @ts-expect-error - content is JSON
		.where("content", "=", JSON.stringify({ text: "Auto-generated ID test" }))
		.selectAll()
		.execute();

	expect(snapshots).toHaveLength(1);
	expect(snapshots[0]?.id).toBeTruthy();
	expect(snapshots[0]?.id).not.toBe("no-content");
	expect(snapshots[0]?.content).toEqual({ text: "Auto-generated ID test" });
});

test("handles complex JSON content", async () => {
	const lix = await openLixInMemory({});

	const complexContent = {
		string: "test",
		number: 123,
		boolean: true,
		null_value: null,
		array: [1, 2, 3, "mixed", { nested: true }],
		nested_object: {
			level1: {
				level2: {
					deep_value: "found it",
				},
			},
		},
	};

	await lix.db
		.insertInto("snapshot")
		.values({
			id: "complex",
			content: complexContent,
		})
		.execute();

	const snapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "complex")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.content).toEqual(complexContent);
});

test("no-content snapshot exists by default", async () => {
	const lix = await openLixInMemory({});

	// Verify the no-content snapshot exists
	const noContentSnapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "no-content")
		.selectAll()
		.execute();

	expect(noContentSnapshot).toHaveLength(1);
	expect(noContentSnapshot[0]).toMatchObject({
		id: "no-content",
		content: null,
	});

	// Verify it exists in the internal table too
	const internalNoContent = await lix.db
		// @ts-expect-error - internal snapshot table
		.selectFrom("internal_snapshot")
		.where("id", "=", "no-content")
		.selectAll()
		.execute();

	expect(internalNoContent).toHaveLength(1);
	expect(internalNoContent[0]?.id).toBe("no-content");
	expect(internalNoContent[0]?.content).toBeNull();
});

test("no-content snapshot is not duplicated on multiple schema applications", async () => {
	const lix = await openLixInMemory({});

	// Apply the schema again (this happens in real usage)
	lix.sqlite.exec(`
			INSERT OR IGNORE INTO internal_snapshot (id, content)
			VALUES ('no-content', NULL);
		`);

	// Verify there's still only one no-content snapshot
	const noContentSnapshots = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "no-content")
		.selectAll()
		.execute();

	expect(noContentSnapshots).toHaveLength(1);
});

test("can insert null content explicitly", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("snapshot")
		.values({
			id: "explicit-null",
			content: null,
		})
		.execute();

	const snapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "explicit-null")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.content).toBeNull();
});

test("snapshot ids must be unique", async () => {
	const lix = await openLixInMemory({});

	// Insert first snapshot
	await lix.db
		.insertInto("snapshot")
		.values({
			id: "duplicate",
			content: { first: true },
		})
		.execute();

	// Try to insert another snapshot with the same id
	await expect(
		lix.db
			.insertInto("snapshot")
			.values({
				id: "duplicate",
				content: { second: true },
			})
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed/);
});

test("delete nonexistent snapshot has no effect", async () => {
	const lix = await openLixInMemory({});

	// Try to delete a snapshot that doesn't exist
	await lix.db.deleteFrom("snapshot").where("id", "=", "nonexistent").execute();

	// Verify the no-content snapshot still exists (as a basic sanity check)
	const noContentSnapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", "no-content")
		.selectAll()
		.execute();

	expect(noContentSnapshot).toHaveLength(1);
});
