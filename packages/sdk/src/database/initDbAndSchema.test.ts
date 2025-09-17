import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { isHumanId } from "../human-id/human-id.js";
import { validate as isUuid } from "uuid";
import { openLix } from "@lix-js/sdk";

test("bundle default values", async () => {
	const lix = await openLix({});
	const db = initDb({ lix });

	await db.insertInto("bundle").defaultValues().execute();
	const bundle = await db
		.selectFrom("bundle")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(isHumanId(bundle.id)).toBe(true);
	expect(bundle.declarations).toStrictEqual([]);
});

test("message default values", async () => {
	const lix = await openLix({});

	const db = initDb({ lix });

	await db.insertInto("bundle").defaultValues().execute();
	const bundle = await db
		.selectFrom("bundle")
		.select("id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("message")
		.values({
			bundleId: bundle.id,
			locale: "en",
		})
		.execute();
	const message = await db
		.selectFrom("message")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(isUuid(message.id)).toBe(true);
	expect(message.selectors).toStrictEqual([]);
});

test("variant default values", async () => {
	const lix = await openLix({});

	const db = initDb({ lix });

	await db.insertInto("bundle").defaultValues().execute();
	const bundle = await db
		.selectFrom("bundle")
		.select("id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("message")
		.values({
			bundleId: bundle.id,
			locale: "en",
		})
		.execute();
	const message = await db
		.selectFrom("message")
		.select("id")
		.executeTakeFirstOrThrow();

	await db
		.insertInto("variant")
		.values({
			messageId: message.id,
		})
		.execute();
	const variant = await db
		.selectFrom("variant")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(isUuid(variant.id)).toBe(true);
	expect(variant.matches).toStrictEqual([]);
	expect(variant.pattern).toStrictEqual([]);
});

test("it should handle json serialization and parsing for bundles", async () => {
	const lix = await openLix({});

	const db = initDb({ lix });

	await db
		.insertInto("bundle")
		.values({
			declarations: [
				{
					type: "input-variable",
					name: "mock",
				},
			],
		})
		.execute();
	const bundle = await db
		.selectFrom("bundle")
		.selectAll()
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
	const lix = await openLix({});

	const db = initDb({ lix });

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
