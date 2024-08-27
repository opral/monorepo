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
			// @ts-expect-error - manually serialize
			alias: JSON.stringify({
				mock: "mock",
			}),
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
			// @ts-expect-error - manually serialize
			selectors: JSON.stringify({ mock: "mock" }),
			// @ts-expect-error - manually serialize
			declarations: JSON.stringify({ mock: "mock" }),
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
			// @ts-expect-error - manually serialize
			match: "{}",
			// @ts-expect-error - manually serialize
			pattern: JSON.stringify({}),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(variant.id)).toBe(true);
});
