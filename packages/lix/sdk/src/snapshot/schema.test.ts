import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { sql, type Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

test("insert with default id generation", async () => {
	const lix = await openLix({});

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
	const lix = await openLix({});

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
	const lix = await openLix({});

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
	const lix = await openLix({});

	// Apply the schema again (this happens in real usage)
	lix.runtime!.sqlite.exec(`
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
	const lix = await openLix({});

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

test("snapshot content validation - accepts JSONB", async () => {
	const lix = await openLix({});

	// This should succeed - content is properly formatted as JSONB
	await (lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
		.insertInto("internal_snapshot")
		.values({
			id: "valid-jsonb",
			content: sql`jsonb(${JSON.stringify({ test: "data", value: 123 })})`,
		})
		.execute();

	const snapshot = await (
		lix.db as unknown as Kysely<LixInternalDatabaseSchema>
	)
		.selectFrom("internal_snapshot")
		.where("id", "=", "valid-jsonb")
		.select(["id", (eb) => eb.fn("json", [`content`]).as("content")])
		.executeTakeFirstOrThrow();

	expect(snapshot.content).toEqual({ test: "data", value: 123 });
});

test("snapshot content validation - rejects text JSON", async () => {
	const lix = await openLix({});

	// This should fail - content is text JSON, not JSONB
	// SQLite's STRICT tables enforce that BLOB columns can't store TEXT
	await expect(
		(lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id: "invalid-text-json",
				content: sql`${JSON.stringify({ test: "data" })}`,
			})
			.execute()
	).rejects.toThrow(
		/SQLITE_CONSTRAINT_DATATYPE.*cannot store TEXT value in BLOB column/
	);
});

test("snapshot content validation - rejects arbitrary binary", async () => {
	const lix = await openLix({});

	// This should fail - content is arbitrary binary data, not valid JSONB
	// Using raw SQL to insert arbitrary binary that's not JSONB format
	const encoder = new TextEncoder();
	const arbitraryBytes = encoder.encode("arbitrary binary data");

	await expect(async () => {
		lix.runtime!.sqlite.exec({
			sql: `INSERT INTO internal_snapshot (id, content) VALUES (?, ?)`,
			bind: ["invalid-binary", arbitraryBytes],
		});
	}).rejects.toThrow(/CHECK constraint failed.*json_valid/);
});

test("snapshot content validation - prevents double-stringified JSON storage", async () => {
	const lix = await openLix({});

	// This test demonstrates the double-stringified JSON issue we were investigating
	const originalData = { id: "test", name: "value" };
	const onceStringified = JSON.stringify(originalData);
	const doubleStringified = JSON.stringify(onceStringified);

	// First, verify that plain text JSON is rejected by STRICT table
	await expect(
		(lix.db as unknown as Kysely<LixInternalDatabaseSchema>)
			.insertInto("internal_snapshot")
			.values({
				id: "double-stringified",
				content: sql`${doubleStringified}`,
			})
			.execute()
	).rejects.toThrow(
		/SQLITE_CONSTRAINT_DATATYPE.*cannot store TEXT value in BLOB column/
	);

	// The real issue: jsonb() on double-stringified JSON creates valid JSONB
	// because a JSON string is valid JSON! But with our new json_type check,
	// this should now be rejected since it's storing a string, not an object
	expect(() => {
		lix.runtime!.sqlite.exec({
			sql: `INSERT INTO internal_snapshot (id, content) VALUES (?, jsonb(?))`,
			bind: ["double-stringified-jsonb", doubleStringified],
		});
	}).toThrow(/CHECK constraint failed/);

	// Also verify that storing arrays is rejected (we only want objects)
	expect(() => {
		lix.runtime!.sqlite.exec({
			sql: `INSERT INTO internal_snapshot (id, content) VALUES (?, jsonb(?))`,
			bind: ["array-content", JSON.stringify([1, 2, 3])],
		});
	}).toThrow(/CHECK constraint failed/);

	// Verify the correct way: jsonb() on properly stringified JSON
	lix.runtime!.sqlite.exec({
		sql: `INSERT INTO internal_snapshot (id, content) VALUES (?, jsonb(?))`,
		bind: ["correct-jsonb", onceStringified],
	});

	// Verify it retrieves correctly
	const correctResult: any = lix.runtime!.sqlite.exec({
		sql: `SELECT json(content) as json_content FROM internal_snapshot WHERE id = ?`,
		bind: ["correct-jsonb"],
		returnValue: "resultRows",
	});

	expect(correctResult[0]?.[0]).toBe(onceStringified);
	expect(JSON.parse(correctResult[0]![0]!)).toEqual(originalData);
});

test("snapshot ids must be unique", async () => {
	const lix = await openLix({});

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
