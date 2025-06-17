import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { executeSync } from "./execute-sync.js";
import type { Lix } from "../lix/open-lix.js";

test("executeSync returns raw SQL results (JSON columns as strings)", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.execute();

	const query = lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll();

	const result = executeSync({ lix, query });

	// executeSync returns raw SQL - JSON columns are strings
	expect(result).toMatchObject([{ key: "foo", value: "bar" }]);
});

test("handles simple joins with raw SQL results", async () => {
	const lix = await openLixInMemory({});

	// Simple join test without complex setup
	const query = lix.db
		.selectFrom("key_value as kv1")
		.leftJoin("key_value as kv2", "kv1.key", "kv2.key")
		.select(["kv1.key", "kv1.value as value1", "kv2.value as value2"]);

	const result = executeSync({ lix, query });

	// Should return results (may be empty for this simple test)
	expect(Array.isArray(result)).toBe(true);
});

test("manual JSON parsing with executeSync", async () => {
	const lix = await openLixInMemory({});

	// Test with key_value table which has JSON columns
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test-key",
			value: { foo: "bar", nested: { count: 42 } },
		})
		.execute();

	const result = executeSync({
		lix,
		query: lix.db.selectFrom("key_value").selectAll(),
	});

	// Raw result - value is a JSON string
	expect(typeof result[0].value).toBe("string");

	// Manual JSON parsing
	const parsedValue = JSON.parse(result[0].value);
	expect(parsedValue).toEqual({ foo: "bar", nested: { count: 42 } });
});

// important for function like `createQuery` which are used in triggers and need to be sync
// but are also used by users where the API is async
test("using executeSync with a 'fake async' function should work", async () => {
	const lix = await openLixInMemory({});

	async function fakeAsyncQuery(lix: Lix): Promise<any> {
		await lix.db
			.insertInto("key_value")
			.values({ key: "foo", value: "bar" })
			.execute();

		const query = lix.db
			.selectFrom("key_value")
			.where("key", "=", "foo")
			.selectAll();
		return executeSync({ lix, query }) as any;
	}

	const result = await fakeAsyncQuery(lix);

	// Raw SQL result - value is JSON string
	expect(result).toMatchObject([{ key: "foo", value: "bar" }]);
});

test("it works with kysely transactions", async () => {
	const lix = await openLixInMemory({});

	// transaction that fails
	try {
		await lix.db.transaction().execute(async (trx) => {
			await trx
				.insertInto("key_value")
				.values({ key: "foo", value: "bar" })
				.execute();

			executeSync({
				lix,
				query: trx
					.insertInto("key_value")
					.values({ key: "foo2", value: "bar2" }),
			});

			throw new Error("rollback");
		});
	} catch {
		// ignore;
	}

	const keyValues = await lix.db.selectFrom("key_value").selectAll().execute();

	expect(keyValues.find((kv) => kv.key === "foo")).toBeUndefined();
	expect(keyValues.find((kv) => kv.key === "foo2")).toBeUndefined();

	// transaction that succeeds
	await lix.db.transaction().execute(async (trx) => {
		await trx
			.insertInto("key_value")
			.values({ key: "foo", value: "bar" })
			.execute();

		executeSync({
			lix,
			query: trx.insertInto("key_value").values({ key: "foo2", value: "bar2" }),
		});
	});

	const keyValues2 = await lix.db.selectFrom("key_value").selectAll().execute();

	expect(keyValues2.find((kv) => kv.key === "foo")).toBeDefined();
	expect(keyValues2.find((kv) => kv.key === "foo2")).toBeDefined();
});
