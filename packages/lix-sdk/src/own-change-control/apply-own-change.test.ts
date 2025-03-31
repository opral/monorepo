import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { Change } from "../database/schema.js";
import type {
	ChangeSet,
	ChangeSetElement,
} from "../change-set/database-schema.js";
import { applyOwnChanges } from "./apply-own-change.js";
import { mockJsonSnapshot } from "../snapshot/mock-json-snapshot.js";
import { type NewKeyValue } from "../key-value/database-schema.js";

test("it should apply insert changes correctly", async () => {
	const lix = await openLixInMemory({});

	const snapshot = mockJsonSnapshot({
		key: "key1",
		value: "value1",
	});

	const change: Change = {
		id: "change1",
		entity_id: "key1",
		schema_key: "lix_key_value_table",
		plugin_key: "lix_own_change_control",
		file_id: "lix_own_change_control",
		snapshot_id: snapshot.id,
		created_at: "2021-01-01T00:00:00.000Z",
	};

	await lix.db
		.insertInto("snapshot")
		.values({ content: snapshot.content })
		.execute();

	await applyOwnChanges({ lix, changes: [change] });

	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key1")
		.selectAll()
		.executeTakeFirst();

	expect(result).toMatchObject({ key: "key1", value: "value1" });
});

test("it should apply update changes correctly", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key1", value: "old_value" })
		.execute();

	const snapshot = mockJsonSnapshot({
		key: "key1",
		value: "new_value",
	});

	const change: Change = {
		id: "change1",
		schema_key: "lix_key_value_table",
		entity_id: "key1",
		file_id: "lix_own_change_control",
		created_at: "2021-01-01T00:00:00.000Z",
		plugin_key: "lix_own_change_control",
		snapshot_id: snapshot.id,
	};

	await lix.db
		.insertInto("snapshot")
		.values({
			content: snapshot.content,
		})
		.execute();

	await applyOwnChanges({ lix, changes: [change] });

	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key1")
		.selectAll()
		.executeTakeFirst();

	expect(result).toMatchObject({ key: "key1", value: "new_value" });
});

test("it should apply delete changes correctly", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "key1", value: "value1" })
		.execute();

	const change: Change = {
		id: "change1",
		schema_key: "lix_key_value_table",
		file_id: "lix_own_change_control",
		created_at: "2021-01-01T00:00:00.000Z",
		entity_id: "key1",
		plugin_key: "lix_own_change_control",
		snapshot_id: "no-content",
	};

	await applyOwnChanges({ lix, changes: [change] });

	const result = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "key1")
		.selectAll()
		.executeTakeFirst();

	expect(result).toBeUndefined();
});

test("it should throw an error for invalid plugin key", async () => {
	const lix = await openLixInMemory({});

	const change: Change = {
		id: "change1",
		schema_key: "lix_key_value_table",
		entity_id: "key1",
		file_id: "lix_own_change_control",
		created_at: "2021-01-01T00:00:00.000Z",
		plugin_key: "invalid-plugin",
		snapshot_id: "snapshot1",
	};

	const snapshot = mockJsonSnapshot({
		key: "key1",
		value: "value1",
	});

	await lix.db
		.insertInto("snapshot")
		.values({
			content: snapshot.content,
		})
		.execute();

	await expect(applyOwnChanges({ lix, changes: [change] })).rejects.toThrow(
		"Expected 'lix_own_change_control' as plugin key but received invalid-plugin"
	);
});

