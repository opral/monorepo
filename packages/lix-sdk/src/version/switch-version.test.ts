import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "./create-version.js";
import { switchVersion } from "./switch-version.js";
import { createChange } from "../change/create-change.js";
import { createChangeSet } from "../change-set/create-change-set.js";

test("switching versiones should update the active_version", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		const newVersion = await createVersion({
			lix: { ...lix, db: trx },
			changeSet: { id: activeVersion.change_set_id },
		});
		await switchVersion({ lix: { ...lix, db: trx }, to: newVersion });
		return newVersion;
	});

	const activeVersionAfterSwitch = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	expect(activeVersionAfterSwitch.id).toBe(newVersion?.id);
});

test.todo(
	"switching a version does not lead to duplicate changes",
	async () => {
		const lix = await openLixInMemory({});

		const account0 = await lix.db
			.insertInto("account")
			.values({ name: "account0" })
			.returningAll()
			.executeTakeFirstOrThrow();

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version")
			.executeTakeFirstOrThrow();

		const change0 = await createChange({
			lix,
			authors: [account0],
			entityId: "entity0",
			fileId: "file0",
			schemaKey: "schema0",
			snapshotContent: null,
			pluginKey: "plugin0",
		});

		const newVersion = await createVersion({
			lix: lix,
			changeSet: { id: activeVersion.change_set_id },
		});

		const changesBefore = await lix.db
			.selectFrom("change")
			.selectAll()
			.execute();

		expect(changesBefore).toEqual(expect.arrayContaining([change0]));

		await switchVersion({ lix, to: newVersion });

		const changesAfter = await lix.db
			.selectFrom("change")
			.selectAll()
			.execute();

		expect(changesAfter).toEqual(changesBefore);
	}
);

test.todo(
	"switch version applies the changes of the switched to version",
	async () => {
		const lix = await openLixInMemory({});

		const versionA = await createVersion({
			lix,
			changeSet: await createChangeSet({ lix }),
		});

		const versionB = await createVersion({
			lix,
			changeSet: await createChangeSet({ lix }),
		});

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

		expect(keyValues).toMatchObject([{ key: "foo", value: "bar" }]);

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
		expect(keyValues).toMatchObject([{ key: "foo", value: "bar" }]);
	}
);
