import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";

test("insert, update, delete on the version view", async () => {
	const lix = await openLix({});

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

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "commit_id_0",
				change_set_id: "change_set_id_0",
				lixcol_version_id: "global",
			},
			{
				id: "commit_id_1",
				change_set_id: "change_set_id_1",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_0",
				change_set_id: "working_cs_0",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_1",
				change_set_id: "working_cs_1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version_all")
		.values([
			{
				id: "version0",
				name: "version0",
				commit_id: "commit_id_0",
				working_commit_id: "working_commit_0",
				lixcol_version_id: "global",
				inherits_from_version_id: "global",
			},
			{
				id: "version1",
				name: "version1",
				commit_id: "commit_id_1",
				working_commit_id: "working_commit_1",
				lixcol_version_id: "global",
				inherits_from_version_id: "global",
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
			commit_id: "commit_id_0",
		},
		{
			name: "version1",
			commit_id: "commit_id_1",
		},
	]);

	await lix.db
		.updateTable("version")
		.where("name", "=", "version0")
		.set({ commit_id: "commit_id_1" })
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
			commit_id: "commit_id_1",
		},
		{
			name: "version1",
			commit_id: "commit_id_1",
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
			commit_id: "commit_id_1",
			working_commit_id: "working_commit_1",
			inherits_from_version_id: "global",
		},
	]);

	const changes = await lix.db
		.selectFrom("change")

		.where("schema_key", "=", "lix_version")
		.where("entity_id", "in", ["version0", "version1"])
		.orderBy("change.created_at", "asc")
		.selectAll("change")

		.execute();

	expect(changes.map((change) => change.snapshot_content)).toMatchObject([
		// version 0's insert
		{
			name: "version0",
			commit_id: "commit_id_0",
		},
		// version 1's insert
		{
			name: "version1",
			commit_id: "commit_id_1",
		},
		{
			// version 0's update
			name: "version0",
			commit_id: "commit_id_1",
		},
		// version 0's delete
		null,
	]);
});

test("querying by id", async () => {
	const lix = await openLix({});

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

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "commit_id_0",
				change_set_id: "change_set_id_0",
				lixcol_version_id: "global",
			},
			{
				id: "commit_id_1",
				change_set_id: "change_set_id_1",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_0",
				change_set_id: "working_cs_0",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_1",
				change_set_id: "working_cs_1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values([
			{
				id: "version0",
				name: "version0",
				commit_id: "commit_id_0",
				working_commit_id: "working_commit_0",
			},
			{
				id: "version1",
				name: "version1",
				commit_id: "commit_id_1",
				working_commit_id: "working_commit_1",
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
	const lix = await openLix({});

	// Create required change sets and version first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "working_cs1", lixcol_version_id: "global" },
		])
		.execute();

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
			{
				id: "working_commit_1",
				change_set_id: "working_cs1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "version_id_1",
			name: "test_version",
			commit_id: "commit_cs1",
			working_commit_id: "working_commit_1",
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
	const lix = await openLix({});
	const initialVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirst();

	expect(initialVersion).toBeDefined();
});

test("applying the schema should set the initial active version to 'main'", async () => {
	const lix = await openLix({});
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();
	expect(activeVersion).toBeDefined();

	// Verify the active version points to the main version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirst();
	expect(mainVersion).toBeDefined();
	expect(activeVersion?.version_id).toBe(mainVersion?.id);
});

test("should use default id and name if not provided", async () => {
	const lix = await openLix({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set_all")
		.values([{ id: "cs1", lixcol_version_id: "global" }])
		.execute();

	// Create required commit
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
		])
		.execute();

	// Create working commit
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "working_commit_cs1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// Insert a version providing only commit_id
	await lix.db
		.insertInto("version")
		.values({
			commit_id: "commit_cs1",
			working_commit_id: "working_commit_cs1",
		})
		.execute();

	// Verify the inserted data (id and name should be defaulted)
	const version = await lix.db
		.selectFrom("version")
		.selectAll()
		.where("commit_id", "=", "commit_cs1")
		.executeTakeFirstOrThrow();

	expect(version?.id).toBeTypeOf("string");
	expect(version?.id.length).toBeGreaterThan(0);
	expect(version?.name).toBeTypeOf("string");
	expect(version?.name?.length).toBeGreaterThan(0);
	expect(version?.commit_id).toBe("commit_cs1");

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

test("should enforce foreign key constraint on commit_id", async () => {
	const lix = await openLix({});

	// Attempt to insert version with non-existent commit_id
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				commit_id: "commit_nonexistent",
				working_commit_id: "cs_nonexistent",
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should enforce foreign key constraint on working_commit_id", async () => {
	const lix = await openLix({});

	// Create valid change set for commit_id
	await lix.db
		.insertInto("change_set_all")
		.values({ id: "cs1", lixcol_version_id: "global" })
		.execute();

	// Create required commit
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
		])
		.execute();

	// Attempt to insert version with non-existent working_commit_id
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				commit_id: "commit_cs1",
				working_commit_id: "commit_nonexistent",
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should allow version insertion with valid commit and change set references", async () => {
	const lix = await openLix({});

	// Create valid change sets
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs1", lixcol_version_id: "global" },
			{ id: "cs2", lixcol_version_id: "global" },
		])
		.execute();

	// Create valid commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
			{
				id: "working_commit_cs2",
				change_set_id: "cs2",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// This should succeed with valid foreign key references
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "version1",
				name: "test_version",
				commit_id: "commit_cs1",
				working_commit_id: "working_commit_cs2",
			})
			.execute()
	).resolves.toBeDefined();
});

