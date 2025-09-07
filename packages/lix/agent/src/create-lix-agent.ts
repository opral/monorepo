import { generateText, streamText } from "ai";
import type { LanguageModelV2 } from "@ai-sdk/provider";

/**
 * Minimal Lix Agent built on the Vercel AI SDK.
 *
 * Provides a tiny wrapper around the AI SDK’s `generateText` and `streamText`
 * helpers. Pass any compatible `LanguageModelV2` (e.g. from `@ai-sdk/openai`).
 *
 * The goal is to offer a stable entry-point for future Lix-specific agent
 * features, while remaining a very thin abstraction today.
 *
 * @example
 * import { createLixAgent } from "@lix-js/agent";
 * import { openai } from "@ai-sdk/openai";
 *
 * const agent = createLixAgent({ model: openai("gpt-4o-mini") });
 * const { text } = await agent.generate("Summarize Lix in one line.");
 * console.log(text);
 */
export function createLixAgent({ model }: { model: LanguageModelV2 }) {
	return {
		/**
		 * Generate a single text completion.
		 *
		 * @param prompt The prompt to send to the model.
		 * @returns The AI SDK `generateText` result.
		 *
		 * @example
		 * const { text } = await agent.generate("Hello world");
		 */
		async generate(prompt: string) {
			return await generateText({ model, prompt });
		},

		/**
		 * Stream a text completion.
		 *
		 * Use this to progressively consume tokens or convert to a `ReadableStream`.
		 *
		 * @param prompt The prompt to send to the model.
		 * @returns The AI SDK `streamText` result.
		 *
		 * @example
		 * const stream = await agent.stream("Stream this response");
		 * for await (const delta of stream.textStream) {
		 *   process.stdout.write(delta);
		 * }
		 */
		async stream(prompt: string) {
			return await streamText({ model, prompt });
		},
	} as const;
}

export type { LanguageModelV2 } from "@ai-sdk/provider";
