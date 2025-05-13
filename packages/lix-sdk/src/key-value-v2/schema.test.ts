import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "../version/create-version.js";

test("inserts, updates, deletes are handled", async () => {
	const lix = await openLixInMemory({});

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

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.orderBy("change.created_at", "asc")
		.execute();

	const viewAfterDelete = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toMatchObject([]);

	expect(changes.map((change) => change.content)).toMatchObject([
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

test("view should show changes across versions", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const result = await lix.db
		.insertInto("key_value")
		.values({
			key: "foo",
			value: "bar",
		})
		.returningAll()
		.execute();

	expect(result).toMatchObject([
		{
			key: "foo",
			value: "bar",
		},
	]);
	const viewResult0 = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.execute();

	expect(viewResult0).toMatchObject([
		{
			key: "foo",
			value: "bar",
			version_id: activeVersion.id,
		},
	]);

	const activeVersionAfterUpdate = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const versionB = await createVersion({
		lix,
		id: "versionB",
		name: "versionB",
		changeSet: { id: activeVersionAfterUpdate.change_set_id },
	});

	await lix.db
		.updateTable("active_version")
		.set({ version_id: versionB.id })
		.execute();

	const kvViewAfterSwitch = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.execute();

	expect(kvViewAfterSwitch).toMatchObject([
		{
			key: "foo",
			value: "bar",
			version_id: activeVersion.id,
		},
		{
			key: "foo",
			value: "bar",
			version_id: versionB.id,
		},
	]);

	await lix.db
		.insertInto("key_value")
		.values({ key: "foo_versionB", value: "bar" })
		.execute();

	const viewResult1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(viewResult1).toMatchObject([
		{
			key: "foo",
			value: "bar",
			version_id: activeVersion.id,
		},
		{
			key: "foo",
			value: "bar",
			version_id: versionB.id,
		},
		{
			key: "foo_versionB",
			value: "bar",
			version_id: versionB.id,
		},
	]);
});
