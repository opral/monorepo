import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChange } from "./create-change.js";
import type { Change } from "../database/schema.js";
import { createAccount } from "../account/create-account.js";

test("should create a change with the correct values", async () => {
	const lix = await openLixInMemory({});

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange({
		lix,
		authors: [author],
		entityId: "entity1",
		fileId: "file1",
		pluginKey: "plugin1",
		schemaKey: "schema1",
		snapshotContent: { text: "snapshot-content" },
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

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange({
		lix,
		authors: [author],
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

	const author = await createAccount({
		lix,
		name: "author",
	});

	let change: Change;

	await lix.db.transaction().execute(async (trx) => {
		change = await createChange({
			lix: { ...lix, db: trx },
			authors: [author],
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

test("should throw an error if authors array is empty", async () => {
	const lix = await openLixInMemory({});

	expect(() =>
		createChange({
			lix,
			authors: [],
			entityId: "entity1",
			fileId: "file1",
			pluginKey: "plugin1",
			schemaKey: "schema1",
			snapshotContent: { text: "snapshot-content" },
		})
	).toThrow("At least one author is required");
});

