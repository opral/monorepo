import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";
import { changeIsLeafInVersion } from "./change-is-leaf-in-version.js";
import { createVersion } from "../version/create-version.js";

test("it should return the leaf change for the given version", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });
	const version1 = await createVersion({ lix, name: "version1" });

	const insertedChanges = await lix.db
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
			{
				id: "change3",
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
		.values([
			// including change1 for re-assurance
			{ parent_id: "change1", child_id: "change2" },
			{ parent_id: "change2", child_id: "change3" },
		])
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		// only point to the second change even though
		// the third change is a child of the second change
		changes: [insertedChanges[1]!],
	});

	// letting another version (version1) point to the third change
	await updateChangesInVersion({
		lix,
		version: version1,
		changes: [insertedChanges[2]!],
	});

	const changes = await lix.db
		.selectFrom("change")
		.where(changeIsLeafInVersion(version0))
		.selectAll()
		.execute();

	// change 2 is the leaf change for the current version
	expect(changes).toHaveLength(1);
	expect(changes[0]?.id).toBe("change2");
});
