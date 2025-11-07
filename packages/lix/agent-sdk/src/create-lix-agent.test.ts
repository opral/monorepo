import { describe, expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import type { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV2, simulateReadableStream } from "ai/test";
import { appendDefaultSystemPrompt } from "./system-prompt.js";
import { createLixAgent } from "./create-lix-agent.js";
import { sendMessage } from "./send-message.js";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";

const STREAM_FINISH_CHUNKS: LanguageModelV2StreamPart[] = [
	{ type: "stream-start", warnings: [] },
	{ type: "text-start", id: "text-1" },
	{ type: "text-delta", id: "text-1", delta: "ok" },
	{ type: "text-end", id: "text-1" },
	{
		type: "finish",
		finishReason: "stop",
		usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
	},
];

function createStreamingModel() {
	return new MockLanguageModelV2({
		doStream: async () => ({
			stream: simulateReadableStream<LanguageModelV2StreamPart>({
				chunks: STREAM_FINISH_CHUNKS,
			}),
		}),
	});
}

describe("createLixAgent context", () => {
	test("injects context overlay into system prompt", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();

		const agent = await createLixAgent({ lix, model });
		agent.setContext("active_file", "/app.tsx");

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("hello"),
		});

		await stream.complete();

		const call = model.doStreamCalls.at(-1);
		expect(call).toBeDefined();
		const systemMessage = call!.prompt.find(
			(message) => message.role === "system"
		);
		expect(systemMessage).toBeDefined();
		expect(systemMessage!.content).toContain("active_file: /app.tsx");
		expect(systemMessage!.content).toMatch(/active_version: id=.+, name=.+/);
	});

	test("appendDefaultSystemPrompt merges the default prompt", () => {
		const prompt = appendDefaultSystemPrompt("You are using flashtype...");
		expect(prompt).toContain("You are the Lix Agent.");
		expect(prompt).toContain("You are using flashtype...");
	});

	test("honors a provided system prompt", async () => {
		const lix = await openLix({});
		const model = createStreamingModel();

		const systemPrompt = appendDefaultSystemPrompt(
			"You are using flashtype..."
		);
		const agent = await createLixAgent({ lix, model, systemPrompt });

		const stream = sendMessage({
			agent,
			prompt: fromPlainText("hello"),
		});

		await stream.complete();

		const call = model.doStreamCalls.at(-1);
		expect(call).toBeDefined();
		const systemMessage = call!.prompt.find(
			(message) => message.role === "system"
		);
		expect(systemMessage).toBeDefined();
		expect(systemMessage!.content).toContain("You are using flashtype...");
	});
});
