import { test, expect } from "vitest";
import { bundleIdOrAliasIs } from "./bundleIdOrAliasIs.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { selectBundleNested } from "./selectBundleNested.js";

test("should return the bundle by id", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	await project.db.insertInto("bundle").values({ id: "some-id" }).execute();

	const bundle = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where(bundleIdOrAliasIs("some-id"))
		.executeTakeFirst();

	expect(bundle?.id).toBe("some-id");
});

test("it should return the bundle by alias", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	await project.db
		.insertInto("bundle")
		.values([
			{ id: "some-id", alias: { mock: "some-alias" } },
			{
				id: "some-id-2",
				alias: { other: "another-alias" },
			},
		])
		.execute();

	const bundle = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where(bundleIdOrAliasIs("some-alias"))
		.executeTakeFirst();

	expect(bundle?.id).toBe("some-id");
});

test("it should return multiple bundles by alias", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	await project.db
		.insertInto("bundle")
		.values([
			{ id: "some-id", alias: { mock: "some-alias" } },
			{ id: "some-id-2", alias: { other: "some-alias" } },
			{ id: "some-id-3", alias: { other: "another-alias" } },
		])
		.execute();

	const bundles = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where(bundleIdOrAliasIs("some-alias"))
		.execute();

	expect(bundles).toStrictEqual([
		{ id: "some-id", alias: { mock: "some-alias" } },
		{ id: "some-id-2", alias: { other: "some-alias" } },
	]);

	const byId = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where(bundleIdOrAliasIs("some-id"))
		.execute();

	expect(byId).toStrictEqual([
		{ id: "some-id", alias: { mock: "some-alias" } },
	]);
});

test("combining with other query utilities should be possible", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	await project.db
		.insertInto("bundle")
		.values([
			{ id: "some-id", alias: { mock: "some-alias" } },
			{ id: "some-id-2", alias: { other: "some-alias" } },
			{ id: "some-id-3", alias: { other: "another-alias" } },
		])
		.execute();

	const bundles = await selectBundleNested(project.db)
		.where(bundleIdOrAliasIs("some-alias"))
		.execute();

	expect(bundles).toEqual([
		expect.objectContaining({
			id: "some-id",
			alias: { mock: "some-alias" },
		}),
		expect.objectContaining({
			id: "some-id-2",
			alias: { other: "some-alias" },
		}),
	]);
});