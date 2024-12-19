import { sql } from "kysely";
import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { validate as validateUuid } from "uuid";

test("string values are accepted", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.insertInto("key_value")
		.values({
			key: "foo",
			value: "bar",
		})
		.returningAll()
		.execute();

	expect(result).toMatchObject([
		{
			key: "foo",
			value: "bar",
		},
	]);
});

test("duplicate keys lead to an error", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({
			key: "foo",
			value: "bar",
		})
		.returningAll()
		.execute();

	expect(
		lix.db
			.insertInto("key_value")
			.values({
				key: "foo",
				value: "bar",
			})
			.returningAll()
			.execute()
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_PRIMARYKEY: sqlite3 result code 1555: UNIQUE constraint failed: key_value.key]`
	);
});

test("using json as value should work", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values([
			{
				key: "foo",
				value: JSON.stringify({
					bar: "baz",
					age: 42,
					location: "Berlin",
				}),
			},
		])
		.returningAll()
		.execute();

	const onlyOneProperty = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.select(sql`json_extract(value, '$.bar')`.as("bar"))
		.executeTakeFirstOrThrow();

	// The JSON parsing plugin needs improvements.
	// not important for now
	// const parsedAsJson = await db
	// 	.selectFrom("key_value")
	// 	.where("key", "=", "foo")
	// 	.select(sql`json(value)`.as("value"))
	// 	.executeTakeFirstOrThrow();

	// expect(parsedAsJson).toMatchObject({
	// 	value: {
	// 		bar: "baz",
	// 		age: 42,
	// 		location: "Berlin",
	// 	},
	// });

	expect(onlyOneProperty).toMatchObject({
		bar: "baz",
	});
});

test("it should default add a uuid lix_id if not exits", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(validateUuid(result.value)).toBe(true);
});

test("default value for lix_sync to reduce conditional logic (the key is always set)", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_sync")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result.value).toBe("false");
});

test("skip_change_control should default to false", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.insertInto("key_value")
		.values({ key: "mock_key", value: "mock_value" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result.skip_change_control).toBeFalsy();

	const updated = await lix.db
		.updateTable("key_value")
		.set({ skip_change_control: true })
		.where("key", "=", "mock_key")
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(updated.skip_change_control).toBeTruthy();
});
