import { test, expect } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { LixEntityConversationSchema } from "./schema-definition.js";
import { attachConversation } from "./attach-conversation.js";
import { createConversation } from "../../conversation/create-conversation.js";
import { createConversationMessage } from "../../conversation/create-conversation-message.js";
import { fromPlainText } from "@opral/zettel-ast";

test("entity_conversation schema should be properly defined", () => {
	expect(LixEntityConversationSchema["x-lix-key"]).toBe(
		"lix_entity_conversation"
	);
	expect(LixEntityConversationSchema["x-lix-version"]).toBe("1.0");
	expect(LixEntityConversationSchema["x-lix-primary-key"]).toEqual([
		"/entity_id",
		"/schema_key",
		"/file_id",
		"/conversation_id",
	]);

	expect(LixEntityConversationSchema["x-lix-foreign-keys"]).toHaveLength(2);
	expect(LixEntityConversationSchema["x-lix-foreign-keys"]![0]).toEqual({
		properties: ["/entity_id", "/schema_key", "/file_id"],
		references: {
			schemaKey: "state",
			properties: ["/entity_id", "/schema_key", "/file_id"],
		},
	});
	expect(LixEntityConversationSchema["x-lix-foreign-keys"]![1]).toEqual({
		properties: ["/conversation_id"],
		references: { schemaKey: "lix_conversation", properties: ["/id"] },
	});

	expect(LixEntityConversationSchema.properties).toEqual({
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
		conversation_id: { type: "string" },
	});

	expect(LixEntityConversationSchema.required).toEqual([
		"entity_id",
		"schema_key",
		"file_id",
		"conversation_id",
	]);
});

test("conversation_message supports metadata via createConversationMessage", async () => {
	const lix = await openLix({});
	const conv = await createConversation({ lix });
	const c = await createConversationMessage({
		lix,
		conversation_id: conv.id,
		body: fromPlainText("world"),
		lixcol_metadata: {
			test_role: "assistant",
			test_steps: [
				{
					id: "step-1",
					kind: "thought",
					label: "Initial reasoning",
					status: "complete",
				},
				{
					id: "step-2",
					kind: "tool_call",
					label: "List files",
					status: "running",
					invocation_id: "call-123",
				},
			],
		},
	});
	expect(c.lixcol_metadata).toEqual({
		test_role: "assistant",
		test_steps: [
			{
				id: "step-1",
				kind: "thought",
				label: "Initial reasoning",
				status: "complete",
			},
			{
				id: "step-2",
				kind: "tool_call",
				label: "List files",
				status: "running",
				invocation_id: "call-123",
			},
		],
	});
});

test("entity_conversation foreign key to state table should be enforced", async () => {
	const lix = await openLix({});
	const conv = await createConversation({
		lix,
		comments: [{ body: fromPlainText("Test") }],
	});

	await expect(
		attachConversation({
			lix,
			entity: {
				entity_id: "non-existent-id",
				schema_key: "lix_key_value",
				file_id: "lix",
			},
			conversation: { id: conv.id },
		})
	).rejects.toThrow(/Foreign key constraint violation/);
});

test("entity_conversation foreign key to conversation table should be enforced", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "test-config",
			value: { setting: "testvalue" },
			lixcol_version_id: "global",
		})
		.execute();
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "test-config")
		.selectAll()
		.executeTakeFirstOrThrow();

	await expect(
		attachConversation({
			lix,
			entity: keyValue,
			conversation: { id: "non-existent-conv-id" },
		})
	).rejects.toThrow(/Foreign key constraint violation/);
});
