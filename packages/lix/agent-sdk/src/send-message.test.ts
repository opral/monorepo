import { beforeEach, describe, expect, test } from "vitest";
import { openLix, mockJsonPlugin } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { ContextStore } from "./context/context-store.js";
import { createSendMessage } from "./send-message.js";
import type {
	ChatMessage,
	AgentConversationMessageMetadata,
} from "./conversation-message.js";

const STREAM_FINISH_CHUNKS: LanguageModelV2StreamPart[] = [
	{ type: "stream-start", warnings: [] },
	{
		type: "finish",
		finishReason: "stop",
		usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
	},
];

function createStreamingModel() {
	return new MockLanguageModelV2({
		doStream: async (options) => {
			const apply = (globalThis as any).__testApplyTools as
				| ((
						opts: typeof options
				  ) =>
						| Promise<LanguageModelV2StreamPart[]>
						| LanguageModelV2StreamPart[]
						| void)
				| undefined;
			const events = await apply?.(options);

			const chunks = Array.isArray(events) ? events : STREAM_FINISH_CHUNKS;
			return {
				stream: simulateReadableStream<LanguageModelV2StreamPart>({
					chunks,
				}),
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

beforeEach(() => {
	(globalThis as any).__testApplyTools = undefined;
});

describe("createSendMessage", () => {
	test("records tool steps for each turn and persists file writes", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const history: ChatMessage[] = [];
		const contextStore = new ContextStore();
		let systemInstruction = "You are the Lix Agent.";

		const sendMessage = createSendMessage({
			lix,
			model,
			history,
			contextStore,
			getSystemInstruction: () => systemInstruction,
			setSystemInstruction: (value) => {
				systemInstruction = value;
			},
		});

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const versionId = activeVersion.version_id as string;

		(globalThis as any).__testApplyTools = async () =>
			createToolCallStreamChunks({
				toolCallId: "call-one",
				input: {
					version_id: versionId,
					path: "/turn-one.txt",
					content: "one",
				},
				text: "turn-one-complete",
			});
		const streamOne = await sendMessage({ text: "turn one" });
		await streamOne.drain();
		const turnOne = await streamOne.done;

		const firstAssistantMessage = history
			.filter((msg) => msg.role === "assistant")
			.at(-1);
		expect(firstAssistantMessage?.metadata).toBeTruthy();
		const firstMetadata = firstAssistantMessage?.metadata as
			| AgentConversationMessageMetadata
			| undefined;
		expect(firstMetadata?.lix_agent_sdk_steps).toBeDefined();
		expect(firstMetadata?.lix_agent_sdk_steps?.length).toBeGreaterThan(0);
		const firstStep = firstMetadata?.lix_agent_sdk_steps?.[0];
		expect(firstStep?.tool_name).toBe("write_file");
		expect(firstStep?.status).toBe("succeeded");
		expect(turnOne.steps.at(0)?.tool_name).toBe("write_file");
		expect(turnOne.steps.at(0)?.status).toBe("succeeded");

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

		(globalThis as any).__testApplyTools = async () =>
			createToolCallStreamChunks({
				toolCallId: "call-two",
				input: {
					version_id: versionId,
					path: "/turn-two.txt",
					content: "two",
				},
				text: "turn-two-complete",
			});
		const streamTwo = await sendMessage({ text: "turn two" });
		await streamTwo.drain();
		const turnTwo = await streamTwo.done;

		const secondAssistantMessage = history
			.filter((msg) => msg.role === "assistant")
			.at(-1);
		const secondMetadata = secondAssistantMessage?.metadata as
			| AgentConversationMessageMetadata
			| undefined;
		expect(secondMetadata?.lix_agent_sdk_steps?.length).toBeGreaterThan(0);
		expect(secondMetadata?.lix_agent_sdk_steps?.[0]?.tool_name).toBe(
			"write_file"
		);
		expect(turnTwo.steps.at(0)?.tool_name).toBe("write_file");
		expect(turnTwo.steps.at(0)?.status).toBe("succeeded");

		const fileTwo = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/turn-two.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();
		expect(
			new TextDecoder("utf-8", { fatal: false }).decode(
				fileTwo.data as unknown as Uint8Array
			)
		).toBe("two");
	});
});

test("write_file tool persists structured data changes", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});
	const model = createStreamingModel();
	const history: ChatMessage[] = [];
	const contextStore = new ContextStore();
	let systemInstruction = "You are the Lix Agent.";

	const sendMessage = createSendMessage({
		lix,
		model,
		history,
		contextStore,
		getSystemInstruction: () => systemInstruction,
		setSystemInstruction: (value) => {
			systemInstruction = value;
		},
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select(["version_id"])
		.executeTakeFirstOrThrow();
	const versionId = activeVersion.version_id as string;

	(globalThis as any).__testApplyTools = async () =>
		createToolCallStreamChunks({
			toolCallId: "call-json",
			input: {
				version_id: versionId,
				path: "/data.json",
				content: JSON.stringify({ greeting: "hello" }),
			},
			text: "json-write-complete",
		});

	const stream = await sendMessage({ text: "write greeting" });
	await stream.drain();
	const finalTurn = await stream.done;

	const lastAssistantMessage = history
		.filter((msg) => msg.role === "assistant")
		.at(-1);
	expect(lastAssistantMessage).toBeTruthy();
	const metadata = lastAssistantMessage?.metadata as
		| AgentConversationMessageMetadata
		| undefined;
	expect(metadata?.lix_agent_sdk_steps?.length).toBeGreaterThan(0);
	expect(finalTurn.steps.at(0)?.tool_name).toBe("write_file");

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
});
