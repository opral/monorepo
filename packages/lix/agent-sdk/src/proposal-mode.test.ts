import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import {
	createLixAgent,
	getChangeProposalSummary,
} from "./create-lix-agent.js";
import { sendMessage } from "./send-message.js";
import type { AgentEvent } from "./types.js";

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

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

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

		let openEvent: Extract<AgentEvent, { type: "proposal:open" }> | undefined;
		let openSummary = null as ReturnType<
			typeof getChangeProposalSummary
		> | null;
		let accepted = false;

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("write to review"),
			proposalMode: true,
		});

		for await (const event of stream) {
			if (event.type === "proposal:open") {
				openEvent = event;
				const summary = getChangeProposalSummary(agent, event.proposal.id);
				openSummary = summary;
				expect(summary?.target_version_id).toBe(activeVersionId);
				expect(summary?.source_version_id).not.toBe(activeVersionId);
				const proposalsOpen = await lix.db
					.selectFrom("change_proposal")
					.select(["id"])
					.execute();
				expect(proposalsOpen).toHaveLength(1);
				const activeFile = await lix.db
					.selectFrom("file_by_version")
					.where("lixcol_version_id", "=", activeVersionId as any)
					.where("path", "=", "/review.txt")
					.select(["id"])
					.executeTakeFirst();
				expect(activeFile).toBeUndefined();
				await event.accept();
			} else if (
				event.type === "proposal:closed" &&
				event.status === "accepted"
			) {
				accepted = true;
			} else if (event.type === "done") {
				break;
			}
		}

		expect(openEvent).toBeTruthy();
		expect(openEvent).toBeTruthy();
		expect(openSummary?.target_version_id).toBe(activeVersionId);
		expect(openSummary?.source_version_id).not.toBe(activeVersionId);
		expect(openSummary?.filePath).toBe("/review.txt");
		expect(accepted).toBe(true);

		const mergedFile = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", activeVersionId as any)
			.where("path", "=", "/review.txt")
			.select(["data"])
			.executeTakeFirstOrThrow();
		const text = new TextDecoder("utf-8", { fatal: false }).decode(
			mergedFile.data as unknown as Uint8Array
		);
		expect(text).toBe("review");

		const proposalsAfter = await lix.db
			.selectFrom("change_proposal")
			.select(["id"])
			.execute();
		expect(proposalsAfter).toHaveLength(0);
	});

	test("rejecting a proposal aborts the turn", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "reject-write",
				input: {
					version_id: activeVersionId,
					path: "/reject.txt",
					content: "reject",
				},
				text: "should-not-complete",
			})
		);

		let rejected = false;
		let errorEvent: Extract<AgentEvent, { type: "error" }> | undefined;

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("reject proposal"),
			proposalMode: true,
		});

		for await (const event of stream) {
			if (event.type === "proposal:open") {
				await event.reject("no thanks");
			} else if (
				event.type === "proposal:closed" &&
				event.status === "rejected"
			) {
				rejected = true;
			} else if (event.type === "error") {
				errorEvent = event;
			} else if (event.type === "done") {
				break;
			}
		}

		expect(rejected).toBe(true);
		expect(errorEvent).toBeTruthy();

		const mergedFile = await lix.db
			.selectFrom("file_by_version")
			.where("lixcol_version_id", "=", activeVersionId as any)
			.where("path", "=", "/reject.txt")
			.select(["id"])
			.executeTakeFirst();
		expect(mergedFile).toBeUndefined();

		const proposalsAfterReject = await lix.db
			.selectFrom("change_proposal")
			.select(["id"])
			.execute();
		expect(proposalsAfterReject).toHaveLength(0);
	});

	test("rejecting a proposal cleans up the review version", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "reject-cleanup",
				input: {
					version_id: activeVersionId,
					path: "/reject-cleanup.txt",
					content: "reject-cleanup",
				},
				text: "cleanup",
			})
		);

		let reviewVersionId: string | null = null;

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("reject and cleanup proposal"),
			proposalMode: true,
		});

		for await (const event of stream) {
			if (event.type === "proposal:open") {
				const summary = getChangeProposalSummary(agent, event.proposal.id);
				reviewVersionId = summary?.source_version_id ?? null;
				expect(reviewVersionId).toBeTruthy();
				await event.reject("reject-cleanup");
			} else if (event.type === "done") {
				break;
			}
		}

		expect(reviewVersionId).toBeTruthy();

		const reviewVersion = await lix.db
			.selectFrom("version")
			.where("id", "=", reviewVersionId as unknown as any)
			.select(["id"])
			.executeTakeFirst();
		expect(reviewVersion).toBeUndefined();

		const proposalsAfterReject = await lix.db
			.selectFrom("change_proposal")
			.select(["id"])
			.execute();
		expect(proposalsAfterReject).toHaveLength(0);
	});

	test("proposal mode disabled writes directly to the active version", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

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

		await sendMessage({
			agent,
			prompt: fromPlainText("write directly"),
			proposalMode: false,
		}).complete({ autoAcceptProposals: true });

		const file = await lix.db
			.selectFrom("file_by_version")
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

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

		await lix.db
			.insertInto("file_by_version")
			.values({
				path: "/remove.md",
				data: new TextEncoder().encode("obsolete"),
				lixcol_version_id: activeVersionId as unknown as any,
			})
			.execute();

		const existingFile = await lix.db
			.selectFrom("file_by_version")
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

		let openEvent: Extract<AgentEvent, { type: "proposal:open" }> | undefined;
		let openSummary = null as ReturnType<
			typeof getChangeProposalSummary
		> | null;

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("delete file"),
			proposalMode: true,
		});

		for await (const event of stream) {
			if (event.type === "proposal:open") {
				openEvent = event;
				const summary = getChangeProposalSummary(agent, event.proposal.id);
				openSummary = summary;
				expect(summary?.fileId).toBe(String(existingFile.id));
				expect(summary?.filePath).toBe("/remove.md");
				await event.accept();
			} else if (event.type === "done") {
				break;
			}
		}

		expect(openEvent).toBeTruthy();
		const remaining = await lix.db
			.selectFrom("file_by_version")
			.where("path", "=", "/remove.md")
			.where("lixcol_version_id", "=", activeVersionId as unknown as any)
			.select(["id"])
			.executeTakeFirst();
		expect(remaining).toBeUndefined();
		expect(openSummary?.fileId).toBe(String(existingFile.id));
		expect(openSummary?.filePath).toBe("/remove.md");

		const proposalsAfterDelete = await lix.db
			.selectFrom("change_proposal")
			.select(["id"])
			.execute();
		expect(proposalsAfterDelete).toHaveLength(0);
	});

	test("aborting a turn discards the pending proposal", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();
		const agent = await createLixAgent({ lix, model });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"])
			.executeTakeFirstOrThrow();
		const activeVersionId = activeVersion.version_id as string;

		model.setToolHandler(() =>
			createToolCallStreamChunks({
				toolCallId: "abort-write",
				input: {
					version_id: activeVersionId,
					path: "/abort.txt",
					content: "abort",
				},
				text: "should-not-complete",
			})
		);

		const controller = new AbortController();
		const stream = sendMessage({
			agent,
			prompt: fromPlainText("abort proposal"),
			proposalMode: true,
			signal: controller.signal,
		});

		const events: AgentEvent[] = [];
		try {
			for await (const event of stream) {
				events.push(event);
				if (event.type === "proposal:open") {
					const proposalsOpen = await lix.db
						.selectFrom("change_proposal")
						.select(["id"])
						.execute();
					expect(proposalsOpen).toHaveLength(1);
					controller.abort("abort-turn");
				}
			}
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
		}

		const sawProposalOpen = events.some(
			(event) => event.type === "proposal:open"
		);
		expect(sawProposalOpen).toBe(true);
		const sawError = events.some((event) => event.type === "error");
		expect(sawError).toBe(true);

		const proposalsAfterAbort = await lix.db
			.selectFrom("change_proposal")
			.select(["id"])
			.execute();
		expect(proposalsAfterAbort).toHaveLength(0);
	});
});
