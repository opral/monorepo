import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "../account/create-account.js";
import { createChange } from "../change/create-change.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import { withSkipOwnChangeControl } from "./with-skip-own-change-control.js";
import { createThread } from "../thread/create-thread.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { changeControlledTableIds } from "./change-controlled-tables.js";
import { LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID } from "./database-triggers.js";

test("it works for inserts, updates and deletions", async () => {
	const lix = await openLixInMemory({});

	// insert
	await lix.db
		.insertInto("key_value")
		.values({ key: "key1", value: "value1" })
		.execute();

	// update
	await lix.db
		.updateTable("key_value")
		.set({ value: "value2" })
		.where("key", "=", "key1")
		.execute();

	// delete
	await lix.db.deleteFrom("key_value").where("key", "=", "key1").execute();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_key_value_table")
		.selectAll()
		.execute();

	const snapshots = changes.map((change) => change.content);

	expect(changes.length).toBe(3);

	for (const change of changes) {
		expect(change.entity_id).toBe("key1");
		expect(change.file_id).toBe("lix_own_change_control");
		expect(change.plugin_key).toBe("lix_own_change_control");
		expect(change.schema_key).toBe("lix_key_value_table");
	}

	expect(snapshots).toMatchObject([
		// insert
		{ key: "key1", value: "value1" },
		// update
		{ key: "key1", value: "value2" },
		// delete
		null,
	]);
});

test.skip("it works for compound entity ids like change_author", async () => {
	const lix = await openLixInMemory({});

	const account1 = await createAccount({ lix, name: "account1" });

	await createChange({
		lix,
		authors: [account1],
		pluginKey: "mock-plugin",
		schemaKey: "mock",
		fileId: "mock",
		entityId: "mock",
		snapshotContent: null,
	});

	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_change_author_table")
		// haha this is meta. the account creation is also change controlled
		// by the active account. hence, we need to filter the account creation
		.where("entity_id", "like", `%,${account1.id}`)
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);
});

test("if the trigger throws, the transaction is rolled back", async () => {
	const lix = await openLixInMemory({});

	const account1 = await createAccount({ lix, name: "account1" });

	const insertChange = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.where("entity_id", "=", account1.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(insertChange).toBeDefined();

	// deleting the active accounts aka there will be no change author
	// which will lead to a throw in the trigger
	await lix.db.deleteFrom("active_account").execute();

	// now we are deleting the account we just created
	try {
		await lix.db.deleteFrom("account").where("id", "=", account1.id).execute();
	} catch (e) {
		expect(e).toBeDefined();
	}

	await lix.db.selectFrom("log").selectAll().execute();

	const account1AfterFailedDeleted = await lix.db
		.selectFrom("account")
		.where("id", "=", account1.id)
		.selectAll()
		.executeTakeFirst();

	const deleteChange = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_account_table")
		.where("entity_id", "=", account1.id)
		.where("snapshot_id", "=", "no-content")
		.selectAll()
		.executeTakeFirst();

	expect(account1AfterFailedDeleted).toBeDefined();
	expect(account1AfterFailedDeleted).toStrictEqual(account1);
	expect(deleteChange).toBeUndefined();
});

test("skips change control of key values if `skip_change_control` is set to true", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key1", value: "value1", skip_change_control: true })
		.execute();

	const key1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key1")
		.selectAll()
		.executeTakeFirst();

	const key1Change = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "key1")
		.selectAll()
		.executeTakeFirst();

	expect(key1).toBeDefined();
	expect(key1Change).toBeUndefined();
});

// the sqlite jsonb representation should not be used externally
// hence, we need to store the metadata as string in the snapshot
test("file.metadata is tracked as json string, not binary.", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			data: new Uint8Array(),
			path: "/mock.txt",
			metadata: { key: "value" },
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.content?.metadata).toStrictEqual({
		key: "value",
	});
});

test("the pending change set is immediately 'flushed' when a change is inserted", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key0", value: "value0" })
		.execute();

	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID)
		.selectAll()
		.executeTakeFirst();

	expect(changeSet).toBeUndefined();
});

test("file.data is not own change controlled as plugins handle the change control of file data", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/mock.txt",
			data: new TextEncoder().encode("hello world"),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.content?.data).toBe(undefined);
});

