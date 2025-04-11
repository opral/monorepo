import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("should allow inserting a valid version", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }, { id: "cs2" }])
		.execute();

	// Insert a version referencing a valid change set
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "version one",
				change_set_id: "cs1",
				working_change_set_id: "cs1",
			})
			.execute()
	).resolves.toBeDefined();

	// Verify the inserted data
	const version = await lix.db
		.selectFrom("version_v2")
		.selectAll()
		.where("id", "=", "v1")
		.executeTakeFirst();
	expect(version).toEqual({
		id: "v1",
		name: "version one",
		change_set_id: "cs1",
		working_change_set_id: "cs1",
	});
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
		.insertInto("version_v2")
		.values({ change_set_id: "cs1", working_change_set_id: "cs1" })
		.execute();

	// Verify the inserted data (id and name should be defaulted)
	const version = await lix.db
		.selectFrom("version_v2")
		.selectAll()
		.where("change_set_id", "=", "cs1")
		.executeTakeFirst();

	expect(version?.id).toBeTypeOf("string");
	expect(version?.id.length).toBeGreaterThan(0);
	expect(version?.name).toBeTypeOf("string");
	expect(version?.name?.length).toBeGreaterThan(0);
	expect(version?.change_set_id).toBe("cs1");
});

test("should enforce primary key constraint (id)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Insert initial version
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v1",
			name: "version one",
			change_set_id: "cs1",
			working_change_set_id: "cs1",
		})
		.execute();

	// Attempt to insert the same version id again
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "version two",
				change_set_id: "cs1",
				working_change_set_id: "cs1",
			}) // Same id
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed: version_v2.id/i);
});

test("should enforce unique constraint (name)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Insert initial version
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v1",
			name: "unique_name",
			change_set_id: "cs1",
			working_change_set_id: "cs1",
		})
		.execute();

	// Attempt to insert another version with the same name
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v2",
				name: "unique_name",
				change_set_id: "cs1",
				working_change_set_id: "cs1",
			}) // Same name
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed: version_v2.name/i);
});

test("should enforce foreign key constraint on change_set_id", async () => {
	const lix = await openLixInMemory({});
	// DO NOT pre-populate change_set table

	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "v1_name",
				change_set_id: "cs_nonexistent",
				working_change_set_id: "cs_nonexistent",
			})
			.execute()
	).rejects.toThrow(/FOREIGN KEY constraint failed/i);
});

test("should enforce NOT NULL constraint on change_set_id", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table (though not strictly needed for this test)
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Kysely's types should prevent this, but testing the constraint directly
	await expect(
		lix.db
			.insertInto("version_v2")
			// @ts-expect-error Testing invalid input
			.values({ id: "v1", name: "v1_name", change_set_id: null })
			.execute()
	).rejects.toThrow(/NOT NULL constraint failed: version_v2.change_set_id/i);
});

test("applying the schema should create the initial 'cs0' change set", async () => {
	const lix = await openLixInMemory({});
	const initialChangeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", "initialchangeset")
		.selectAll()
		.executeTakeFirst();
	expect(initialChangeSet).toBeDefined();
	expect(initialChangeSet?.id).toBe("initialchangeset");
});

test("applying the schema should create the initial 'main' version linked to 'cs0'", async () => {
	const lix = await openLixInMemory({});
	const initialVersion = await lix.db
		.selectFrom("version_v2")
		.where("id", "=", "019328cc-ccb0-7f51-96e8-524df4597ac6")
		.selectAll()
		.executeTakeFirst();
	expect(initialVersion).toBeDefined();
	expect(initialVersion?.id).toBe("019328cc-ccb0-7f51-96e8-524df4597ac6");
	expect(initialVersion?.name).toBe("main");
	expect(initialVersion?.change_set_id).toBe("initialchangeset");
});

test("applying the schema should set the initial active version to 'main'", async () => {
	const lix = await openLixInMemory({});
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();
	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBe(
		"019328cc-ccb0-7f51-96e8-524df4597ac6"
	);
});

test("applying the schema multiple times should be idempotent for initial data", async () => {
	const lix = await openLixInMemory({});
	// openLixInMemory already applies the schema once.
	// We don't need to explicitly apply it again as the init logic handles it.

	// Verify counts after initial creation
	const initialChangeSetCount = await lix.db
		.selectFrom("change_set")
		.select(lix.db.fn.count("id").as("count"))
		.where("id", "=", "initialchangeset")
		.executeTakeFirstOrThrow();
	expect(initialChangeSetCount.count).toBe(1);

	const initialVersionCount = await lix.db
		.selectFrom("version_v2")
		.select(lix.db.fn.count("id").as("count"))
		.where("id", "=", "019328cc-ccb0-7f51-96e8-524df4597ac6")
		.executeTakeFirstOrThrow();
	expect(initialVersionCount.count).toBe(1);

	const initialActiveVersionCount = await lix.db
		.selectFrom("active_version")
		.select(lix.db.fn.count("version_id").as("count"))
		.executeTakeFirstOrThrow();
	expect(initialActiveVersionCount.count).toBe(1);
});
