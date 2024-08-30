import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { isBundleId } from "../bundle-id/bundle-id.js";
import { validate } from "uuid";
import { createSchema } from "./schema.js";

test("bundle ids should have a default value", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ sqlite });

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

test("bundle aliases should default to an empty object to ease bundle creation", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.values({
			id: "mock-id",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(bundle.alias).toStrictEqual({});
});

test("message ids should default to uuid", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });
	await createSchema({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const message = await db
		.insertInto("message")
		.values({
			bundleId: bundle.id,
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
	await createSchema({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const message = await db
		.insertInto("message")
		.values({
			bundleId: bundle.id,
			locale: "en",
			selectors: [],
			declarations: [],
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const variant = await db
		.insertInto("variant")
		.values({
			messageId: message.id,
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
	await createSchema({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.values({
			alias: { mock: "mock" },
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(bundle.alias).toEqual({ mock: "mock" });
});
