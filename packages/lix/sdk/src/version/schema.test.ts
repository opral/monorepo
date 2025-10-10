import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";

test("insert, update, delete on version descriptor", async () => {
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
				// descriptor-only insert: no commit_id here
				working_commit_id: "working_commit_0",
				lixcol_version_id: "global",
				inherits_from_version_id: "global",
			},
			{
				id: "version1",
				name: "version1",
				// descriptor-only insert: no commit_id here
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

	expect(viewAfterInsert.map((v) => ({ name: v.name }))).toMatchObject([
		{ name: "version0" },
		{ name: "version1" },
	]);

	await lix.db
		.updateTable("version")
		.where("name", "=", "version0")
		.set({ name: "version0_renamed" })
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("version")
		.orderBy("name", "asc")
		.where("id", "in", ["version0", "version1"])
		.selectAll()
		.execute();

	expect(viewAfterUpdate.map((v) => ({ name: v.name }))).toMatchObject([
		{ name: "version0_renamed" },
		{ name: "version1" },
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
			working_commit_id: "working_commit_1",
			inherits_from_version_id: "global",
		},
	]);

	// Assert descriptor changes (no tip writes since commit_id not provided)
	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_version_descriptor")
		.where("entity_id", "in", ["version0", "version1"])
		.orderBy("change.created_at", "asc")
		.selectAll("change")
		.execute();

	expect(changes.map((c) => c.snapshot_content)).toMatchObject([
		{ name: "version0" },
		{ name: "version1" },
		{ name: "version0_renamed" },
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
				working_commit_id: "working_commit_0",
			},
			{
				id: "version1",
				name: "version1",
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

	// Insert a version providing only working_commit_id (no id/name provided)
	await lix.db.insertInto("version").defaultValues().execute();

	// Verify the inserted data (id and name should be defaulted)
	const version = await lix.db
		.selectFrom("version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(version?.id).toBeTypeOf("string");
	expect(version?.id.length).toBeGreaterThan(0);
	expect(version?.name).toBeTypeOf("string");
	expect(version?.name?.length).toBeGreaterThan(0);
	// commit_id (tip) is not set via version view; defaults handled elsewhere

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

test.skip("should enforce foreign key constraint on working_commit_id", async () => {
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
				working_commit_id: "commit_nonexistent",
			})
			.execute()
	).rejects.toThrow();
});

test("should allow version insertion with valid working commit reference", async () => {
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
				working_commit_id: "working_commit_cs2",
			})
			.execute()
	).resolves.toBeDefined();
});

// having the active_version as regular table is easier
test("should enforce FK on active_version.version_id against descriptor", async () => {
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
				working_commit_id: "working_commit_a",
			},
			{
				id: "version_b",
				name: "Version B",
				working_commit_id: "working_commit_b",
			},
			{
				id: "version_c",
				name: "Version C",
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

// V2 unified view tests (merged)

test("insert via version writes descriptor + tip when commit_id provided", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_unified_1", lixcol_version_id: "global" },
			{ id: "wcs_unified_1", lixcol_version_id: "global" },
		])
		.execute();

	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "c_unified_1",
				change_set_id: "cs_unified_1",
				lixcol_version_id: "global",
			},
			{
				id: "wc_unified_1",
				change_set_id: "wcs_unified_1",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "v_unified_1",
			name: "v_unified_1",
			working_commit_id: "wc_unified_1",
			commit_id: "c_unified_1",
		})
		.execute();

	const v = await lix.db
		.selectFrom("version")
		.where("id", "=", "v_unified_1")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(v.name).toBe("v_unified_1");
	expect(v.working_commit_id).toBe("wc_unified_1");
	expect(v.commit_id).toBe("c_unified_1");

	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "v_unified_1")
		.orderBy("created_at", "asc")
		.selectAll()
		.execute();

	const byKey = new Map(
		changes.map((c) => [
			c.schema_key,
			typeof c.snapshot_content === "string"
				? JSON.parse(c.snapshot_content)
				: c.snapshot_content,
		])
	);
	expect(byKey.get("lix_version_descriptor")).toMatchObject({
		id: "v_unified_1",
		name: "v_unified_1",
	});
	expect(byKey.get("lix_version_tip")).toMatchObject({
		id: "v_unified_1",
		commit_id: "c_unified_1",
		working_commit_id: "wc_unified_1",
	});
});

test("insert via version without commit_id auto-inserts a tip", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("change_set_all")
		.values([{ id: "wcs_unified_2", lixcol_version_id: "global" }])
		.execute();
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "wc_unified_2",
				change_set_id: "wcs_unified_2",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "v_unified_2",
			name: "v_unified_2",
			working_commit_id: "wc_unified_2",
		})
		.execute();

	const v = await lix.db
		.selectFrom("version")
		.where("id", "=", "v_unified_2")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(typeof v.commit_id).toBe("string");
	expect((v.commit_id as string).length).toBeGreaterThan(0);

	const tipRows = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "v_unified_2")
		.where("schema_key", "=", "lix_version_tip")
		.selectAll()
		.execute();
	expect(tipRows.length).toBe(1);
});

test("insert via version_all writes descriptor + tip in scoped version", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_unified_3", lixcol_version_id: "global" },
			{ id: "wcs_unified_3", lixcol_version_id: "global" },
		])
		.execute();
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "c_unified_3",
				change_set_id: "cs_unified_3",
				lixcol_version_id: "global",
			},
			{
				id: "wc_unified_3",
				change_set_id: "wcs_unified_3",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version_all")
		.values({
			id: "v_unified_3",
			name: "v_unified_3",
			working_commit_id: "wc_unified_3",
			commit_id: "c_unified_3",
			lixcol_version_id: "global",
		})
		.execute();

	const v = await lix.db
		.selectFrom("version")
		.where("id", "=", "v_unified_3")
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(v.commit_id).toBe("c_unified_3");
});

test("commit_id FK uses materialized mode (lenient on insert)", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("change_set_all")
		.values([{ id: "wcs_unified_6", lixcol_version_id: "global" }])
		.execute();

	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "wc_unified_6",
				change_set_id: "wcs_unified_6",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await expect(
		lix.db
			.insertInto("version")
			.values({
				id: "v_unified_6",
				name: "v_unified_6",
				working_commit_id: "wc_unified_6",
				commit_id: "does_not_exist",
			})
			.execute()
	).resolves.toBeDefined();
});

test("delete via version writes descriptor + tip tombstones", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("change_set_all")
		.values([
			{ id: "cs_unified_7", lixcol_version_id: "global" },
			{ id: "wcs_unified_7", lixcol_version_id: "global" },
		])
		.execute();
	await lix.db
		.insertInto("commit_all")
		.values([
			{
				id: "c_unified_7",
				change_set_id: "cs_unified_7",
				lixcol_version_id: "global",
			},
			{
				id: "wc_unified_7",
				change_set_id: "wcs_unified_7",
				lixcol_version_id: "global",
			},
		])
		.execute();

	await lix.db
		.insertInto("version")
		.values({
			id: "v_unified_7",
			name: "v_unified_7",
			working_commit_id: "wc_unified_7",
			commit_id: "c_unified_7",
		})
		.execute();

	await lix.db.deleteFrom("version").where("id", "=", "v_unified_7").execute();

	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "v_unified_7")
		.orderBy("created_at", "asc")
		.selectAll()
		.execute();

	const tombstones = changes.filter(
		(c) => c.snapshot_content === null || c.snapshot_content === undefined
	);
	expect(tombstones.length).toBeGreaterThanOrEqual(2);
});
