import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";

test("inserts, updates, deletes are handled", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key0", value: "value0" })
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key0")
		.selectAll()
		.executeTakeFirst();

	expect(viewAfterInsert).toMatchObject({
		key: "key0",
		value: "value0",
		// version_id: null,
		// created_at: expect.any(String),
	});

	await lix.db
		.updateTable("key_value")
		.where("key", "=", "key0")
		.set({ value: "value1" })
		.execute();

	await lix.db.deleteFrom("key_value").where("key", "=", "key0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key0")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toMatchObject([]);

	const changes = await lix.db
		.selectFrom("change")

		.where("schema_key", "=", "lix_key_value")
		.where("change.entity_id", "=", "key0")
		.selectAll()
		.orderBy("change.created_at", "asc")
		.execute();

	expect(changes.map((change) => change.snapshot_content)).toMatchObject([
		{
			key: "key0",
			value: "value0",
		},
		{
			key: "key0",
			value: "value1",
		},
		null,
	]);
});

test("arbitrary json is allowed", async () => {
	const lix = await openLix({});

	const kvs = [
		{ key: "key0", value: { foo: "bar" } },
		{ key: "key1", value: ["foo", "bar"] },
		{ key: "key2", value: "foo" },
		{ key: "key3", value: 42 },
		{ key: "key4", value: true },
		{ key: "key5", value: null },
	];

	await lix.db.insertInto("key_value").values(kvs).execute();

	const viewAfterInsert = await lix.db
		.selectFrom("key_value")
		.select(["key", "value"])
		.where(
			"key",
			"in",
			kvs.map((kv) => kv.key)
		)
		.execute();

	expect(viewAfterInsert).toEqual(kvs);
});

test.todo("view should show changes across versions", async () => {
	const lix = await openLix({});

	// creating a new version
	const versionA = await createVersion({ lix, id: "versionA" });

	// inserting a key-value pair in version A
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "foo",
			value: "bar",
			lixcol_version_id: versionA.id,
		})
		.execute();

	const kvAfterInsert = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(kvAfterInsert).toMatchObject([
		{
			key: "foo",
			value: "bar",
			lixcol_version_id: versionA.id,
		},
	]);

	const versionAAfterKvInsert = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// creating a new version from the active version
	const versionB = await createVersion({
		lix,
		id: "versionB",
		name: "versionB",
		changeSet: { id: versionAAfterKvInsert.change_set_id },
	});

	const kvAfterInsertInVersionB = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(kvAfterInsertInVersionB).toMatchObject([
		{
			key: "foo",
			value: "bar",
			lixcol_version_id: versionA.id,
		},
		{
			key: "foo",
			value: "bar",
			lixcol_version_id: versionB.id,
		},
	]);

	await lix.db
		.updateTable("key_value_all")
		.where("key", "=", "foo")
		.where("lixcol_version_id", "=", versionB.id)
		.set({ value: "bar_updated" })
		.execute();

	const kvAfterUpdate = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(kvAfterUpdate).toMatchObject([
		{
			key: "foo",
			value: "bar",
			lixcol_version_id: versionA.id,
		},
		{
			key: "foo",
			value: "bar_updated",
			lixcol_version_id: versionB.id,
		},
	]);
});
