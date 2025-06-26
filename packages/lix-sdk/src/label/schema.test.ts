import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("creates checkpoint label on boot up", async () => {
	const lix = await openLixInMemory({});

	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.selectAll()
		.executeTakeFirst();

	expect(checkpointLabel).toBeDefined();
	expect(checkpointLabel?.name).toBe("checkpoint");
	expect(checkpointLabel?.id).toBeDefined();
});

test("insert, update, delete on the label view", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("label")
		.values({ id: "label1", name: "bug" })
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("label")
		.where("id", "=", "label1")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			id: "label1",
			name: "bug",
		},
	]);

	await lix.db
		.updateTable("label")
		.where("id", "=", "label1")
		.set({ name: "feature" })
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("label")
		.where("id", "=", "label1")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			id: "label1",
			name: "feature",
		},
	]);

	await lix.db.deleteFrom("label").where("id", "=", "label1").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("label")
		.where("id", "=", "label1")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toEqual([]);

	const changes = await lix.db
		.selectFrom("change")
		
		.where("schema_key", "=", "lix_label")
		.where("entity_id", "=", "label1")
		.orderBy("change.created_at", "asc")
		.selectAll("change")
		
		.execute();

	expect(changes.map((change) => change.snapshot_content)).toMatchObject([
		// insert
		{
			id: "label1",
			name: "bug",
		},
		// update
		{
			id: "label1",
			name: "feature",
		},
		// delete
		null,
	]);
});
