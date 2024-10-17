import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { validate } from "uuid";

test("file ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const file = await db
		.insertInto("file_internal")
		.values({ path: "/mock", data: new Uint8Array() })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(file.id)).toBe(true);
});

test("change ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const change = await db
		.insertInto("change")
		.values({
			type: "file",
			entity_id: "value1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "sn1",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(change.id)).toBe(true);
});


test("snapshot ids should default to sha256", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	const change = await db
		.insertInto("snapshot")
		.values({
			// @ts-ignore

			content: "value from insert statement",
		})
		.returningAll()
		.executeTakeFirst();

	expect(change.id).toBe(
		"776ab63a23fdc5f93ab1dced9c8b102571b4da01f90660cdf0c96ce572a0d002",
	);
});

// https://github.com/opral/lix-sdk/issues/71
test("files should be able to have metadata", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const file = await db
		.insertInto("file_internal")
		.values({
			path: "/mock.csv",
			data: new Uint8Array(),
			metadata: {
				primary_key: "email",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(file.metadata?.primary_key).toBe("email");

	const updatedFile = await db
		.updateTable("file_internal")
		.where("path", "=", "/mock.csv")
		.set({
			metadata: {
				primary_key: "something-else",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(updatedFile.metadata?.primary_key).toBe("something-else");
});
