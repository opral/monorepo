import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { changeInVersion } from "./change-in-version.js";
import { createVersion } from "../version/create-version.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

test("select changeInVersion should retrieve all changes in the version including ancestors", async () => {
	const lix = await openLixInMemory({});

	const version = await createVersion({ lix });

	// Insert changes and create a parent-child chain in change_edge
	const [, , changeC] = await lix.db
		.insertInto("change")
		.values([
			{
				id: "changeA",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeB",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeC",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
			{
				id: "changeD",
				entity_id: "entity1",
				schema_key: "type1",
				file_id: "file1",
				plugin_key: "plugin1",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Link changes in change_edge (C <- B <- A)
	await lix.db
		.insertInto("change_edge")
		.values([
			{ parent_id: "changeA", child_id: "changeB" },
			{ parent_id: "changeB", child_id: "changeC" },
		])
		.execute();

	// Point the version to changeC, which should include changeA and changeB as ancestors
	await updateChangesInVersion({
		lix,
		version,
		changes: [changeC!],
	});

	const changes = await lix.db
		.selectFrom("change")
		.where(changeInVersion(version))
		.selectAll()
		.execute();

	// Verify the returned changes include changeC and its ancestors changeA and changeB
	const changeIds = changes.map((change) => change.id);

	// change D is not pointed at in th version, so it should not be included
	expect(changes).toHaveLength(3);
	expect(changeIds).toContain("changeA");
	expect(changeIds).toContain("changeB");
	expect(changeIds).toContain("changeC");
});
