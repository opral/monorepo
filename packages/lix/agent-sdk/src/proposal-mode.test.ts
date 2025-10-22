import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import { createLixAgent } from "./create-lix-agent.js";
import { sendMessage } from "./send-message.js";
import type { ChangeProposalEvent } from "./proposal-mode.js";

const STREAM_FINISH_CHUNKS: LanguageModelV2StreamPart[] = [
	{ type: "stream-start", warnings: [] },
	{ type: "text-start", id: "text-1" },
	{ type: "text-delta", id: "text-1", delta: "done" },
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
	toolName = "write_file",
}: {
	toolCallId: string;
	input: Record<string, unknown>;
	text: string;
	toolName?: string;
}): LanguageModelV2StreamPart[] {
	return [
		{ type: "stream-start", warnings: [] },
		{
			type: "tool-call",
			toolCallId,
			toolName,
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

describe("proposal review mode", () => {
	test("active version stays untouched until proposal changes are accepted", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersionRow = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();

		const activeVersionId = activeVersionRow.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "review-write",
				input: {
					version_id: activeVersionId,
					path: "/review.txt",
					content: "review",
				},
				text: "review-complete",
			})
		);

		const proposalEvents: ChangeProposalEvent[] = [];
		let resolveProposal!: (event: ChangeProposalEvent) => void;
		const proposalReceived = new Promise<ChangeProposalEvent>((resolve) => {
			resolveProposal = resolve;
		});

		const turn = await sendMessage({
			agent,
			prompt: fromPlainText("write to review"),
			proposalMode: true,
			onChangeProposal: (event: ChangeProposalEvent) => {
				proposalEvents.push(event);
				resolveProposal(event);
			},
		});
		const pendingAssistant = turn.toPromise();

		await proposalReceived;

		expect(proposalEvents).toHaveLength(1);
		const [proposalEvent] = proposalEvents;
		expect(proposalEvent?.status).toBe("open");
		expect(proposalEvent?.proposal.target_version_id).toBe(activeVersionId);
		expect(proposalEvent?.proposal.source_version_id).not.toBe(activeVersionId);
		expect(typeof proposalEvent?.proposal.id).toBe("string");
		expect(proposalEvent?.toolName).toBe("write_file");

		const activeFile = await lix.db
			.selectFrom("file_all")
			.where("lixcol_version_id", "=", activeVersionId as any)
			.where("path", "=", "/review.txt")
			.select(["id"])
			.executeTakeFirst();
		expect(activeFile).toBeUndefined();

		await turn.acceptChanges();
		await pendingAssistant;
		expect(proposalEvents).toHaveLength(2);
		const acceptedEvent = proposalEvents[1];
		expect(acceptedEvent?.status).toBe("accepted");
		expect(acceptedEvent?.proposal.id).toBe(proposalEvent?.proposal.id);

		const mergedFile = await lix.db
			.selectFrom("file_all")
			.where("lixcol_version_id", "=", activeVersionId as any)
			.where("path", "=", "/review.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();

		const text = new TextDecoder("utf-8", { fatal: false }).decode(
			mergedFile.data as unknown as Uint8Array
		);
		expect(text).toBe("review");
	});

	test("proposal mode disabled writes directly to the active version", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersionRow = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersionRow.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "direct-write",
				input: {
					version_id: activeVersionId,
					path: "/direct.txt",
					content: "direct",
				},
				text: "direct-complete",
			})
		);

		const turn = await sendMessage({
			agent,
			prompt: fromPlainText("write directly"),
		});
		await turn.toPromise();

		const file = await lix.db
			.selectFrom("file_all")
			.where("lixcol_version_id", "=", activeVersionId as any)
			.where("path", "=", "/direct.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();
		const text = new TextDecoder("utf-8", { fatal: false }).decode(
			file.data as unknown as Uint8Array
		);
		expect(text).toBe("direct");
	});

	test("delete proposals emit file metadata for review", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersionRow = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersionRow.version_id as string;

		await lix.db
			.insertInto("file_all")
			.values({
				path: "/remove.md",
				data: new TextEncoder().encode("obsolete"),
				lixcol_version_id: activeVersionId as unknown as any,
			})
			.execute();

		const existingFile = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/remove.md")
			.where("lixcol_version_id", "=", activeVersionId as unknown as any)
			.select(["id"])
			.executeTakeFirstOrThrow();

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "delete-call",
				input: {
					version_id: activeVersionId,
					path: "/remove.md",
				},
				text: "delete-complete",
				toolName: "delete_file",
			})
		);

		const events: ChangeProposalEvent[] = [];
		let resolveOpen!: (event: ChangeProposalEvent) => void;
		const openEventPromise = new Promise<ChangeProposalEvent>((resolve) => {
			resolveOpen = resolve;
		});

		const turn = await sendMessage({
			agent,
			prompt: fromPlainText("delete file"),
			proposalMode: true,
			onChangeProposal: (event: ChangeProposalEvent) => {
				events.push(event);
				if (event.status === "open") {
					resolveOpen(event);
				}
			},
		});
		const pendingAssistant = turn.toPromise();

		const openEvent = await openEventPromise;
		expect(openEvent.status).toBe("open");
		expect(openEvent.fileId).toBe(String(existingFile.id));
		expect(openEvent.filePath).toBe("/remove.md");

		await turn.acceptChanges();
		await pendingAssistant;

		expect(events.some((event) => event.status === "accepted")).toBe(true);

		const remaining = await lix.db
			.selectFrom("file_all")
			.where("path", "=", "/remove.md")
			.where("lixcol_version_id", "=", activeVersionId as unknown as any)
			.select(["id"])
			.executeTakeFirst();
		expect(remaining).toBeUndefined();
	});
});
