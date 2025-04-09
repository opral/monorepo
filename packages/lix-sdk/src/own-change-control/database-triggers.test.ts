import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "../account/create-account.js";
import { createChange } from "../change/create-change.js";

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

test("it works for compound entity ids like change_author", async () => {
	const lix = await openLixInMemory({});

	const account1 = await createAccount({ lix, name: "account1" });

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	await createChange({
		lix,
		version: currentVersion,
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


test.todo("it should group transactions into one change set", async () => {});

	