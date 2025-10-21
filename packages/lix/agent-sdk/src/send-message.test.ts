import { describe, expect, test } from "vitest";
import { openLix, mockJsonPlugin } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import { createLixAgent, getAgentState } from "./create-lix-agent.js";
import { sendMessage } from "./send-message.js";
import { persistConversation } from "./conversation-storage.js";

const STREAM_FINISH_CHUNKS: LanguageModelV2StreamPart[] = [
	{ type: "stream-start", warnings: [] },
	{ type: "text-start", id: "text-1" },
	{ type: "text-delta", id: "text-1", delta: "response" },
	{ type: "text-end", id: "text-1" },
	{
		type: "finish",
		finishReason: "stop",
		usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
	},
];

type ToolHandler = (
	options: Parameters<MockLanguageModelV2["doStream"]>[0]
) =>
	| Promise<LanguageModelV2StreamPart[] | void>
	| LanguageModelV2StreamPart[]
	| void;

function createStreamingModel() {
	let handler: ToolHandler | undefined;
	let handlerConsumed = false;
	const model = new MockLanguageModelV2({
		doStream: async (options) => {
			const events = await handler?.(options);
			const chunks = Array.isArray(events) ? events : STREAM_FINISH_CHUNKS;
			return {
				stream: simulateReadableStream<LanguageModelV2StreamPart>({
					chunks,
				}),
			};
		},
	});
	return Object.assign(model, {
		setToolHandler(next?: ToolHandler) {
			handlerConsumed = false;
			if (!next) {
				handler = undefined;
				return;
			}
			handler = (options) => {
				if (handlerConsumed) {
					return STREAM_FINISH_CHUNKS;
				}
				handlerConsumed = true;
				return next(options);
			};
		},
	});
}

function createToolCallStreamChunks({
	toolCallId,
	input,
	text,
}: {
	toolCallId: string;
	input: Record<string, unknown>;
	text: string;
}): LanguageModelV2StreamPart[] {
	return [
		{ type: "stream-start", warnings: [] },
		{
			type: "tool-call",
			toolCallId,
			toolName: "write_file",
			input: JSON.stringify(input),
		},
		{ type: "text-start", id: "text-1" },
		{ type: "text-delta", id: "text-1", delta: text },
		{ type: "text-end", id: "text-1" },
		{
			type: "finish",
			finishReason: "stop",
			usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
		},
	];
}

describe("sendMessage", () => {
	test("streams tool steps and updates the conversation", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const versionId = activeVersion.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "call-one",
				input: {
					version_id: versionId,
					path: "/turn-one.txt",
					content: "one",
				},
				text: "turn-one-complete",
			})
		);

		const turnOne = await sendMessage({
			agent,
			prompt: fromPlainText("turn one"),
		});
		const assistantOne = await turnOne.toPromise();

		expect(assistantOne.lixcol_metadata?.lix_agent_sdk_role).toBe("assistant");
		expect(
			assistantOne.lixcol_metadata?.lix_agent_sdk_steps?.[0]?.tool_name
		).toBe("write_file");

		const conversationId = turnOne.conversationId;
		const rowsAfterOne = await lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", conversationId)
			.select(["id"])
			.execute();
		expect(rowsAfterOne).toHaveLength(2);

		const fileOne = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/turn-one.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(
			new TextDecoder("utf-8", { fatal: false }).decode(
				fileOne.data as unknown as Uint8Array
			)
		).toBe("one");

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "call-two",
				input: {
					version_id: versionId,
					path: "/turn-two.txt",
					content: "two",
				},
				text: "turn-two-complete",
			})
		);

		const turnTwo = await sendMessage({
			agent,
			prompt: fromPlainText("turn two"),
			conversationId,
		});

		const assistantTwo = await turnTwo.toPromise();

		expect(
			assistantTwo.lixcol_metadata?.lix_agent_sdk_steps?.[0]?.tool_name
		).toBe("write_file");

		const rowsAfterTwo = await lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", conversationId)
			.select(["id"])
			.execute();
		expect(rowsAfterTwo).toHaveLength(4);
		expect(getAgentState(agent).conversation.messages).toHaveLength(4);
	}, 20000);

	test("does not persist messages when persist is false", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const turn = await sendMessage({
			agent,
			prompt: fromPlainText("draft message"),
			persist: false,
		});

		await turn.toPromise();

		const storedConversation = await lix.db
			.selectFrom("conversation")
			.where("id", "=", turn.conversationId)
			.select(["id"])
			.executeTakeFirst();
		expect(storedConversation).toBeUndefined();

		const storedMessages = await lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", turn.conversationId)
			.select(["id"])
			.execute();
		expect(storedMessages).toHaveLength(0);

		await lix.close();
	});

	test("persistConversation writes the conversation to Lix", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const result = await sendMessage({
			agent,
			prompt: fromPlainText("hello there"),
			persist: false,
		});

		await result.toPromise();

		const inMemoryConversation = getAgentState(agent).conversation;
		const persisted = await persistConversation({
			lix,
			conversation: inMemoryConversation,
		});

		expect(persisted.id).toBeTruthy();

		const rows = await lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", persisted.id as string)
			.select(["id"])
			.execute();
		expect(rows).toHaveLength(inMemoryConversation.messages.length);
	});

	test("write_file tool persists structured data changes", async () => {
		const lix = await openLix({ providePlugins: [mockJsonPlugin] });
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const versionId = activeVersion.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "call-json",
				input: {
					version_id: versionId,
					path: "/data.json",
					content: JSON.stringify({ greeting: "hello" }),
				},
				text: "json-write-complete",
			})
		);

		const result = await sendMessage({
			agent,
			prompt: fromPlainText("write greeting"),
		});

		await result.toPromise();

		const rows = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "mock_json_property" as any)
			.select([
				"entity_id",
				"schema_key",
				"plugin_key",
				"version_id",
				"snapshot_content",
			])
			.execute();

		const greetingRow = rows.find((row) => row.entity_id === "greeting");
		expect(greetingRow).toBeTruthy();
		expect(greetingRow?.schema_key).toBe("mock_json_property");
		expect(greetingRow?.plugin_key).toBe("mock_json_plugin");
		expect(greetingRow?.version_id).toBe(versionId);
		const snapshot =
			typeof greetingRow?.snapshot_content === "string"
				? JSON.parse(greetingRow.snapshot_content as string)
				: greetingRow?.snapshot_content;
		expect(snapshot).toEqual({ value: "hello" });
	}, 20000);
});
