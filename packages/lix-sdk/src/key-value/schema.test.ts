import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";
import { sql } from "kysely";

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

test("view should show changes across versions", async () => {
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
		commit_id: versionAAfterKvInsert.commit_id,
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

test("can update individual JSON properties using SQLite JSON functions", async () => {
	const lix = await openLix({});

	// Insert a complex JSON object
	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_config",
			value: {
				enabled: true,
				settings: {
					theme: "dark",
					language: "en",
					notifications: true,
				},
				features: ["feature1", "feature2"],
				count: 42,
			},
		})
		.execute();

	// First check the initial insert worked
	const initialValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test_config")
		.select("value")
		.executeTakeFirst();

	expect(initialValue?.value).toBeDefined();

	// Update a single nested property using json_set
	await lix.db
		.updateTable("key_value")
		.set({
			value: sql`json_set(value, '$.settings.theme', 'light')`,
		})
		.where("key", "=", "test_config")
		.execute();

	const afterThemeUpdate = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test_config")
		.select("value")
		.executeTakeFirst();

	expect(afterThemeUpdate?.value).toMatchObject({
		enabled: true,
		settings: {
			theme: "light", // Changed
			language: "en",
			notifications: true,
		},
		features: ["feature1", "feature2"],
		count: 42,
	});

	// Update multiple properties at once
	await lix.db
		.updateTable("key_value")
		.set({
			value: sql`json_set(value, '$.enabled', false, '$.count', 100, '$.settings.notifications', false)`,
		})
		.where("key", "=", "test_config")
		.execute();

	const afterMultiUpdate = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test_config")
		.select("value")
		.executeTakeFirst();

	expect(afterMultiUpdate?.value).toMatchObject({
		enabled: 0, // Changed - SQLite stores false as 0
		settings: {
			theme: "light",
			language: "en",
			notifications: 0, // Changed - SQLite stores false as 0
		},
		features: ["feature1", "feature2"],
		count: 100, // Changed
	});

	// Read specific properties using JSON operators
	const specificProps = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test_config")
		.select([
			sql<boolean>`value ->> '$.enabled'`.as("enabled"),
			sql<string>`value ->> '$.settings.theme'`.as("theme"),
			sql<number>`value ->> '$.count'`.as("count"),
		])
		.executeTakeFirst();

	expect(specificProps).toEqual({
		enabled: 0, // SQLite returns 0 for false
		theme: "light",
		count: 100,
	});
});

test("key_value preserves '1' as string when inserted as string", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "type_test_string", value: "1" })
		.execute();

	const row = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "type_test_string")
		.executeTakeFirstOrThrow();

	expect(typeof row.value).toBe("string");
	expect(row.value).toBe("1");
});

test("key_value preserves 1 as number when inserted as number", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "type_test_number", value: 1 })
		.execute();

	const row = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "type_test_number")
		.executeTakeFirstOrThrow();

	expect(typeof row.value).toBe("number");
	expect(row.value).toBe(1);
});
