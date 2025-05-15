import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("insert, update, delete on the version view", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("version")
		.values([
			{
				id: "version0",
				name: "version0",
				change_set_id: "change_set_id_0",
				working_change_set_id: "working_cs_0",
			},
			{
				id: "version1",
				name: "version1",
				change_set_id: "change_set_id_1",
				working_change_set_id: "working_cs_1",
			},
		])
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("version")
		.orderBy("name", "asc")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			name: "version0",
			change_set_id: "change_set_id_0",
		},
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	await lix.db
		.updateTable("version")
		.where("name", "=", "version0")
		.set({ change_set_id: "change_set_id_1" })
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("version")
		.orderBy("name", "asc")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			name: "version0",
			change_set_id: "change_set_id_1",
		},
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	await lix.db.deleteFrom("version").where("name", "=", "version0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("version")
		.orderBy("name", "asc")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	expect(viewAfterDelete).toMatchObject([
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
	]);

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_version")
		.where("entity_id", "in", ["version0", "version1"])
		.orderBy("change.created_at", "asc")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes.map((change) => change.content)).toMatchObject([
		// version 0's insert
		{
			name: "version0",
			change_set_id: "change_set_id_0",
		},
		// version 0's insert
		{
			name: "version1",
			change_set_id: "change_set_id_1",
		},
		{
			// version 0's update
			name: "version0",
			change_set_id: "change_set_id_1",
		},
		// version 0's delete
		null,
	]);
});

test("querying by id", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("version")
		.values([
			{
				id: "version0",
				name: "version0",
				change_set_id: "change_set_id_0",
				working_change_set_id: "working_cs_0",
			},
			{
				id: "version1",
				name: "version1",
				change_set_id: "change_set_id_1",
				working_change_set_id: "working_cs_1",
			},
		])
		.execute();

	const versions = await lix.db
		.selectFrom("version")
		.where("id", "=", "version0")
		.select("id")
		.execute();

	expect(versions).toHaveLength(1);
	expect(versions[0]?.id).toBe("version0");
});

test("insert, update, delete on the active version view", async () => {
	const lix = await openLixInMemory({});

	// deleting the active version which is filled in by default
	await lix.db.deleteFrom("active_version").execute();

	await lix.db
		.insertInto("active_version")
		.values({ version_id: "version_id_0" })
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			version_id: "version_id_0",
		},
	]);

	await lix.db
		.updateTable("active_version")
		.set({ version_id: "version_id_1" })
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			version_id: "version_id_1",
		},
	]);

	await lix.db.deleteFrom("active_version").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});

test("applying the schema should create an initial 'main' version", async () => {
	const lix = await openLixInMemory({});
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirst();

	expect(initialVersion).toBeDefined();
});

test("applying the schema should set the initial active version to 'main'", async () => {
	const lix = await openLixInMemory({});
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();
	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBe("BoIaHTW9ePX6pNc8");
});

test("should use default id and name if not provided", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Insert a version providing only change_set_id
	await lix.db
		.insertInto("version")
		.values({ change_set_id: "cs1", working_change_set_id: "cs1" })
		.execute();

	// Verify the inserted data (id and name should be defaulted)
	const version = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("change_set_id", "=", "cs1")
		.executeTakeFirstOrThrow();

	expect(version?.id).toBeTypeOf("string");
	expect(version?.id.length).toBeGreaterThan(0);
	expect(version?.name).toBeTypeOf("string");
	expect(version?.name?.length).toBeGreaterThan(0);
	expect(version?.change_set_id).toBe("cs1");

	await lix.db
		.updateTable("version")
		.where("id", "=", version.id)
		.set({
			name: "new_name",
		})
		.executeTakeFirstOrThrow();

	const updatedVersion = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("id", "=", version.id)
		.executeTakeFirstOrThrow();

	expect(updatedVersion?.name).toBe("new_name");
});
