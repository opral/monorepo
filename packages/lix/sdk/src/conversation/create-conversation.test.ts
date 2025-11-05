import { expect, test } from "vitest";
import { createConversation } from "./create-conversation.js";
import { openLix } from "../lix/open-lix.js";
import { fromPlainText } from "@opral/zettel-ast";
import { ebEntity } from "../entity/eb-entity.js";

test("creates a conversation with sequential messages where only the first has null parent_id", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const comments = [
		{ body: fromPlainText("First message") },
		{ body: fromPlainText("Second message") },
		{ body: fromPlainText("Third message") },
	];

	const convWithMessages = await createConversation({ lix, comments });
	const { comments: inserted } = convWithMessages;

	expect(inserted).toHaveLength(3);
	expect(inserted[0]!.parent_id).toBeNull();
	expect(inserted[1]!.parent_id).toBe(inserted[0]!.id);
	expect(inserted[2]!.parent_id).toBe(inserted[1]!.id);
});

test("defaults to global version if no versionId is provided", async () => {
	const lix = await openLix({});

	const comments = [{ body: fromPlainText("Global message") }];

	const conv = await createConversation({ lix, comments });
	expect(conv.lixcol_version_id).toBe("global");
	expect(conv.comments[0]!.lixcol_version_id).toBe("global");
});

test("creates a conversation with entity mapping when entity is provided", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_by_version")
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

	// Create conversation with entity
	const conv = await createConversation({
		lix,
		comments,
		entity: keyValue,
	});

	// Verify conversation + mapping
	expect(conv.id).toBeDefined();
	expect(conv.comments).toHaveLength(1);

	const mapping = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.conversation_id).toBe(conv.id);
});

test("creates a conversation without entity mapping when entity is not provided", async () => {
	const lix = await openLix({});

	const comments = [{ body: fromPlainText("Standalone message") }];

	const conv = await createConversation({ lix, comments });

	expect(conv.id).toBeDefined();

	const mappings = await lix.db
		.selectFrom("entity_conversation")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.execute();

	expect(mappings).toHaveLength(0);
});

test("can query conversations for a specific entity using ebEntity", async () => {
	const lix = await openLix({});

	// Create a key-value entity
	await lix.db
		.insertInto("key_value_by_version")
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

	// Create multiple conversations for the entity
	const c1 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("First conversation") }],
		entity: keyValue,
	});

	const c2 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Second conversation") }],
		entity: keyValue,
	});

	// Create a conversation for a different entity
	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "other-config",
			value: { setting: "othervalue" },
			lixcol_version_id: "global",
		})
		.execute();

	const other = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "other-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	await createConversation({
		lix,
		comments: [{ body: fromPlainText("Other conversation") }],
		entity: other,
	});

	// Query conversations for the specific entity using ebEntity
	const rows = await lix.db
		.selectFrom("conversation")
		.innerJoin(
			"entity_conversation",
			"entity_conversation.conversation_id",
			"conversation.id"
		)
		.where(ebEntity("entity_conversation").equals(keyValue))
		.select(["conversation.id"])
		.execute();

	expect(rows).toHaveLength(2);
	expect(rows.map((t) => t.id)).toContain(c1.id);
	expect(rows.map((t) => t.id)).toContain(c2.id);
});

test("conversation_message supports metadata via createConversation", async () => {
	const lix = await openLix({});

	const conv = await createConversation({
		lix,
		comments: [
			{
				body: fromPlainText("hello"),
				lixcol_metadata: { lix_agent_role: "user" },
			},
		],
	});

	expect(conv.comments).toHaveLength(1);
	expect(conv.comments[0]!.lixcol_metadata).toEqual({
		lix_agent_role: "user",
	});
});
