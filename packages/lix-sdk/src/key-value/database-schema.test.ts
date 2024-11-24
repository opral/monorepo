import { Kysely, sql } from "kysely";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { expect, test } from "vitest";
import {
	applyKeyValueDatabaseSchema,
	type KeyValueTable,
} from "./database-schema.js";

test("string values are accepted", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	applyKeyValueDatabaseSchema(sqlite);

	const db = new Kysely<{
		key_value: KeyValueTable;
	}>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	const result = await db
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
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	applyKeyValueDatabaseSchema(sqlite);

	const db = new Kysely<{
		key_value: KeyValueTable;
	}>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	await db
		.insertInto("key_value")
		.values({
			key: "foo",
			value: "bar",
		})
		.returningAll()
		.execute();

	expect(
		db
			.insertInto("key_value")
			.values({
				key: "foo",
				value: "bar",
			})
			.returningAll()
			.execute(),
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_PRIMARYKEY: sqlite3 result code 1555: UNIQUE constraint failed: key_value.key]`,
	);
});

test("using json as value should work", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	applyKeyValueDatabaseSchema(sqlite);

	const db = new Kysely<{
		key_value: KeyValueTable;
	}>({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	await db
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

	const onlyOneProperty = await db
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
