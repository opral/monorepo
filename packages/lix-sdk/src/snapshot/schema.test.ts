import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

test("insert with default id generation", async () => {
	const lix = await openLixInMemory({});

	// Insert a snapshot without specifying an id
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_snapshot")
		.values({
			content: sql`jsonb(${JSON.stringify({ text: "Auto-generated ID test" })})`,
		})
		.execute();

	// Find the snapshot by content to verify it was inserted with a generated ID
	const snapshots = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where(
			"content",
			"=",
			sql`jsonb(${JSON.stringify({ text: "Auto-generated ID test" })})`
		)
		.select(["id", (eb) => eb.fn("json", [`content`]).as("content")])
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

	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_snapshot")
		.values({
			id: "complex",
			content: sql`jsonb(${JSON.stringify(complexContent)})`,
		})
		.execute();

	const snapshot = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where("id", "=", "complex")
		.select(["id", (eb) => eb.fn("json", [`content`]).as("content")])
		.executeTakeFirstOrThrow();

	expect(snapshot.content).toEqual(complexContent);
});

test("no-content snapshot exists by default", async () => {
	const lix = await openLixInMemory({});

	// Verify the no-content snapshot exists in the internal table
	const internalNoContent = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
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
	const noContentSnapshots = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where("id", "=", "no-content")
		.selectAll()
		.execute();

	expect(noContentSnapshots).toHaveLength(1);
});

test("can insert null content explicitly", async () => {
	const lix = await openLixInMemory({});

	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_snapshot")
		.values({
			id: "explicit-null",
			content: null,
		})
		.execute();

	const snapshot = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where("id", "=", "explicit-null")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(snapshot.content).toBeNull();
});

test("snapshot ids must be unique", async () => {
	const lix = await openLixInMemory({});

	// Insert first snapshot
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_snapshot")
		.values({
			id: "duplicate",
			content: sql`jsonb(${JSON.stringify({ first: true })})`,
		})
		.execute();

	// Try to insert another snapshot with the same id
	await expect(
		(lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id: "duplicate",
				content: sql`jsonb(${JSON.stringify({ second: true })})`,
			})
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed/);
});
