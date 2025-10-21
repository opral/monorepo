import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { clearConversation } from "./clear";
import { createConversation, createConversationMessage } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";

describe("clearConversation", () => {
	test("clears history, deletes old conversation, and creates a new one", async () => {
		const lix = await openLix({});
		const firstConversation = await createConversation({
			lix,
			versionId: "global",
		});
		await createConversationMessage({
			lix,
			conversation_id: firstConversation.id,
			body: fromPlainText("Hello world"),
		});
		await createConversationMessage({
			lix,
			conversation_id: firstConversation.id,
			body: fromPlainText("Second message"),
		});

		await setConversationKey(lix, String(firstConversation.id));

		const oldPointer = await getConversationId(lix);
		const newId = await clearConversation({ lix, agent: null });
		expect(newId).toBe(oldPointer);

		const pointer = await getConversationId(lix);
		expect(pointer).toBe(newId);

		const oldMessageCount = await countMessages(
			lix,
			String(firstConversation.id),
		);
		expect(oldMessageCount).toBe(0);

		const oldConversation = await lix.db
			.selectFrom("conversation_all")
			.where("id", "=", String(firstConversation.id))
			.where("lixcol_version_id", "=", "global")
			.select("id")
			.executeTakeFirstOrThrow();
		expect(oldConversation.id).toBe(String(firstConversation.id));
	});

	test("handles cases with no prior conversation", async () => {
		const lix = await openLix({});
		const newId = await clearConversation({ lix, agent: null });
		expect(newId).toBeNull();
		const pointer = await getConversationId(lix);
		expect(pointer).toBeNull();
	});
});

const CONVERSATION_KEY = "lix_agent_conversation_id";

async function getConversationId(lix: Awaited<ReturnType<typeof openLix>>) {
	const ptr = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", CONVERSATION_KEY)
		.select(["value"])
		.executeTakeFirst();
	return typeof ptr?.value === "string" ? (ptr.value as string) : null;
}

async function setConversationKey(
	lix: Awaited<ReturnType<typeof openLix>>,
	id: string,
) {
	await lix.db.transaction().execute(async (trx) => {
		const existing = await trx
			.selectFrom("key_value_all")
			.where("lixcol_version_id", "=", "global")
			.where("key", "=", CONVERSATION_KEY)
			.select(["key"])
			.executeTakeFirst();
		if (existing) {
			await trx
				.updateTable("key_value_all")
				.set({ value: id, lixcol_untracked: true })
				.where("key", "=", CONVERSATION_KEY)
				.where("lixcol_version_id", "=", "global")
				.execute();
		} else {
			await trx
				.insertInto("key_value_all")
				.values({
					key: CONVERSATION_KEY,
					value: id,
					lixcol_version_id: "global",
					lixcol_untracked: true,
				})
				.execute();
		}
	});
}

async function countMessages(
	lix: Awaited<ReturnType<typeof openLix>>,
	conversationId: string,
) {
	const row = await lix.db
		.selectFrom("conversation_message_all")
		.where("conversation_id", "=", conversationId)
		.where("lixcol_version_id", "=", "global")
		.select(({ fn }) => fn.countAll<number>().as("count"))
		.executeTakeFirstOrThrow();
	return row.count;
}