test("file.data is not changed by applyOwnEntityChanges", async () => {
	const lix = await openLixInMemory({});

	const file = await lix.db
		.insertInto("file")
		.values({
			path: "/test.txt",
			data: new TextEncoder().encode("hello"),
			metadata: {
				foo: "bar",
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const change = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("schema_key", "=", "lix_file_table")
		.where("entity_id", "=", file.id)
		.selectAll()
		.executeTakeFirst();

	expect(change).toBeDefined();
	expect(change?.content?.metadata).toEqual({ foo: "bar" });

	const snapshot = await lix.db
		.insertInto("snapshot")
		.values({
			content: {
				id: file.id,
				path: "/test.txt",
				metadata: {
					foo: "baz",
				},
			},
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const mockChange: Change = {
		id: "change1",
		entity_id: file.id,
		schema_key: "lix_file_table",
		plugin_key: "lix_own_change_control",
		file_id: "null",
		snapshot_id: snapshot.id,
		created_at: "2021-01-01T00:00:00.000Z",
	};

	await applyOwnChanges({ lix, changes: [mockChange] });

	const result = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirst();

	expect(result).toEqual({
		id: file.id,
		data: new TextEncoder().encode("hello"),
		path: "/test.txt",
		metadata: { foo: "baz" },
	});
});

test("foreign key constraints are deferred to make the order of applying changes irrelevant", async () => {
	const lix = await openLixInMemory({});

	const snapshots = [
		mockJsonSnapshot({
			id: "change-set-1",
		} satisfies ChangeSet),
		mockJsonSnapshot({
			change_id: "change0",
			change_set_id: "change-set-1",
		} satisfies ChangeSetElement),
	] as const;

	const mockChanges: Change[] = [
		// applying changes in reverse order
		{
			id: "change2",
			entity_id: "change-set-1,change0",
			schema_key: "lix_change_set_element_table",
			plugin_key: "lix_own_change_control",
			file_id: "null",
			snapshot_id: snapshots[1].id,
			created_at: "2021-01-01T00:00:00.000Z",
		},
		{
			id: "change1",
			entity_id: "change-set-1",
			schema_key: "lix_change_set_table",
			plugin_key: "lix_own_change_control",
			file_id: "null",
			snapshot_id: snapshots[0].id,
			created_at: "2021-01-01T00:00:00.000Z",
		},
	];

	for (const snapshot of snapshots) {
		// @ts-expect-error - 'cannot' insert into generated column error
		delete snapshot.id;
	}

	await lix.db
		.insertInto("snapshot")
		.values(snapshots.map((s) => ({ content: s.content })))
		.execute();

	// insert change that the change set element references
	await lix.db
		.insertInto("change")
		.values({
			id: "change0",
			plugin_key: "mock",
			file_id: "null",
			entity_id: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
		})
		.execute();

	await expect(
		applyOwnChanges({ lix, changes: mockChanges })
	).resolves.toBeUndefined();
});

test("foreign key constraints are obeyed", async () => {
	const lix = await openLixInMemory({});

	const snapshots = [
		mockJsonSnapshot({
			// both change 0 and the change set are missing
			change_id: "change0",
			change_set_id: "change-set-1",
		} satisfies ChangeSetElement),
	] as const;

	const mockChanges: Change[] = [
		{
			id: "change2",
			// the change set for this change does not exist
			entity_id: "change-set-1,change0",
			schema_key: "lix_change_set_element_table",
			plugin_key: "lix_own_change_control",
			file_id: "lix_own_change_control",
			snapshot_id: snapshots[0].id,
			created_at: "2021-01-01T00:00:00.000Z",
		},
	];

	for (const snapshot of snapshots) {
		// @ts-expect-error - 'cannot' insert into generated column error
		delete snapshot.id;
	}

	await lix.db
		.insertInto("snapshot")
		.values(snapshots.map((s) => ({ content: s.content })))
		.execute();

	// insert change that the change set element references
	await lix.db
		.insertInto("change")
		.values({
			id: "change0",
			plugin_key: "mock",
			file_id: "null",
			entity_id: "mock",
			schema_key: "mock",
			snapshot_id: "no-content",
		})
		.execute();

	expect(applyOwnChanges({ lix, changes: mockChanges })).rejects.toThrow();
});

// https://github.com/opral/lix-sdk/issues/185
test("applying own entity changes doesn't lead to the creation of new changes", async () => {
	const lix = await openLixInMemory({});

	const snapshot = mockJsonSnapshot({
		key: "mock-key",
		value: "1+1=2",
	} satisfies NewKeyValue);

	await lix.db
		.insertInto("snapshot")
		.values({
			content: snapshot.content,
		})
		.execute();

	const changesBefore = await lix.db.selectFrom("change").selectAll().execute();

	await applyOwnChanges({
		lix,
		changes: [
			{
				id: "change0",
				entity_id: "mock-key",
				file_id: "null",
				plugin_key: "lix_own_change_control",
				schema_key: "lix_key_value_table",
				snapshot_id: snapshot.id,
				created_at: "2021-01-01T00:00:00Z",
			},
		],
	});

	const changesAfter = await lix.db.selectFrom("change").selectAll().execute();

	expect(changesBefore).toEqual(changesAfter);
});
