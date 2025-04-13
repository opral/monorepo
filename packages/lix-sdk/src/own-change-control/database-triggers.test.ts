import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "../account/create-account.js";
import { createChange } from "../change/create-change.js";
import { changeSetIsAncestorOf } from "../query-filter/change-set-is-ancestor-of.js";
import fs from "node:fs/promises";
import { toBlob } from "../lix/to-blob.js";
import { withSkipOwnChangeControl } from "./with-skip-own-change-control.js";

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
		.set("value", "value2")
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
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
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
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.select(["version_v2.id", "version_v2.change_set_id"])
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

	await fs.writeFile(
		"./repro_after.lix",
		Buffer.from(await(await toBlob({ lix })).arrayBuffer())
	);

	const activeVersionAfter = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.select(["version_v2.id", "version_v2.change_set_id"])
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

	// initial change set and the one created by the transaction
	expect(changeSetsAfter.length).toBe(2);

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", activeVersionAfter.change_set_id)
		.orderBy("change_id")
		.selectAll()
		.execute();

	// mock plugin properties and own change control changes should be in the same set
	expect(
		elements.map((e) => ({ entity_id: e.entity_id, schema_key: e.schema_key }))
	).toEqual([
		{ entity_id: "key0", schema_key: "lix_key_value_table" },
		// { entity_id: expect.any(String), schema_key: "lix_change_author_table" },
		{ entity_id: "key1", schema_key: "lix_key_value_table" },
		// { entity_id: expect.any(String), schema_key: "lix_change_author_table" },
	]);
});

test("should not trigger change control when modifying the skip key", async () => {
	const lix = await openLixInMemory({});

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

		expect(skip?.value).toBe("true");
	});

	const skip = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_skip_own_change_control")
		.selectAll()
		.executeTakeFirst();

	expect(skip).toBeUndefined();
});

