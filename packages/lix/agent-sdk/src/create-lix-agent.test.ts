import { describe, expect, test, vi } from "vitest";
import { openLix } from "@lix-js/sdk";
import { MockLanguageModelV2 } from "ai/test";

vi.mock("./send-message.js", () => ({
	sendMessageCore: vi.fn(async () => ({ text: "ok", usage: undefined })),
}));

import { sendMessageCore } from "./send-message.js";
import { createLixAgent } from "./create-lix-agent.js";
import { appendDefaultSystemPrompt } from "./system-prompt.js";

const sendMessageCoreMock = vi.mocked(sendMessageCore);

describe("createLixAgent context", () => {
	test("injects context overlay into system prompt", async () => {
		const lix = await openLix({});
		const model = new MockLanguageModelV2({
			doGenerate: async () => ({
				finishReason: "stop",
				usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
				content: [{ type: "text", text: "ok" }],
				warnings: [],
			}),
		});

		const agent = await createLixAgent({ lix, model });
		agent.setContext("active_file", "/app.tsx");
		await agent.sendMessage({ text: "hello" });

		expect(sendMessageCoreMock).toHaveBeenCalled();
		const call = sendMessageCoreMock.mock.calls.at(-1);
		expect(call).toBeDefined();
		const args = call![0];
		expect(typeof args.system).toBe("string");
		expect(args.system).toContain("active_file: /app.tsx");
		expect(args.system).toMatch(/active_version: id=.+, name=.+/);
	});

	test("appendDefaultSystemPrompt merges the default prompt", () => {
		const prompt = appendDefaultSystemPrompt("You are using flashtype...");
		expect(prompt).toContain("You are the Lix Agent.");
		expect(prompt).toContain("You are using flashtype...");
	});

	test("honors a provided system prompt", async () => {
		sendMessageCoreMock.mockClear();
		const lix = await openLix({});
		const model = new MockLanguageModelV2({
			doGenerate: async () => ({
				finishReason: "stop",
				usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
				content: [{ type: "text", text: "ok" }],
				warnings: [],
			}),
		});

		const systemPrompt = appendDefaultSystemPrompt(
			"You are using flashtype..."
		);
		const agent = await createLixAgent({ lix, model, systemPrompt });
		await agent.sendMessage({ text: "hello" });

		const call = sendMessageCoreMock.mock.calls.at(-1);
		expect(call).toBeDefined();
		const args = call![0];
		expect(args.system).toContain("You are using flashtype...");
	});
});
