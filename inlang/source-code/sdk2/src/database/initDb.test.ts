import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { isBundleId } from "../bundle-id/bundle-id.js";
import { validate } from "uuid";
import { createSchema } from "./createSchema.js";

test("bundle ids should have a default value", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db, sqlite });

	const bundle = await db
		.insertInto("bundle")
		.values({
			alias: {
				mock: "mock",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(isBundleId(bundle.id)).toBe(true);
});

test("message ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db, sqlite });

	const message = await db
		.insertInto("message")
		.values({
			bundleId: "mock",
			locale: "en",
			selectors: [],
			declarations: [],
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(message.id)).toBe(true);
});

test("variant ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db, sqlite });

	const variant = await db
		.insertInto("variant")
		.values({
			messageId: "mock",
			match: {},
			pattern: [],
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(variant.id)).toBe(true);
});

test("it should handle json serialization", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ db, sqlite });

	const bundle = await db
		.insertInto("bundle")
		.values({
			alias: { mock: "mock" },
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(bundle.alias).toEqual({ mock: "mock" });
});