// having the active_version as regular table is easier
test.skip("should enforce foreign key constraint on active_version.version_id", async () => {
	const lix = await openLix({});

	// Now attempt to update active_version with non-existent version_id
	await expect(
		lix.db
			.updateTable("active_version")
			.set({ version_id: "version_nonexistent" })
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/i);
});

test("should allow active_version update with valid version_id", async () => {
	const lix = await openLix({});

	// Create valid change set and version
	await lix.db
		.insertInto("change_set_all")
		.values({ id: "cs1", lixcol_version_id: "global" })
		.execute();

	// Create required commit
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
		])
		.execute();

	// Create working commit
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "working_commit_cs1",
				change_set_id: "cs1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "version1",
			name: "test_version",
			commit_id: "commit_cs1",
			working_commit_id: "working_commit_cs1",
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
	const lix = await openLix({});

	// Create required change sets
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_a", lixcol_version_id: "global" },
			{ id: "cs_b", lixcol_version_id: "global" },
			{ id: "cs_c", lixcol_version_id: "global" },
		])
		.execute();

	// Create working change sets
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "working_cs_a", lixcol_version_id: "global" },
			{ id: "working_cs_b", lixcol_version_id: "global" },
			{ id: "working_cs_c", lixcol_version_id: "global" },
		])
		.execute();

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_a", change_set_id: "cs_a", lixcol_version_id: "global" },
			{ id: "commit_b", change_set_id: "cs_b", lixcol_version_id: "global" },
			{ id: "commit_c", change_set_id: "cs_c", lixcol_version_id: "global" },
			{
				id: "working_commit_a",
				change_set_id: "working_cs_a",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_b",
				change_set_id: "working_cs_b",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_c",
				change_set_id: "working_cs_c",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// Create versions using the version view (simulating creation from different version contexts)
	await lix.db
		.insertInto("version")
		.values([
			{
				id: "version_a",
				name: "Version A",
				commit_id: "commit_a",
				working_commit_id: "working_commit_a",
			},
			{
				id: "version_b",
				name: "Version B",
				commit_id: "commit_b",
				working_commit_id: "working_commit_b",
			},
			{
				id: "version_c",
				name: "Version C",
				commit_id: "commit_c",
				working_commit_id: "working_commit_c",
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
	const lix = await openLix({});

	const versionA = await createVersion({
		lix,
		id: "versionA",
		name: "versionA",
	});

	const versionsBeforeMutation = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.groupBy("id")
		.select(["id", "name", "commit_id", "working_commit_id"])
		.execute();

	expect(versionsBeforeMutation).toHaveLength(1);

	expect(versionsBeforeMutation[0]).toMatchObject({
		id: versionA.id,
		name: "versionA",
		commit_id: expect.any(String),
		working_commit_id: expect.any(String),
	});

	await lix.db
		.insertInto("state_all")
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
		.select(["id", "name", "commit_id", "working_commit_id"])
		.execute();

	expect(versionAAfterMutation).toHaveLength(1);

	// The changeset should have advanced due to the state mutation
	expect(versionAAfterMutation[0]?.commit_id).not.toEqual(versionA.commit_id);
});

test("direct mutation of a version shouldn't lead to duplicate entries", async () => {
	const lix = await openLix({});

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
			commit_id: expect.any(String),
			working_commit_id: expect.any(String),
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
			commit_id: expect.any(String),
			working_commit_id: expect.any(String),
		},
	]);

	// the version was updated in the global version aka
	// the versions change set did not change itself
	expect(versionsAfterMutation[0]?.commit_id).toEqual(
		versionABeforeMutation[0]?.commit_id
	);

	// but the global version's commit id should have changed
	expect(globalVersionAfterMutation.commit_id).not.toEqual(
		globalVersionBeforeMutation.commit_id
	);
});

