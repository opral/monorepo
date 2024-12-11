import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { switchVersion } from "./switch-version.js";
import { createVersion } from "./create-version.js";
import { createChange } from "../change/create-change.js";

test("switching versiones should update the current_version", async () => {
	const lix = await openLixInMemory({});

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		const newVersion = await createVersion({
			lix: { db: trx },
			parent: currentVersion,
		});
		await switchVersion({ lix: { ...lix, db: trx }, to: newVersion });
		return newVersion;
	});

	const currentVersionAfterSwitch = await lix.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(currentVersionAfterSwitch.id).toBe(newVersion?.id);
});

test("switching a version does not lead to duplicate changes", async () => {
	const lix = await openLixInMemory({});

	const account0 = await lix.db
		.insertInto("account")
		.values({ name: "account0" })
		.returningAll()
		.executeTakeFirstOrThrow();

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const change0 = await createChange({
		lix,
		version: currentVersion,
		authors: [account0],
		entityId: "entity0",
		fileId: "file0",
		schemaKey: "schema0",
		snapshotContent: null,
		pluginKey: "plugin0",
	});

	const newVersion = await createVersion({
		lix: lix,
		parent: currentVersion,
	});

	const changesBefore = await lix.db.selectFrom("change").selectAll().execute();

	expect(changesBefore).toEqual(expect.arrayContaining([change0]));

	await switchVersion({ lix, to: newVersion });

	const changesAfter = await lix.db.selectFrom("change").selectAll().execute();

	expect(changesAfter).toEqual(changesBefore);
});

test("switch version applies the changes of the switched to version", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });

	const versionB = await createVersion({ lix });

	await switchVersion({ lix, to: versionA });

	// version A has value foo
	await lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "bar" })
		.execute();

	let keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(keyValues).toEqual([{ key: "foo", value: "bar" }]);

	await switchVersion({ lix, to: versionB });

	// version B should have no value foo
	keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	expect(keyValues).toHaveLength(0);

	// version B has value foo
	await lix.db
		.insertInto("key_value")
		.values({ key: "foo", value: "baz" })
		.execute();

	await switchVersion({ lix, to: versionA });

	keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "foo")
		.selectAll()
		.execute();

	// expecting to see the value from version A again
	expect(keyValues).toEqual([{ key: "foo", value: "bar" }]);
});
