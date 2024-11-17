import { test, expect } from "vitest";
import { changeIsLeaf } from "./change-is-leaf.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";
import { changeInVersion } from "./change-in-version.js";

test("should only return the leaf change", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "no-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
			{
				id: "change2",
				snapshot_id: "no-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
			{
				id: "change3",
				snapshot_id: "no-content",
				entity_id: "mock2",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
		])
		.execute();

	await lix.db
		.insertInto("change_edge")
		.values([{ parent_id: "change2", child_id: "change3" }])
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeaf())
		.selectAll()
		.execute();

	expect(changes).toHaveLength(2);
	expect(changes.map((c) => c.id)).toEqual(["change1", "change3"]);
});

test("should return the change even if it's the only one", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change1",
				snapshot_id: "no-content",
				entity_id: "mock1",
				file_id: "mock",
				plugin_key: "mock",
				schema_key: "mock",
			},
		])
		.execute();

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeaf())
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes.map((c) => c.id)).toEqual(["change1"]);
});

// needs sql debugging why the query is not working as expected
test.todo(
	"it should work in combination with the `changeInVersion()` filter",
	async () => {
		const lix = await openLixInMemory({});

		const changes = await lix.db
			.insertInto("change")
			.values([
				{
					id: "change1",
					snapshot_id: "no-content",
					entity_id: "mock1",
					file_id: "mock",
					plugin_key: "mock",
					schema_key: "mock",
				},
				{
					id: "change2",
					snapshot_id: "no-content",
					entity_id: "mock1",
					file_id: "mock",
					plugin_key: "mock",
					schema_key: "mock",
				},
			])
			.returningAll()
			.execute();

		await lix.db
			.insertInto("change_edge")
			.values([{ parent_id: "change1", child_id: "change2" }])
			.execute();

		const currentVersion = await lix.db
			.selectFrom("current_version")
			.innerJoin("version", "version.id", "current_version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		// let the version point only to the first change
		await updateChangesInVersion({
			lix,
			changes: [changes[0]!],
			version: currentVersion,
		});

		const result = await lix.db
			.selectFrom("change")
			.where(changeIsLeaf())
			.where(changeInVersion(currentVersion))
			.selectAll()
			.execute();

		// expecting the leaf change in the current version to be change 1
		expect(result).toHaveLength(1);
		expect(result.map((c) => c.id)).toEqual(["change1"]);
	},
);
