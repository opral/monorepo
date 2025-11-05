import { test, expect } from "vitest";
import { initDb } from "./initDb.js";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";

const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test("bundle default values", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const db = initDb(project.lix);

	await db.insertInto("bundle").defaultValues().execute();

	const bundle = await db
		.selectFrom("bundle")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(bundle.id).toBeDefined();
	expect(bundle.declarations).toStrictEqual([]);
});

test("message default values", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const db = initDb(project.lix);

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

	expect(uuidRegex.test(message.id)).toBe(true);
	expect(message.selectors).toStrictEqual([]);
});

test("variant default values", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const db = initDb(project.lix);

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

	expect(uuidRegex.test(variant.id)).toBe(true);
	expect(variant.matches).toStrictEqual([]);
	expect(variant.pattern).toStrictEqual([]);
});

test("it should handle json serialization and parsing for bundles", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const db = initDb(project.lix);

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

test("it should enable foreign key constraints", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const db = initDb(project.lix);

	await expect(() =>
		db
			.insertInto("message")
			.values({
				bundleId: "non-existent",
				locale: "en",
			})
			.execute()
	).rejects.toThrow();
});
