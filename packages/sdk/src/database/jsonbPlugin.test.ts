import { Kysely } from "kysely";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { JsonbPlugin } from "./jsonbPlugin.js";

test("parsing and serializing of jsonb should work", async () => {
	type MockSchema = {
		foo: {
			id: string;
			data: Record<string, any>;
		};
	};
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	database.exec(`
    CREATE TABLE foo (
      id TEXT PRIMARY KEY,
      data BLOB NOT NULL
    ) strict;  
  `);

	const db = new Kysely<MockSchema>({
		dialect: createDialect({
			database,
		}),
		plugins: [new JsonbPlugin({ database })],
	});

	const foo = await db
		.insertInto("foo")
		.values({
			id: "mock",
			data: {
				data: "baz",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(foo).toEqual({
		id: "mock",
		data: {
			data: "baz",
		},
	});
});

test("upserts should be handled", async () => {
	type MockSchema = {
		foo: {
			id: string;
			data: Record<string, any>;
		};
	};
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	database.exec(`
    CREATE TABLE foo (
      id TEXT PRIMARY KEY,
      data BLOB NOT NULL
    ) strict;  
  `);

	const db = new Kysely<MockSchema>({
		dialect: createDialect({
			database,
		}),
		plugins: [
			new JsonbPlugin({
				database,
			}),
		],
	});

	const foo = await db
		.insertInto("foo")
		.values({
			id: "mock",
			data: {
				bar: "baz",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(foo).toEqual({
		id: "mock",
		data: {
			bar: "baz",
		},
	});

	const updatedFoo = {
		id: "mock",
		data: {
			bar: "baz",
			baz: "qux",
		},
	};

	const updatedFooResult = await db
		.insertInto("foo")
		.values(updatedFoo)
		.returningAll()
		.onConflict((oc) => oc.column("id").doUpdateSet(updatedFoo))
		.executeTakeFirstOrThrow();

	expect(updatedFooResult).toEqual(updatedFoo);
});

test("storing json as text is supposed to fail to avoid heuristics if the json should be stored as blob or text", async () => {
	type MockSchema = {
		foo: {
			id: string;
			data: Record<string, any>;
		};
	};
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	database.exec(`
    CREATE TABLE foo (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    ) strict;  
  `);

	const db = new Kysely<MockSchema>({
		dialect: createDialect({
			database,
		}),
		plugins: [new JsonbPlugin({ database })],
	});

	await expect(() =>
		db
			.insertInto("foo")
			.values({
				id: "mock",
				data: {
					bar: "baz",
				},
			})
			.returningAll()
			.executeTakeFirstOrThrow()
	).rejects.toThrowErrorMatchingInlineSnapshot(
		`[SQLite3Error: SQLITE_CONSTRAINT_DATATYPE: sqlite3 result code 3091: cannot store BLOB value in TEXT column foo.data]`
	);
});

test("normalizes variants when messages is a JSON string", async () => {
	type MockSchema = {
		foo: {
			id: string;
			messages: string | any[];
		};
	};
	const database = await createInMemoryDatabase({
		readOnly: false,
	});

	database.exec(`
    CREATE TABLE foo (
      id TEXT PRIMARY KEY,
      messages TEXT NOT NULL
    ) strict;
  `);

	const db = new Kysely<MockSchema>({
		dialect: createDialect({
			database,
		}),
		plugins: [new JsonbPlugin({ database })],
	});

	const rawMessages = JSON.stringify([
		{
			selectors: "[]",
			variants: JSON.stringify([
				{
					matches: "[]",
					pattern: '[{\"type\":\"text\",\"value\":\"x\"}]',
				},
			]),
		},
	]);

	const foo = await db
		.insertInto("foo")
		.values({
			id: "mock",
			messages: rawMessages,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(foo.messages).toEqual([
		{
			selectors: [],
			variants: [
				{
					matches: [],
					pattern: [{ type: "text", value: "x" }],
				},
			],
		},
	]);
});