test("it updates the active version's change set id", async () => {
	const lix = await openLixInMemory({});

	const versionBefore = await lix.db
		.selectFrom("version")
		.innerJoin("active_version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("key_value")
		.values({ key: "key0", value: "value0" })
		.execute();

	const versionAfter = await lix.db
		.selectFrom("version")
		.innerJoin("active_version", "version.id", "active_version.version_id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	expect(versionAfter.change_set_id).not.toBe(versionBefore.change_set_id);
});

test("the pending change set is immediately 'flushed' when a change is inserted", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key0", value: "value0" })
		.execute();

	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", LIX_OWN_CHANGE_CONTROL_CHANGE_SET_ID)
		.selectAll()
		.executeTakeFirst();

	expect(changeSet).toBeUndefined();
});

test("updating file.data does not trigger own change control", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("hello world"),
			path: "/mock.txt",
			metadata: null,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	let changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);

	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode("hello world 2") })
		.where("id", "=", file.id)
		.execute();

	changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes.length).toBe(1);

	// the metadata should be change controlled
	// hence, this should trigger a change
	await lix.db
		.updateTable("file")
		.set({
			data: new TextEncoder().encode("hello world 3"),
			metadata: { key: "value" },
		})
		.execute();

	changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
		.execute();

	expect(changes.length).toBe(2);
});

// SQlite does not have a BEFORE COMMIT trigger which could be used to group transactions into one change set
// the test is a nice to have but not required to make change control work.
test("it should group transactions into one change set", async () => {
	const lix = await openLixInMemory({});

	const activeVersionBefore = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select(["version.id", "version.change_set_id"])
		.executeTakeFirstOrThrow();

	const changeSetsBefore = await lix.db
		.selectFrom("change_set")
		.where(
			changeSetIsAncestorOf(
				{ id: activeVersionBefore.change_set_id },
				{ includeSelf: true }
			)
		)
		.selectAll()
		.execute();

	// freshly created lix should only have one change set in the ancestry
	expect(changeSetsBefore.length).toBe(1);

	await lix.db.transaction().execute(async (trx) => {
		await trx
			.insertInto("key_value")
			.values({ key: "key0", value: "value0" })
			.execute();

		await trx
			.insertInto("key_value")
			.values({ key: "key1", value: "value1" })
			.execute();
	});

	const activeVersionAfter = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.select(["version.id", "version.change_set_id"])
		.executeTakeFirstOrThrow();

	const changeSetsAfter = await lix.db
		.selectFrom("change_set")
		.where(
			changeSetIsAncestorOf(
				{ id: activeVersionAfter.change_set_id },
				{ includeSelf: true }
			)
		)
		.selectAll()
		.execute();

	await lix.db.selectFrom("log").selectAll().execute();

	const cleanChangeSetId = activeVersionAfter.change_set_id.replace(
		/^"|"$/g,
		""
	);

	// initial change set and the one created by the transaction
	expect(changeSetsAfter.length).toBe(2);

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersionAfter.change_set_id)
		.orderBy("change_id")
		.selectAll()
		.execute();

	// Verify the elements recorded in the final change set.
	// The order is determined by the 'change_id' (UUIDv7), which reflects the order of operations.
	expect(
		elements.map((e) => ({ entity_id: e.entity_id, schema_key: e.schema_key }))
	).toEqual([
		// The insertion of the first key-value pair.
		{ entity_id: "key0", schema_key: "lix_key_value_table" },
		// The change_set_element linking the first key-value insertion to the final change set.
		// The entity_id is a composite key: <change_set_id>,<change_id_of_key0_insert>
		{
			entity_id: expect.stringMatching(
				new RegExp(`^${cleanChangeSetId},[0-9a-f-]+$`)
			),
			schema_key: "lix_change_set_element_table",
		},
		// The insertion of the second key-value pair.
		{ entity_id: "key1", schema_key: "lix_key_value_table" },
		// The change_set_element linking the second key-value insertion to the final change set.
		// The entity_id is a composite key: <change_set_id>,<change_id_of_key1_insert>
		{
			entity_id: expect.stringMatching(
				new RegExp(`^${cleanChangeSetId},[0-9a-f-]+$`)
			),
			schema_key: "lix_change_set_element_table",
		},
		// The insertion of the final change_set row itself (triggered by the end_commit_hook).
		{
			entity_id: activeVersionAfter.change_set_id,
			schema_key: "lix_change_set_table",
		},
		// The change_set_element linking the change_set insertion (#5) to itself.
		// The entity_id is a composite key: <change_set_id>,<change_id_of_change_set_insert>
		{
			entity_id: expect.stringMatching(
				new RegExp(`^${cleanChangeSetId},[0-9a-f-]+$`)
			),
			schema_key: "lix_change_set_element_table",
		},
	]);
});

