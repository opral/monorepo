import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { isBundleId } from "../bundle-id/bundle-id.js";
import { validate as isUuid } from "uuid";
import { createSchema } from "./schema.js";

test("bundle default values", async () => {
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

	expect(isBundleId(bundle.id)).toBe(true);
	expect(bundle.alias).toStrictEqual({});
});

test("message default values", async () => {
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
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(isUuid(message.id)).toBe(true);
	expect(message.declarations).toStrictEqual([]);
	expect(message.selectors).toStrictEqual([]);
});

test("variant default values", async () => {
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
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const variant = await db
		.insertInto("variant")
		.values({
			messageId: message.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(isUuid(variant.id)).toBe(true);
	expect(variant.match).toStrictEqual({});
	expect(variant.pattern).toStrictEqual([]);
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
