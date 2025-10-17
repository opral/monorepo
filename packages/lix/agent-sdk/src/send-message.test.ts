import { beforeEach, describe, expect, test } from "vitest";
import { openLix, mockJsonPlugin } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { ContextStore } from "./context/context-store.js";
import {
	createSendMessage,
	type AgentStreamResult,
	type ChatMessage,
} from "./send-message.js";

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
	test("uses a unique writer key for each turn that executes tools", async () => {
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
		const streamOne = await sendMessage({
			text: "turn one",
		});
		await streamOne.drain();
		const turnOne = await streamOne.done;

		const firstAssistantMessage = history
			.filter((msg) => msg.role === "assistant")
			.at(-1);
		expect(firstAssistantMessage?.metadata).toBeTruthy();
		const firstMetadata = firstAssistantMessage?.metadata as
			| {
					lix_agent_steps?: Array<Record<string, unknown>>;
					lix_agent_writer_key?: string;
			  }
			| undefined;
		expect(firstMetadata).toBeTruthy();
		expect(firstMetadata?.lix_agent_steps).toBeDefined();
		expect(firstMetadata?.lix_agent_steps?.length).toBeGreaterThan(0);
		const firstStep = firstMetadata?.lix_agent_steps?.[0];
		expect(firstStep?.tool_name).toBe("write_file");
		expect(firstStep?.status).toBe("succeeded");
		expect(typeof firstMetadata?.lix_agent_writer_key).toBe("string");
		expect(turnOne.writerKey).toBe(firstMetadata?.lix_agent_writer_key ?? null);
		expect(turnOne.detectedChangesQuery).toBeTruthy();

		const row1 = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/turn-one.txt")
			.select(["lixcol_writer_key"])
			.executeTakeFirstOrThrow();
		expect((row1 as any).lixcol_writer_key).toBe(
			firstMetadata?.lix_agent_writer_key
		);

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
		const streamTwo = await sendMessage({
			text: "turn two",
		});
		await streamTwo.drain();
		const turnTwo = await streamTwo.done;

		const secondAssistantMessage = history
			.filter((msg) => msg.role === "assistant")
			.at(-1);
		const secondMetadata = secondAssistantMessage?.metadata as
			| {
					lix_agent_steps?: Array<Record<string, unknown>>;
					lix_agent_writer_key?: string;
			  }
			| undefined;
		expect(secondMetadata).toBeTruthy();
		expect(secondMetadata?.lix_agent_steps?.length).toBeGreaterThan(0);
		expect(secondMetadata?.lix_agent_steps?.[0]?.tool_name).toBe("write_file");
		expect(turnOne.steps.at(0)?.tool_name).toBe("write_file");
		expect(turnTwo.steps.at(0)?.tool_name).toBe("write_file");
		expect(turnTwo.writerKey).toBe(
			secondMetadata?.lix_agent_writer_key ?? null
		);
		expect(turnTwo.detectedChangesQuery).toBeTruthy();

		const row2 = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/turn-two.txt")
			.select(["lixcol_writer_key"])
			.executeTakeFirstOrThrow();
		expect((row2 as any).lixcol_writer_key).toBe(
			secondMetadata?.lix_agent_writer_key
		);

		const writer1 = (row1 as any).lixcol_writer_key as string | null;
		const writer2 = (row2 as any).lixcol_writer_key as string | null;
		expect(writer1).toBeTruthy();
		expect(writer2).toBeTruthy();
		expect(writer1).not.toBe(writer2);
		expect(writer1?.startsWith("lix_agent:")).toBe(true);
		expect(writer2?.startsWith("lix_agent:")).toBe(true);
	});
});

test("records detected changes attributed to the agent writer key", async () => {
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

	const stream = await sendMessage({
		text: "write greeting",
	});
	await stream.drain();
	const finalTurn = await stream.done;

	const lastAssistantMessage = history
		.filter((msg) => msg.role === "assistant")
		.at(-1);
	expect(lastAssistantMessage).toBeTruthy();
	const metadata = lastAssistantMessage?.metadata as
		| {
				lix_agent_writer_key?: string;
		  }
		| undefined;

	const writerKey = metadata?.lix_agent_writer_key;
	expect(typeof writerKey).toBe("string");
	expect(finalTurn.writerKey).toBe(writerKey ?? null);
	expect(finalTurn.detectedChangesQuery).toBeTruthy();

	const rows =
		(await finalTurn.detectedChangesQuery
			?.select([
				"entity_id",
				"schema_key",
				"plugin_key",
				"version_id",
				"snapshot_content",
			])
			.execute()) ?? [];
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
