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

	await new Promise((resolve) => setTimeout(resolve, 100));

	// update
	await lix.db
		.updateTable("key_value")
		.set("value", "value2")
		.where("key", "=", "key1")
		.execute();

	// delete
	await lix.db.deleteFrom("key_value").where("key", "=", "key1").execute();

	await new Promise((resolve) => setTimeout(resolve, 100));

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
		expect(change.file_id).toBe("null");
		expect(change.plugin_key).toBe("lix_own_entity");
		expect(change.schema_key).toBe("lix_key_value_table");
	}

	expect(snapshots).toStrictEqual([
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

	await new Promise((resolve) => setTimeout(resolve, 100));

	const changes = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_change_author_table")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);
});
