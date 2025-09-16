import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import {
	attachConversation,
	detachConversation,
} from "./attach-conversation.js";
import { createConversation } from "../../conversation/create-conversation.js";
import { fromPlainText } from "@opral/zettel-ast";

test("attachConversation should create a mapping between entity and conversation", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config",
			value: { setting: "value1" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	const conv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Test msg") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});

	const mapping = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.entity_id).toBe(keyValue.key);
	expect(mapping?.conversation_id).toBe(conv.id);
});

test("attachConversation should handle lixcol_ prefixed entity fields", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-2",
			value: { setting: "value2" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-2")
		.selectAll()
		.executeTakeFirstOrThrow();

	const conv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Test msg 2") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});

	const mapping = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.entity_id).toBe(keyValue.key);
	expect(mapping?.conversation_id).toBe(conv.id);
});

test("attachConversation should be idempotent for same entity-conversation pair", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-3",
			value: { setting: "value3" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-3")
		.selectAll()
		.executeTakeFirstOrThrow();
	const conv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Test msg 3") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});
	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});

	const mappings = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.execute();

	expect(mappings).toHaveLength(1);
});

test("detachConversation should remove the mapping", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config-4",
			value: { setting: "value4" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config-4")
		.selectAll()
		.executeTakeFirstOrThrow();
	const conv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Test msg 4") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});

	const before = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.executeTakeFirst();
	expect(before).toBeDefined();

	await detachConversation({
		lix,
		entity: keyValue,
		conversation: { id: conv.id },
	});

	const after = await lix.db
		.selectFrom("entity_conversation")
		.where("entity_id", "=", keyValue.key)
		.where("schema_key", "=", "lix_key_value")
		.where("file_id", "=", "lix")
		.where("conversation_id", "=", conv.id)
		.selectAll()
		.executeTakeFirst();
	expect(after).toBeUndefined();
});

test("entity can have multiple conversations", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "multi-conv-config",
			value: { setting: "multivalue" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "multi-conv-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	const c1 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("C1") }],
	});
	const c2 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("C2") }],
	});
	const c3 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("C3") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: c1.id },
	});
	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: c2.id },
	});
	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: c3.id },
	});

	const rows = await lix.db
		.selectFrom("conversation")
		.innerJoin(
			"entity_conversation",
			"entity_conversation.conversation_id",
			"conversation.id"
		)
		.where("entity_conversation.entity_id", "=", keyValue.key)
		.where("entity_conversation.schema_key", "=", "lix_key_value")
		.where("entity_conversation.file_id", "=", "lix")
		.select(["conversation.id"])
		.execute();

	expect(rows).toHaveLength(3);
	expect(rows.map((t) => t.id)).toContain(c1.id);
	expect(rows.map((t) => t.id)).toContain(c2.id);
	expect(rows.map((t) => t.id)).toContain(c3.id);
});
