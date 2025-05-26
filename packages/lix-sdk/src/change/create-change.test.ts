import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChange } from "./create-change.js";
import { createAccount } from "../account/create-account.js";

test("creating changes", async () => {
	const lix = await openLixInMemory({});

	const c0 = await createChange({
		lix,
		id: "c0",
		entity_id: "entity1",
		schema_key: "schema1",
		schema_version: "1.0",
		file_id: "file1",
		plugin_key: "plugin1",
		snapshot: {
			content: "snapshot-content",
		},
	});

	const changes = await lix.db
		.selectFrom("change")
		.where("id", "=", "c0")
		.selectAll()
		.execute();

	expect(changes).toEqual([c0]);
});

test("uses the 'no-content' id if the snapshot content is null for de-duplication", async () => {
	const lix = await openLixInMemory({});

	const change = await createChange({
		lix,
		id: "c0",
		entity_id: "entity1",
		schema_key: "schema1",
		schema_version: "1.0",
		file_id: "file1",
		plugin_key: "plugin1",
		snapshot: {
			content: null,
		},
	});

	expect(change.snapshot_id).toBe("no-content");
});

test("creating changes with authors", async () => {
	const lix = await openLixInMemory({});

	// Create some authors
	const author1 = await createAccount({
		lix,
		name: "Author One",
	});

	const author2 = await createAccount({
		lix,
		name: "Author Two",
	});

	const change = await createChange({
		lix,
		id: "c1",
		entity_id: "entity1",
		schema_key: "schema1",
		schema_version: "1.0",
		file_id: "file1",
		plugin_key: "plugin1",
		snapshot: {
			content: "snapshot-content",
		},
		authors: [author1, author2],
	});

	// Verify change was created
	const changes = await lix.db
		.selectFrom("change")
		.where("id", "=", "c1")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(changes[0]!.id).toBe(change.id);

	// Verify change_author records were created
	const changeAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", "c1")
		.orderBy("account_id", "asc")
		.selectAll()
		.execute();

	expect(changeAuthors).toHaveLength(2);
	expect(changeAuthors).toMatchObject([
		{
			change_id: change.id,
			account_id: author1.id,
		},
		{
			change_id: change.id,
			account_id: author2.id,
		},
	]);
});

test("creating changes without authors should not create change_author records", async () => {
	const lix = await openLixInMemory({});

	const change = await createChange({
		lix,
		id: "c2",
		entity_id: "entity1",
		schema_key: "schema1",
		schema_version: "1.0",
		file_id: "file1",
		plugin_key: "plugin1",
		snapshot: {
			content: "snapshot-content",
		},
		// No authors specified
	});

	// Verify change was created
	const changes = await lix.db
		.selectFrom("change")
		.where("id", "=", change.id)
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);

	// Verify no change_author records were created
	const changeAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", change.id)
		.selectAll()
		.execute();

	expect(changeAuthors).toHaveLength(0);
});

test("should create a snapshot with the correct content", async () => {
	const lix = await openLixInMemory({});

	const author = await createAccount({
		lix,
		name: "author",
	});

	const change = await createChange({
		lix,
		id: "c4",
		entity_id: "entity1",
		schema_key: "schema1",
		schema_version: "1.0",
		file_id: "file1",
		plugin_key: "plugin1",
		snapshot: {
			content: { text: "snapshot-content" },
		},
		authors: [author],
	});

	const snapshots = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", change.snapshot_id)
		.selectAll()
		.execute();

	expect(snapshots).toHaveLength(1);
	expect(snapshots[0]?.content).toStrictEqual({ content: { text: "snapshot-content" } });
});

test("should create a change and a snapshot in a transaction", async () => {
	const lix = await openLixInMemory({});

	const author = await createAccount({
		lix,
		name: "author",
	});

	let change: any;

	await lix.db.transaction().execute(async (trx) => {
		change = await createChange({
			lix: { ...lix, db: trx },
			id: "c5",
			entity_id: "entity1",
			schema_key: "schema1",
			schema_version: "1.0",
			file_id: "file1",
			plugin_key: "plugin1",
			snapshot: {
				content: { text: "snapshot-content" },
			},
			authors: [author],
		});
	});

	const changes = await lix.db
		.selectFrom("change")
		.where("id", "=", change!.id)
		.selectAll()
		.execute();

	const snapshots = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", change!.snapshot_id)
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	expect(snapshots).toHaveLength(1);
	expect(changes[0]?.snapshot_id).toBe(snapshots[0]?.id);
});