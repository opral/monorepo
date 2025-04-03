import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChange } from "./create-change.js";
import type { Change } from "../database/schema.js";
import { createAccount } from "../account/create-account.js";
import { createVersion } from "../version/create-version.js";
import { switchVersion } from "../version/switch-version.js";

test("should create a change with the correct values", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const author = await createAccount({
		lix,
		name: "author",
	});

	await switchVersion({ lix, to: version0 });

	const change = await createChange({
		lix,
		authors: [author],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "snapshot-content" },
		version: version0,
	});

	const changes = await lix.db
		.selectFrom("change")
		.where("change.id", "=", change.id)
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);
	expect(changes[0]?.entity_id).toBe("entity1");
	expect(changes[0]?.file_id).toBe("file1");
	expect(changes[0]?.plugin_key).toBe("plugin1");
	expect(changes[0]?.schema_key).toBe("schema1");
	expect(changes[0]?.snapshot_id).toBe(change.snapshot_id);
});

test("should create a snapshot with the correct content", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	await switchVersion({ lix, to: version0 });

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange({
		lix,
		authors: [author],
		version: version0,
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "snapshot-content" },
	});

	const snapshots = await lix.db
		.selectFrom("snapshot")
		.where("snapshot.id", "=", change.snapshot_id)
		.selectAll()
		.execute();

	expect(snapshots.length).toBe(1);
	expect(snapshots[0]?.content).toStrictEqual({ text: "snapshot-content" });
});

test("should create a change and a snapshot in a transaction", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	await switchVersion({ lix, to: version0 });

	const author = await createAccount({
		lix,
		name: "author",
	});

	let change: Change;

	await lix.db.transaction().execute(async (trx) => {
		change = await createChange({
			lix: { ...lix, db: trx },
			authors: [author],
			version: version0,
			entityId: "entity1",
			fileId: "file1",
			pluginKey: "plugin1",
			schemaKey: "schema1",
			snapshotContent: { text: "snapshot-content" },
		});
	});

	const changes = await lix.db
		.selectFrom("change")
		.where("change.id", "=", change!.id)
		.selectAll()
		.execute();

	const snapshots = await lix.db
		.selectFrom("snapshot")
		.where("snapshot.id", "=", change!.snapshot_id)
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);
	expect(snapshots.length).toBe(1);
	expect(changes[0]?.snapshot_id).toBe(snapshots[0]?.id);
});

test("should create the change authors", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	await switchVersion({ lix, to: version0 });

	const account1 = await createAccount({
		lix,
		name: "account1",
	});

	const account2 = await createAccount({
		lix,
		name: "account2",
	});

	await lix.db
		.insertInto("active_account")
		.values([account1, account2])
		.execute();

	const change = await createChange({
		lix,
		version: version0,
		authors: [account1, account2],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "snapshot-content" },
	});

	const changeAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", change.id)
		.selectAll()
		.execute();

	expect(changeAuthors.length).toBe(2);
	expect(changeAuthors).toMatchObject([
		{ change_id: change.id, account_id: account1.id },
		{ change_id: change.id, account_id: account2.id },
	]);
});

test("should correctly identify parentChange and create change_edge", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const author = await createAccount({
		lix,
		name: "author",
	});

	const parentChange = await createChange({
		lix,
		version: version0,
		authors: [author],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "parent-snapshot-content" },
	});

	const change = await createChange({
		lix,
		version: version0,
		authors: [author],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "child-snapshot-content" },
	});

	const changeEdges = await lix.db
		.selectFrom("change_edge")
		.where("change_edge.child_id", "=", change.id)
		.selectAll()
		.execute();

	expect(changeEdges.length).toBe(1);
	expect(changeEdges[0]?.parent_id).toBe(parentChange.id);
});

test("should update versionChanges with the new change", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange({
		lix,
		version: version0,
		authors: [author],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "snapshot-content" },
	});

	const versionChanges = await lix.db
		.selectFrom("version_change")
		.where("version_change.version_id", "=", version0.id)
		.selectAll()
		.execute();

	expect(versionChanges.length).toBe(1);
	expect(versionChanges[0]?.change_id).toBe(change.id);
});

test("should throw an error if authors array is empty", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	await expect(
		createChange({
			lix,
			authors: [],
			version: version0,
			entityId: "entity1",
			fileId: "file1",
			pluginKey: "plugin1",
			schemaKey: "schema1",
			snapshotContent: { text: "snapshot-content" },
		})
	).rejects.toThrow("At least one author is required");
});

test("option to create a change without updating the version changes", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange(
		{
			lix,
			version: version0,
			authors: [author],
			entityId: "entity1",
			fileId: "file1",
			pluginKey: "plugin1",
			schemaKey: "schema1",
			snapshotContent: { text: "snapshot-content" },
		},
		{
			updateVersionChanges: false,
		}
	);

	const versionChanges = await lix.db
		.selectFrom("version_change")
		.where("version_change.version_id", "=", version0.id)
		.selectAll()
		.execute();

	expect(
		versionChanges.find((vc) => vc.change_id === change.id)
	).toBeUndefined();
});

test("should add the change to the active version's change set", async () => {
	const lix = await openLixInMemory({});

	// Get the initial change set ID (should be 'cs0')
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.select("change_set_id")
		.executeTakeFirstOrThrow();
	const activeChangeSetId = activeVersion.change_set_id;

	const fileId = "test.txt";
	const entityId = "entity1";
	const schemaKey = "mySchema";

	// Create the first change
	const change1 = await createChange({
		lix,
		fileId,
		entityId,
		pluginKey: "testPlugin",
		schemaKey,
		snapshotContent: { key: "value1" },
		authors: [{ id: "user1" }], // Dummy author
		version: { id: "main" }, // Dummy version
	});

	// Verify the change was added to the active change set
	const element1 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeChangeSetId)
		.where("entity_id", "=", entityId)
		.where("file_id", "=", fileId)
		.where("schema_key", "=", schemaKey)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(element1.change_id).toBe(change1.id);
	expect(element1.entity_id).toBe(entityId);
	expect(element1.file_id).toBe(fileId);
	expect(element1.schema_key).toBe(schemaKey);

	// Create a second change for the same entity/file/schema
	const change2 = await createChange({
		lix,
		fileId,
		entityId,
		pluginKey: "testPlugin",
		schemaKey,
		snapshotContent: { key: "value2" },
		authors: [{ id: "user1" }], // Dummy author
		version: { id: "main" }, // Dummy version
	});

	// Verify the change_set_element was updated (ON CONFLICT)
	const element2 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeChangeSetId)
		.where("entity_id", "=", entityId)
		.where("file_id", "=", fileId)
		.where("schema_key", "=", schemaKey)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Check that the change_id now points to the second change
	expect(element2.change_id).toBe(change2.id);

	// Verify there's still only one entry for this combination in the active change set
	const count = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeChangeSetId)
		.where("entity_id", "=", entityId)
		.where("file_id", "=", fileId)
		.where("schema_key", "=", schemaKey)
		.select(lix.db.fn.count("change_id").as("c"))
		.executeTakeFirstOrThrow();

	expect(count.c).toBe(1);
});