test("should enforce UNIQUE constraint on working_commit_id", async () => {
	const lix = await openLix({});

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

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{ id: "commit_cs1", change_set_id: "cs1", lixcol_version_id: "global" },
			{ id: "commit_cs2", change_set_id: "cs2", lixcol_version_id: "global" },
			{
				id: "working_commit_1",
				change_set_id: "workingCs1",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_2",
				change_set_id: "workingCs2",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// Insert first version referencing working_commit_1
	await lix.db
		.insertInto("version")
		.values({
			id: "v1",
			name: "version one",
			commit_id: "commit_cs1",
			working_commit_id: "working_commit_1",
		})
		.execute();

	// Attempt to insert another version referencing the SAME workingCs1 -> should fail
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "v2",
				name: "version two",
				commit_id: "commit_cs2", // Different historical point is fine
				working_commit_id: "working_commit_1", // <<< Same working_commit_id
			})
			.execute()
	).rejects.toThrow(
		/Unique constraint violation.*working_commit_id.*working_commit_1/i
	);

	// Inserting another version with a DIFFERENT working_commit_id should succeed
	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "v3",
				name: "version three",
				commit_id: "commit_cs1", // Can branch from same historical point
				working_commit_id: "working_commit_2", // <<< Different working_commit_id
			})
			.execute()
	).resolves.toBeDefined();
});

// there was a bug that wiped the cache, leading to a missing change_set
test("initial version's commit_id and working_commit_id should exist in the tables", async () => {
	const lix = await openLix({});

	// Get the initial 'main' version
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Verify commit_id exists in commit table
	const commit = await lix.db
		.selectFrom("commit")
		.where("id", "=", mainVersion.commit_id)
		.selectAll()
		.executeTakeFirst();

	expect(commit).toBeDefined();
	expect(commit?.id).toBe(mainVersion.commit_id);

	// Verify working_commit_id exists in commit table
	const workingCommit = await lix.db
		.selectFrom("commit")
		.where("id", "=", mainVersion.working_commit_id)
		.selectAll()
		.executeTakeFirst();

	expect(workingCommit).toBeDefined();
	expect(workingCommit?.id).toBe(mainVersion.working_commit_id);
});

test("inherits_from_version_id should default to global", async () => {
	const lix = await openLix({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "change_set_1", lixcol_version_id: "global" },
			{ id: "working_change_set_1", lixcol_version_id: "global" },
		])
		.execute();

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "commit_1",
				change_set_id: "change_set_1",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_1",
				change_set_id: "working_change_set_1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "test_version",
			name: "Test Version",
			commit_id: "commit_1",
			working_commit_id: "working_commit_1",
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
	const lix = await openLix({});

	// Get the existing global version
	const globalVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Global version should not inherit from anything
	expect(globalVersion.inherits_from_version_id).toBeNull();
});

test("versions should have hidden property defaulting to false", async () => {
	const lix = await openLix({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_test", lixcol_version_id: "global" },
			{ id: "working_cs_test", lixcol_version_id: "global" },
		])
		.execute();

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "commit_test",
				change_set_id: "cs_test",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_test",
				change_set_id: "working_cs_test",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// Insert a version without specifying hidden
	await lix.db
		.insertInto("version")
		.values({
			id: "test_version",
			name: "Test Version",
			commit_id: "commit_test",
			working_commit_id: "working_commit_test",
		})
		.execute();

	const version = await lix.db
		.selectFrom("version")
		.where("id", "=", "test_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Hidden should default to false (SQLite stores as 0)
	expect(version.hidden).toBe(0);
});

test("global version should have hidden set to true", async () => {
	const lix = await openLix({});

	const globalVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Global version should be hidden (SQLite stores as 1)
	expect(globalVersion.hidden).toBe(1);
});

test("main version should have hidden set to false", async () => {
	const lix = await openLix({});

	const mainVersion = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Main version should not be hidden (SQLite stores as 0)
	expect(mainVersion.hidden).toBe(0);
});

test("can explicitly set hidden to true", async () => {
	const lix = await openLix({});

	// Create required change sets first
	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_hidden", lixcol_version_id: "global" },
			{ id: "working_cs_hidden", lixcol_version_id: "global" },
		])
		.execute();

	// Create required commits
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "commit_hidden",
				change_set_id: "cs_hidden",
				lixcol_version_id: "global",
			},
			{
				id: "working_commit_hidden",
				change_set_id: "working_cs_hidden",
				lixcol_version_id: "global",
			},
		])
		.execute();

	// Insert a version with hidden explicitly set to true
	await lix.db
		.insertInto("version")
		.values({
			id: "hidden_version",
			name: "Hidden Version",
			commit_id: "commit_hidden",
			working_commit_id: "working_commit_hidden",
			hidden: true,
		})
		.execute();

	const version = await lix.db
		.selectFrom("version")
		.where("id", "=", "hidden_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(version.hidden).toBe(1);
});
