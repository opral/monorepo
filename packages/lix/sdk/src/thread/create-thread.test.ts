import { expect, test } from "vitest";
import { createThread } from "./create-thread.js";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { ebEntity } from "../entity/eb-entity.js";

test("creates a thread with sequential comments where only the first has null parent_id", async () => {
	const lix = await openLix({});

	const comments = [
		{ body: fromPlainText("First comment") },
		{ body: fromPlainText("Second comment") },
		{ body: fromPlainText("Third comment") },
	];

	const threadWithComments = await createThread({ lix, comments });
	const { comments: insertedComments } = threadWithComments;

	expect(insertedComments).toHaveLength(3);
	expect(insertedComments[0]!.parent_id).toBeNull();
	expect(insertedComments[1]!.parent_id).toBe(insertedComments[0]!.id);
	expect(insertedComments[2]!.parent_id).toBe(insertedComments[1]!.id);
});

test("defaults to global version if no versionId is provided", async () => {
	const lix = await openLix({});

	const comments = [{ body: fromPlainText("Global comment") }];

	const threadWithComments = await createThread({ lix, comments });
	expect(threadWithComments.lixcol_version_id).toBe("global");
	expect(threadWithComments.comments[0]!.lixcol_version_id).toBe("global");
});

test("creates a thread with entity mapping when entity is provided", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-entity-config",
			value: { setting: "entityvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-entity-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	const comments = [{ body: fromPlainText("Comment on entity") }];

	// Create thread with entity
	const threadWithComments = await createThread({
		lix,
		comments,
		entity: keyValue,
	});

	// Verify thread was created
	expect(threadWithComments.id).toBeDefined();
	expect(threadWithComments.comments).toHaveLength(1);

	// Verify entity-thread mapping was created
	const mapping = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", threadWithComments.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.thread_id).toBe(threadWithComments.id);
});

test("creates a thread without entity mapping when entity is not provided", async () => {
	const lix = await openLix({});

	const comments = [{ body: fromPlainText("Standalone comment") }];

	// Create thread without entity
	const threadWithComments = await createThread({ lix, comments });

	// Verify thread was created
	expect(threadWithComments.id).toBeDefined();

	// Verify no entity-thread mapping exists
	const mappings = await lix.db
		.selectFrom("entity_thread")
		.where("thread_id", "=", threadWithComments.id)
		.selectAll()
		.execute();

	expect(mappings).toHaveLength(0);
});

test("can query threads for a specific entity using ebEntity", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "query-test-config",
			value: { setting: "queryvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "query-test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create multiple threads for the entity
	const thread1 = await createThread({
		lix,
		comments: [{ body: fromPlainText("First thread") }],
		entity: keyValue,
	});

	const thread2 = await createThread({
		lix,
		comments: [{ body: fromPlainText("Second thread") }],
		entity: keyValue,
	});

	// Create a thread for a different entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "other-config",
			value: { setting: "othervalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const otherKeyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "other-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	await createThread({
		lix,
		comments: [{ body: fromPlainText("Other thread") }],
		entity: otherKeyValue,
	});

	// Query threads for the specific entity using ebEntity
	const threads = await lix.db
		.selectFrom("thread")
		.innerJoin("entity_thread", "entity_thread.thread_id", "thread.id")
		.where(ebEntity("entity_thread").equals(keyValue))
		.select(["thread.id"])
		.execute();

	expect(threads).toHaveLength(2);
	expect(threads.map((t) => t.id)).toContain(thread1.id);
	expect(threads.map((t) => t.id)).toContain(thread2.id);
});

test("works with lixcol_ prefixed entity fields", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "lixcol-test-config",
			value: { setting: "lixcolvalue" },
			lixcol_version_id: "global",
		})
		.execute();

	// Get the key-value from state view (which has lixcol_ prefixed fields)
	const stateEntity = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "lixcol-test-config")
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.selectAll()
		.executeTakeFirstOrThrow();

	const comments = [{ body: fromPlainText("Comment with lixcol fields") }];

	// Create thread with entity object from state view
	const threadWithComments = await createThread({
		lix,
		comments,
		entity: stateEntity,
	});

	// Verify entity-thread mapping was created
	const mapping = await lix.db
		.selectFrom("entity_thread")
		.where("entity_id", "=", "lixcol-test-config")
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("thread_id", "=", threadWithComments.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.thread_id).toBe(threadWithComments.id);
});

test("thread_comment supports metadata via createThread", async () => {
	const lix = await openLix({});

	const thread = await createThread({
		lix,
		comments: [
			{ body: fromPlainText("hello"), metadata: { lix_agent_role: "user" } },
		],
	});

	expect(thread.comments).toHaveLength(1);
	expect((thread.comments[0] as any).metadata).toEqual({
		lix_agent_role: "user",
	});
});