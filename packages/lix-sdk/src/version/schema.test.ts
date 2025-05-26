import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { INITIAL_VERSION_ID } from "./schema.js";
import { createVersion } from "./create-version.js";

test("insert, update, delete on the version view", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "change_set_id_0" },
			{ id: "change_set_id_1" },
			{ id: "working_cs_0" },
			{ id: "working_cs_1" },
		])
		.execute();

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

	// Create required change sets first
	await lix.db
		.insertInto("change_set")
		.values([
			{ id: "change_set_id_0" },
			{ id: "change_set_id_1" },
			{ id: "working_cs_0" },
			{ id: "working_cs_1" },
		])
		.execute();

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

test("update, delete on the active version view", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets and version first
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "version_id_1",
			name: "test_version",
			change_set_id: "cs1",
			working_change_set_id: "cs1",
		})
		.execute();

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
	expect(activeVersion?.version_id).toBe(INITIAL_VERSION_ID);
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

test("should enforce foreign key constraint on change_set_id", async () => {
	const lix = await openLixInMemory({});

	// Attempt to insert version with non-existent change_set_id
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				change_set_id: "cs_nonexistent",
				working_change_set_id: "cs_nonexistent",
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should enforce foreign key constraint on working_change_set_id", async () => {
	const lix = await openLixInMemory({});

	// Create valid change set for change_set_id
	await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

	// Attempt to insert version with non-existent working_change_set_id
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				change_set_id: "cs1",
				working_change_set_id: "cs_nonexistent",
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should allow version insertion with valid change set references", async () => {
	const lix = await openLixInMemory({});

	// Create valid change sets
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }, { id: "cs2" }])
		.execute();

	// This should succeed with valid foreign key references
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				change_set_id: "cs1",
				working_change_set_id: "cs2",
			})
			.execute()
	).resolves.toBeDefined();
});

test("should enforce foreign key constraint on active_version.version_id", async () => {
	const lix = await openLixInMemory({});

	// Now attempt to update active_version with non-existent version_id
	await expect(
		lix.db
			.updateTable("active_version")
			.set({ version_id: "version_nonexistent" })
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should allow active_version update with valid version_id", async () => {
	const lix = await openLixInMemory({});

	// Create valid change set and version
	await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();
	await lix.db
		.insertInto("version")
		.values({
			id: "version1",
			name: "test_version",
			change_set_id: "cs1",
			working_change_set_id: "cs1",
		})
		.execute();

	// This should succeed with valid foreign key reference
	await expect(
		lix.db
			.updateTable("active_version")
			.set({ version_id: "version1" })
			.execute()
	).resolves.toBeDefined();
});

test("versions should be globally accessible regardless of version context", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs_a" }, { id: "cs_b" }, { id: "cs_c" }])
		.execute();

	// Create versions using the version view (simulating creation from different version contexts)
	await lix.db
		.insertInto("version")
		.values([
			{
				id: "version_a",
				name: "Version A",
				change_set_id: "cs_a",
				working_change_set_id: "cs_a",
			},
			{
				id: "version_b",
				name: "Version B",
				change_set_id: "cs_b",
				working_change_set_id: "cs_b",
			},
			{
				id: "version_c",
				name: "Version C",
				change_set_id: "cs_c",
				working_change_set_id: "cs_c",
			},
		])
		.execute();

	// Query all versions globally (without version_id filtering)
	const allVersions = await lix.db
		.selectFrom("version")
		.selectAll()
		.orderBy("name", "asc")
		.execute();

	// Should include main version (created automatically) + our 3 created versions
	expect(allVersions).toHaveLength(4);

	const versionNames = allVersions.map((v) => v.name);
	expect(versionNames).toContain("main");
	expect(versionNames).toContain("Version A");
	expect(versionNames).toContain("Version B");
	expect(versionNames).toContain("Version C");
});

test("mutation of a version's state should NOT lead to duplicate version entries", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({
		lix,
		id: "versionA",
		name: "versionA",
	});

	const versionsBeforeMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.execute();

	expect(versionsBeforeMutation).toMatchObject([
		{
			id: versionA.id,
			name: "versionA",
			change_set_id: expect.any(String),
			working_change_set_id: expect.any(String),
		},
	]);

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "test_entity",
			version_id: versionA.id,
			snapshot_content: { foo: "bar" },
			schema_key: "test_schema",
			file_id: "test_file",
			plugin_key: "test_plugin",
			schema_version: "1.0",
		})
		.execute();

	const versionsAfterMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.execute();

	// With global version architecture, should only see one version record (in global context)
	expect(versionsAfterMutation).toHaveLength(1);
	expect(versionsAfterMutation[0]).toMatchObject({
		id: versionA.id,
		name: "versionA",
		version_id: "global",
		change_set_id: expect.any(String),
		working_change_set_id: expect.any(String),
	});

	// The changeset should have advanced due to the state mutation
	expect(versionsAfterMutation[0]?.change_set_id).not.toEqual(
		versionA.change_set_id
	);
});

test("direct mutation of a version shouldn't lead to duplicate entries", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({
		lix,
		id: "versionA",
		name: "versionA",
	});

	const versionABeforeMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.execute();

	const globalVersionBeforeMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(versionABeforeMutation).toMatchObject([
		{
			id: versionA.id,
			name: "versionA",
			version_id: "global",
			change_set_id: expect.any(String),
			working_change_set_id: expect.any(String),
		},
	]);

	await lix.db
		.updateTable("version")
		.where("id", "=", versionA.id)
		.set({
			name: "new name",
		})
		.execute();

	const versionsAfterMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.execute();

	const globalVersionAfterMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(versionsAfterMutation).toMatchObject([
		{
			id: versionA.id,
			version_id: "global",
			name: "new name",
			change_set_id: expect.any(String),
			working_change_set_id: expect.any(String),
		},
	]);

	// the version was updated in the global version aka
	// the versions change set did not change itself
	expect(versionsAfterMutation[0]?.change_set_id).toEqual(
		versionABeforeMutation[0]?.change_set_id
	);

	// but the global version's change set id should have changed
	expect(globalVersionAfterMutation.change_set_id).not.toEqual(
		globalVersionBeforeMutation.change_set_id
	);
});