import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { createLixAgent } from "./create-lix-agent.js";
import { summarizeWorkingChanges } from "./summarize-working-changes.js";
import { MockLanguageModelV2 } from "ai/test";

test("summarizeWorkingChanges returns working commit data with joined changes", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Mock model to verify text generation path
	const model = new MockLanguageModelV2({
		doGenerate: async () => ({
			finishReason: "stop",
			usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
			content: [{ type: "text", text: "mock summary" }],
			warnings: [],
		}),
	});

	const agent = await createLixAgent({ lix, model });

	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: { some: "value" },
		})
		.execute();

	const result = await summarizeWorkingChanges({ agent });
	expect(result.text).toBe("mock summary");
});
