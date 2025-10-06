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

// NOTE ON SQLITE JSON1 AND BOOLEANS
// ---------------------------------
// SQLite JSON1 does not have a native boolean type at the SQL level.
// When projecting a JSON boolean with json_extract(...), SQLite returns
// SQL-native scalars: true -> 1 and false -> 0. Objects/arrays are
// returned as JSON text unless wrapped, and strings are TEXT.
//
// Historically this test compared directly against JS booleans because
// values were stored as strings (e.g. "true") and parsed elsewhere.
// Now that we store proper JSON and project with json_extract, the view
// returns 1/0 for booleans. This test therefore expects 1 for true and
// 0 for false to reflect SQLite’s behavior.
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

	const expected = kvs.map((kv) => ({
		key: kv.key,
		value: typeof kv.value === "boolean" ? (kv.value ? 1 : 0) : kv.value,
	}));

	expect(viewAfterInsert).toEqual(expected);
});

test("key_value insert stores proper JSON in state_all (no double encoding)", async () => {
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

	const rows = await lix.db
		.selectFrom("state_all")
		.where("schema_key", "=", "lix_key_value")
		.where(
			"entity_id",
			"in",
			kvs.map((kv) => kv.key)
		)
		.select(["entity_id", sql`json(snapshot_content)`.as("snapshot_content")])
		.execute();

	// map by key
	const byKey = new Map(rows.map((r) => [r.entity_id, r as any]));

	expect(byKey.get("key0")?.snapshot_content.value).toEqual({ foo: "bar" });
	expect(byKey.get("key1")?.snapshot_content.value).toEqual(["foo", "bar"]);
	expect(byKey.get("key2")?.snapshot_content.value).toBe("foo");
	expect(byKey.get("key3")?.snapshot_content.value).toBe(42);
	// With json(snapshot_content), driver decodes JSON booleans to true/false
	// SQLite JSON1 surfaces booleans as 1/0
	expect(byKey.get("key4")?.snapshot_content.value).toBe(1);
	expect(byKey.get("key5")?.snapshot_content.value).toBeNull();
});

test("boolean representation matches between key_value view and state view", async () => {
	const lix = await openLix({});

	// Insert booleans via entity view
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "bool_true", value: true },
			{ key: "bool_false", value: false },
		])
		.execute();

	// Read from key_value view
	const viewRows = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["bool_true", "bool_false"])
		.select(["key", "value"])
		.orderBy("key")
		.execute();

	// Read from state view (active version) and extract JSON value
	const stateRows = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "in", ["bool_true", "bool_false"])
		.select([
			"entity_id",
			// json_extract returns SQLite-native scalars (1/0), matching the key_value view's behavior
			sql`json_extract(snapshot_content, '$.value')`.as("value"),
		])
		.orderBy("entity_id")
		.execute();

	const viewMap = new Map(viewRows.map((r) => [r.key, r.value]));
	const stateMap = new Map(stateRows.map((r: any) => [r.entity_id, r.value]));

	expect(viewMap.get("bool_true")).toBe(stateMap.get("bool_true"));
	expect(viewMap.get("bool_false")).toBe(stateMap.get("bool_false"));
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

	// creating a new version from the active version
	const versionB = await createVersion({
		lix,
		id: "versionB",
		name: "versionB",
		from: versionA,
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
