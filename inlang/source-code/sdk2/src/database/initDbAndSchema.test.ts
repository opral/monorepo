import { createInMemoryDatabase } from "sqlite-wasm-kysely";
import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { isHumanId } from "../human-id/human-id.js";
import { validate as isUuid } from "uuid";

test("bundle default values", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(isHumanId(bundle.id)).toBe(true);
	expect(bundle.declarations).toStrictEqual([]);
});

test("message default values", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

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
	expect(message.selectors).toStrictEqual([]);
});

test("variant default values", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

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
	expect(variant.matches).toStrictEqual([]);
	expect(variant.pattern).toStrictEqual([]);
});

test("it should handle json serialization and parsing for bundles", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	const bundle = await db
		.insertInto("bundle")
		.values({
			declarations: [
				{
					type: "input-variable",
					name: "mock",
				},
			],
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(bundle.declarations).toStrictEqual([
		{
			type: "input-variable",
			name: "mock",
		},
	]);
});

// https://github.com/opral/inlang-sdk/issues/209
test.todo("it should enable foreign key constraints", async () => {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});
	const db = initDb({ sqlite });

	expect(() =>
		db
			.insertInto("message")
			.values({
				bundleId: "non-existent",
				locale: "en",
			})
			.execute()
	).rejects.toThrow();
});
