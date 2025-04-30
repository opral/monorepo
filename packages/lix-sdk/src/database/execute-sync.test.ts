import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { executeSync } from "./execute-sync.js";
import type { Lix } from "../lix/open-lix.js";
import { mockChange } from "../change/mock-change.js";
import type { LixFile } from "../file/database-schema.js";
import { sql } from "kysely";

test("executeSync yields the same result as async execute for an insert", async () => {
	const lix1 = await openLixInMemory({});
	const lix2 = await openLixInMemory({});

	const query = (lix: Lix) =>
		lix.db
			.insertInto("key_value")
			.values({ key: "foo", value: "bar" })
			.returningAll();

	const result = executeSync({ lix: lix1, query: query(lix1) });
	const result2 = await query(lix2).execute();

	expect(result).toEqual(result2);
});

test("handles joins", async () => {
	const lix = await openLixInMemory({});

	const mockFile0: LixFile = {
		id: "file-0",
		path: "/file-0",
		data: new Uint8Array(),
		metadata: {},
	};
	const mockChange0 = mockChange({ id: "change-0", file_id: "file-0" });

	await lix.db.insertInto("change").values(mockChange0).execute();
	await lix.db.insertInto("file").values(mockFile0).execute();

	const query = lix.db
		.selectFrom("file")
		.innerJoin("change", "change.file_id", "file.id")
		.where("file.id", "=", "file-0")
		.selectAll("change")
		.select("file.path as file_path");

	const result = executeSync({ lix, query });
	const result2 = await query.execute();

	expect(result).toEqual(result2);
});

test("transforms the query or results (json parsing)", async () => {
	const lix1 = await openLixInMemory({});
	const lix2 = await openLixInMemory({});

	const mockFile0: LixFile = {
		id: "file-0",
		path: "/file-0",
		data: new Uint8Array(),
		metadata: {
			foo: "bar",
		},
	};

	const insertQuery = (lix: Lix) =>
		lix.db.insertInto("file").values(mockFile0).returningAll();

	const result1 = await insertQuery(lix1).execute();
	const result2 = executeSync({ lix: lix2, query: insertQuery(lix2) });

	expect(result1).toEqual(result2);

	const withManualJson = executeSync({
		lix: lix2,
		query: lix2.db
			.selectFrom("file")
			.selectAll()
			.select(sql`json(metadata)`.as("metadata")),
	});

	for (const row of withManualJson) {
		row.metadata = JSON.parse(row.metadata as string);
	}

	expect(result1).toEqual(withManualJson);
});

// important for function like `createQuery` which are used in triggers and need to be sync
// but are also used by users where the API is async
test("using executeSync with a 'fake async' function should work", async () => {
	const lix = await openLixInMemory({});

	async function fakeAyncQuery(lix: Lix): Promise<any> {
		const query = lix.db
			.insertInto("key_value")
			.values({ key: "foo", value: "bar" })
			.returningAll();
		return executeSync({ lix, query }) as any;
	}

	const result = await fakeAyncQuery(lix);

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
