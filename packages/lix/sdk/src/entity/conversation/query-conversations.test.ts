import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { attachConversation } from "./attach-conversation.js";
import { createConversation } from "../../conversation/create-conversation.js";
import { ebEntity } from "../eb-entity.js";
import { fromPlainText } from "@opral/zettel-ast";

test("query all conversations for a specific entity", async () => {
	const lix = await openLix({});

	// Create a label entity
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

	// Create multiple conversations for the entity
	const c1 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("First conversation") }],
	});
	const c2 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Second conversation") }],
	});
	const c3 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Third conversation") }],
	});

	// Create mappings
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

	// Query conversations for the entity
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
		.select(["conversation.id", "conversation.metadata"])
		.execute();

	expect(rows).toHaveLength(3);
	expect(rows.map((t) => t.id).sort()).toEqual([c1.id, c2.id, c3.id].sort());
});

test("query conversations using ebEntity helper", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "entity-config-1",
			value: { setting: "entity1" },
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "entity-config-2",
			value: { setting: "entity2" },
			lixcol_version_id: "global",
		})
		.execute();

	const keyValue1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "entity-config-1")
		.selectAll()
		.executeTakeFirstOrThrow();
	const keyValue2 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "entity-config-2")
		.selectAll()
		.executeTakeFirstOrThrow();

	const c1 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Conv for entity 1") }],
	});
	const c2 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Another conv for entity 1") }],
	});
	const c3 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Conv for entity 2") }],
	});

	await attachConversation({
		lix,
		entity: keyValue1,
		conversation: { id: c1.id },
	});
	await attachConversation({
		lix,
		entity: keyValue1,
		conversation: { id: c2.id },
	});
	await attachConversation({
		lix,
		entity: keyValue2,
		conversation: { id: c3.id },
	});

	const rows1 = await lix.db
		.selectFrom("conversation_all")
		.innerJoin(
			"entity_conversation_all",
			"entity_conversation_all.conversation_id",
			"conversation_all.id"
		)
		.where("conversation_all.lixcol_version_id", "=", "global")
		.where("entity_conversation_all.lixcol_version_id", "=", "global")
		.where(
			ebEntity("entity_conversation_all").equals({
				entity_id: keyValue1.key,
				schema_key: "lix_key_value",
				file_id: "lix",
			})
		)
		.select(["conversation_all.id"])
		.execute();
	expect(rows1).toHaveLength(2);
	expect(rows1.map((t) => t.id).sort()).toEqual([c1.id, c2.id].sort());

	const rows2 = await lix.db
		.selectFrom("conversation_all")
		.innerJoin(
			"entity_conversation_all",
			"entity_conversation_all.conversation_id",
			"conversation_all.id"
		)
		.where("conversation_all.lixcol_version_id", "=", "global")
		.where("entity_conversation_all.lixcol_version_id", "=", "global")
		.where(
			ebEntity("entity_conversation_all").equals({
				entity_id: keyValue2.key,
				schema_key: "lix_key_value",
				file_id: "lix",
			})
		)
		.select(["conversation_all.id"])
		.execute();
	expect(rows2).toHaveLength(1);
	expect(rows2[0]?.id).toBe(c3.id);
});

test("query entities with conversations and message counts", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "with-convs",
			value: { threads: true },
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "without-convs",
			value: { threads: false },
			lixcol_version_id: "global",
		})
		.execute();
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "one-conv",
			value: { threads: "one" },
			lixcol_version_id: "global",
		})
		.execute();

	const e1 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "with-convs")
		.selectAll()
		.executeTakeFirstOrThrow();
	const e2 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "without-convs")
		.selectAll()
		.executeTakeFirstOrThrow();
	const e3 = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "one-conv")
		.selectAll()
		.executeTakeFirstOrThrow();

	const c1 = await createConversation({
		lix,
		comments: [fromPlainText("A"), fromPlainText("B"), fromPlainText("C")].map(
			(b) => ({ body: b })
		),
	});
	const c2 = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Single") }],
	});
	const c3 = await createConversation({
		lix,
		comments: [
			{ body: fromPlainText("Comment A") },
			{ body: fromPlainText("Comment B") },
		],
	});

	await attachConversation({ lix, entity: e1, conversation: { id: c1.id } });
	await attachConversation({ lix, entity: e1, conversation: { id: c2.id } });
	await attachConversation({ lix, entity: e3, conversation: { id: c3.id } });

	const entitiesWithConvs = await lix.db
		.selectFrom("entity_conversation")
		.innerJoin(
			"conversation",
			"conversation.id",
			"entity_conversation.conversation_id"
		)
		.leftJoin(
			"conversation_message",
			"conversation_message.conversation_id",
			"conversation.id"
		)
		.where("entity_conversation.file_id", "=", "lix")
		.where("entity_conversation.schema_key", "=", "lix_key_value")
		.select([
			"entity_conversation.entity_id",
			"entity_conversation.schema_key",
			"conversation.id as conversation_id",
			(eb) => eb.fn.count("conversation_message.id").as("message_count"),
		])
		.groupBy([
			"entity_conversation.entity_id",
			"entity_conversation.schema_key",
			"conversation.id",
		])
		.execute();

	const e1Rows = entitiesWithConvs.filter((e) => e.entity_id === e1.key);
	expect(e1Rows).toHaveLength(2);
	expect(e1Rows.find((t) => t.conversation_id === c1.id)?.message_count).toBe(
		3
	);
	expect(e1Rows.find((t) => t.conversation_id === c2.id)?.message_count).toBe(
		1
	);

	const e3Rows = entitiesWithConvs.filter((e) => e.entity_id === e3.key);
	expect(e3Rows).toHaveLength(1);
	expect(e3Rows[0]?.message_count).toBe(2);

	const e2Rows = entitiesWithConvs.filter((e) => e.entity_id === e2.key);
	expect(e2Rows).toHaveLength(0);
});

test("query conversations across different entity types", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "test-config",
			value: { test: true },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.insertInto("change_set_all")
		.values({ id: "test-change-set", lixcol_version_id: "global" })
		.execute();
	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", "test-change-set")
		.selectAll()
		.executeTakeFirstOrThrow();

	const labelConv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Conv on label") }],
	});
	const changeSetConv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Conv on change set") }],
	});

	await attachConversation({
		lix,
		entity: keyValue,
		conversation: { id: labelConv.id },
	});
	await attachConversation({
		lix,
		entity: changeSet,
		conversation: { id: changeSetConv.id },
	});

	const allMappings = await lix.db
		.selectFrom("entity_conversation")
		.innerJoin(
			"conversation",
			"conversation.id",
			"entity_conversation.conversation_id"
		)
		.select([
			"entity_conversation.entity_id",
			"entity_conversation.schema_key",
			"conversation.id as conversation_id",
		])
		.execute();

	expect(allMappings).toHaveLength(2);
	const schemaKeys = [...new Set(allMappings.map((m) => m.schema_key))];
	expect(schemaKeys).toContain("lix_key_value");
	expect(schemaKeys).toContain("lix_change_set");
});