test("should not trigger change control when modifying the skip key", async () => {
	const lix = await openLixInMemory({});

	// globalThis.getLogs = () => {
	// 	return executeSync({
	// 		lix,
	// 		query: lix.db.selectFrom("log").selectAll(),
	// 	});
	// };

	// 1. Baseline change
	await lix.db
		.insertInto("key_value")
		.values({ key: "regular_key", value: "a" })
		.execute();

	const changesBefore = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();
	const elementsBefore = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.execute();

	// 2. Insert the skip key (should NOT trigger change control)
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_skip_own_change_control",
			value: "true",
			skip_change_control: true, // Important!
		})
		.execute();

	const changesAfterInsert = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();
	const elementsAfterInsert = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.execute();

	expect(changesAfterInsert).toEqual(changesBefore);
	expect(elementsAfterInsert).toEqual(elementsBefore);

	// 3. Delete the skip key (should also NOT trigger change control)
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "lix_skip_own_change_control")
		.execute();

	const changesAfterDelete = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();
	const elementsAfterDelete = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.execute();

	expect(changesAfterDelete).toEqual(changesBefore);
	expect(elementsAfterDelete).toEqual(elementsBefore);
});

test("works in combination with skipOwnChangeControl", async () => {
	const lix = await openLixInMemory({});

	await withSkipOwnChangeControl(lix.db, async (trx) => {
		await trx
			.insertInto("key_value")
			.values({ key: "key1", value: "value1" })
			.execute();

		const skip = await trx
			.selectFrom("key_value")
			.where("key", "=", "lix_skip_own_change_control")
			.selectAll()
			.executeTakeFirst();

		expect(skip).toBeDefined();
	});

	const skip = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_skip_own_change_control")
		.selectAll()
		.executeTakeFirst();

	expect(skip).toBeUndefined();
});

test("content of a thread comment is stored as json", async () => {
	const lix = await openLixInMemory({});

	const thread = await createThread({
		lix,
		comments: [
			{
				body: {
					type: "zettel_doc",
					content: [{ type: "mock", zettel_key: "mock_key" }],
				},
			},
		],
	});

	const firstComment = thread.comments[0]!;

	const change = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.where("entity_id", "=", firstComment.id)
		.selectAll("change")
		.select("snapshot.content")
		.executeTakeFirst();

	expect(firstComment.body.content).toEqual([
		{ type: "mock", zettel_key: "mock_key" },
	]);

	expect(change?.content?.body?.content).toEqual([
		{ type: "mock", zettel_key: "mock_key" },
	]);
});

// TODO remove.
// not change controlling the versions' change set id or working change set id means it can't be synced and state not be restored.
test("updating the version's change_set_id or working change_set_id is not change controlled to avoid infinite loops", async () => {
	const lix = await openLixInMemory({});

	const version = await lix.db
		.selectFrom("version")
		.select("id")
		.executeTakeFirstOrThrow();

	expect(version.id).toBeDefined();

	// testing that updating the version's change_set_id does not trigger a change
	await lix.db
		.updateTable("version")
		.set({
			change_set_id: (await createChangeSet({ lix })).id,
		})
		.returningAll()
		.where("id", "=", version.id)
		.executeTakeFirstOrThrow();

	// testing working change set
	await lix.db
		.updateTable("version")
		.set({ working_change_set_id: (await createChangeSet({ lix })).id })
		.executeTakeFirstOrThrow();

	// other columns should create a change
	await lix.db
		.updateTable("version")
		.set({ name: "new name" })
		.where("id", "=", version.id)
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_version_table")
		.where("entity_id", "=", version.id)
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.select("snapshot.content")
		.execute();

	expect(changes).toMatchObject([
		{
			content: {
				name: "new name",
			},
		},
	]);
});

// https://github.com/opral/lix-sdk/issues/304
test("every table is change controlled with the exception of changes, snapshots, and the file_queue which are used to re-compute state", async () => {
	const lix = await openLixInMemory({});

	const dbTables = await lix.db
		// @ts-expect-error - sqlite_master is not a table in the schema
		.selectFrom("sqlite_master")
		// @ts-expect-error - sqlite_master is not a table in the schema
		.where("type", "=", "table")
		.select("name")
		.execute();

	const ignoredTables = [
		"change",
		"snapshot",
		"file_queue",
		// TODO enable change control for logs (required for sync, sync is required for a lix inspector in local debugging)
		"log",
	];

	const changeControlledTables = dbTables
		.map((t) => t.name)
		.filter((t) => t?.includes("sqlite") === false)
		.filter((t) => !ignoredTables.includes(t as string));

	const shouldBeChangeControlledTables = Object.keys(changeControlledTableIds);

	expect(changeControlledTables.toSorted()).toEqual(
		shouldBeChangeControlledTables.toSorted()
	);
});
