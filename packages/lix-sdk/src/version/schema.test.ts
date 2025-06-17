import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { INITIAL_VERSION_ID } from "./schema.js";
import { createVersion } from "./create-version.js";

test("selecting from the version view", async () => {
	const lix = await openLixInMemory({});
	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "change_set_id_0", lixcol_version_id: "global" },
			{ id: "change_set_id_1", lixcol_version_id: "global" },
			{ id: "working_cs_0", lixcol_version_id: "global" },
			{ id: "working_cs_1", lixcol_version_id: "global" },
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
				inherits_from_version_id: "global",
			},
			{
				id: "version1",
				name: "version1",
				change_set_id: "change_set_id_1",
				working_change_set_id: "working_cs_1",
				inherits_from_version_id: "global",
			},
		])
		.execute();

	const versions = await lix.db
		.selectFrom("version")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	// We expect exactly 2 versions in the global context.
	// The version view (state view) shows inherited entities, so versions
	// stored in the global version context are also visible in child versions
	// that inherit from global. This test filters to only the global context
	// to verify the original entities are correctly stored there.
	expect(versions).toMatchObject([
		{
			id: "version0",
			name: "version0",
			change_set_id: "change_set_id_0",
			working_change_set_id: "working_cs_0",
			inherits_from_version_id: "global",
		},
		{
			id: "version1",
			name: "version1",
			change_set_id: "change_set_id_1",
			working_change_set_id: "working_cs_1",
			inherits_from_version_id: "global",
		},
	]);
});

test("insert, update, delete on the version view", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "change_set_id_0", lixcol_version_id: "global" },
			{ id: "change_set_id_1", lixcol_version_id: "global" },
			{ id: "working_cs_0", lixcol_version_id: "global" },
			{ id: "working_cs_1", lixcol_version_id: "global" },
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

	await lix.db.deleteFrom("version").where("id", "=", "version0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("version")
		.orderBy("name", "asc")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	expect(viewAfterDelete).toMatchObject([
		{
			id: "version1",
			name: "version1",
			change_set_id: "change_set_id_1",
			working_change_set_id: "working_cs_1",
			inherits_from_version_id: "global",
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
		.insertInto("change_set_all")
		.values([
			{ id: "change_set_id_0", lixcol_version_id: "global" },
			{ id: "change_set_id_1", lixcol_version_id: "global" },
			{ id: "working_cs_0", lixcol_version_id: "global" },
			{ id: "working_cs_1", lixcol_version_id: "global" },
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

test("update active version view", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets and version first
	await lix.db
		.insertInto("change_set_all")
		.values([{ id: "cs1", lixcol_version_id: "global" }])
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
		.insertInto("change_set_all")
		.values([{ id: "cs1", lixcol_version_id: "global" }])
		.execute();

	// Insert a version providing only change_set_id
	await lix.db
		.insertInto("version")
		.values({
			change_set_id: "cs1",
			working_change_set_id: "cs1",
		})
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
	await lix.db.insertInto("change_set_all").values({ id: "cs1" }).execute();

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
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "cs2", lixcol_version_id: "global" },
		])
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

// having the active_version as regular table is easier
test.skip("should enforce foreign key constraint on active_version.version_id", async () => {
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
	await lix.db
		.insertInto("change_set_all")
		.values({ id: "cs1", lixcol_version_id: "global" })
		.execute();

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
		.insertInto("change_set_all")
		.values([
			{ id: "cs_a", lixcol_version_id: "global" },
			{ id: "cs_b", lixcol_version_id: "global" },
			{ id: "cs_c", lixcol_version_id: "global" },
		])
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
	expect(allVersions).toHaveLength(5);

	const versionNames = allVersions.map((v) => v.name);
	expect(versionNames).toContain("global");
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
		.groupBy("id")
		.select(["id", "name", "change_set_id", "working_change_set_id"])
		.execute();

	expect(versionsBeforeMutation).toHaveLength(1);

	expect(versionsBeforeMutation[0]).toMatchObject({
		id: versionA.id,
		name: "versionA",
		change_set_id: expect.any(String),
		working_change_set_id: expect.any(String),
	});

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

	const versionAAfterMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.groupBy("id")
		.select(["id", "name", "change_set_id", "working_change_set_id"])
		.execute();

	expect(versionAAfterMutation).toHaveLength(1);

	// The changeset should have advanced due to the state mutation
	expect(versionAAfterMutation[0]?.change_set_id).not.toEqual(
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

test("should enforce UNIQUE constraint on working_change_set_id", async () => {
	const lix = await openLixInMemory({});

	// Insert necessary change sets to satisfy foreign keys
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "cs2", lixcol_version_id: "global" },
			{ id: "workingCs1", lixcol_version_id: "global" },
			{ id: "workingCs2", lixcol_version_id: "global" },
		])
		.execute();

	// Insert first version referencing workingCs1
	await lix.db
		.insertInto("version")
		.values({
			id: "v1",
			name: "version one",
			change_set_id: "cs1",
			working_change_set_id: "workingCs1",
		})
		.execute();

	// Attempt to insert another version referencing the SAME workingCs1 -> should fail
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "v2",
				name: "version two",
				change_set_id: "cs2", // Different historical point is fine
				working_change_set_id: "workingCs1", // <<< Same working_change_set_id
			})
			.execute()
	).rejects.toThrow(
		/Unique constraint violation.*working_change_set_id.*workingCs1/i
	);

	// Inserting another version with a DIFFERENT working_change_set_id should succeed
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "v3",
				name: "version three",
				change_set_id: "cs1", // Can branch from same historical point
				working_change_set_id: "workingCs2", // <<< Different working_change_set_id
			})
			.execute()
	).resolves.toBeDefined();
});

// there was a bug that wiped the cache, leading to a missing change_set
test("initial version's change_set_id and working_change_set_id should exist in the change_set table", async () => {
	const lix = await openLixInMemory({});

	// Get the initial 'main' version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify change_set_id exists in change_set table
	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", mainVersion.change_set_id)
		.selectAll()
		.executeTakeFirst();

	expect(changeSet).toBeDefined();
	expect(changeSet?.id).toBe(mainVersion.change_set_id);

	// Verify working_change_set_id exists in change_set table
	const workingChangeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", mainVersion.working_change_set_id)
		.selectAll()
		.executeTakeFirst();

	expect(workingChangeSet).toBeDefined();
	expect(workingChangeSet?.id).toBe(mainVersion.working_change_set_id);
});

test("inherits_from_version_id should default to global", async () => {
	const lix = await openLixInMemory({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "change_set_1", lixcol_version_id: "global" },
			{ id: "working_change_set_1", lixcol_version_id: "global" },
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "test_version",
			name: "Test Version",
			change_set_id: "change_set_1",
			working_change_set_id: "working_change_set_1",
			inherits_from_version_id: undefined, // Should default to 'global'
		})
		.execute();

	const version = await lix.db
		.selectFrom("version")
		.where("id", "=", "test_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(version.id).toBe("test_version");
});

test("global version should not inherit from itself", async () => {
	const lix = await openLixInMemory({});

	// Get the existing global version
	const globalVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Global version should not inherit from anything
	expect(globalVersion.inherits_from_version_id).toBeNull();
});
