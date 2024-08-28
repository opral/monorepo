import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { createSchema } from "./createSchema.js";
import { validate } from "uuid";

test("file ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db });

	const file = await db
		.insertInto("file_internal")
		.values({ path: "/mock", data: new Uint8Array() })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(file.id)).toBe(true);
});

test("commit ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db });

	const commit = await db
		.insertInto("commit")
		.values({ parent_id: "mock", description: "mock" })
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(commit.id)).toBe(true);
});

test("change ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db });

	const change = await db
		.insertInto("change")
		.values({
			commit_id: "mock",
			type: "file",
			file_id: "mock",
			plugin_key: "mock-plugin",
			operation: "create",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(change.id)).toBe(true);
});
