import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "../account/create-account.js";
import { createChange } from "../change/create-change.js";

test("should detect and create changes", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key1", value: "value1" })
		.execute();

	await new Promise((resolve) => setTimeout(resolve, 100));

	const change = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.executeTakeFirstOrThrow();

	const snapshot = await lix.db
		.selectFrom("snapshot")
		.where("id", "=", change.snapshot_id)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(change.entity_id).toBe("key1");
	expect(change.file_id).toBe("null");
	expect(change.plugin_key).toBe("lix_own_entity");
	expect(change.schema_key).toBe("lix_key_value");
	expect(snapshot.content).toStrictEqual({ key: "key1", value: "value1" });
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
		.where("schema_key", "=", "lix_change_author")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll()
		.execute();

	expect(changes.length).toBe(1);
});
