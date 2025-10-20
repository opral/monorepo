import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { ChatMessage } from "./conversation-message.js";
import { ContextStore } from "./context/context-store.js";
import { DEFAULT_SYSTEM_PROMPT } from "./system-prompt.js";
import { createSendMessage, type AgentStreamResult } from "./send-message.js";

export type { ChatMessage } from "./conversation-message.js";

/**
 * Handle returned by {@link createLixAgent}.
 */
export type Agent = {
	lix: Lix;
	model: LanguageModelV2;
	/**
	 * Send a user message to the agent.
	 *
	 * Returns a stream handle with two parts:
	 * - `ai_sdk`: the underlying AI SDK stream, exposed for incremental token
	 *   rendering or tool instrumentation.
	 * - `drain()`: helper that consumes the AI SDK stream and resolves with the
	 *   final turn outcome.
	 * - `done`: a promise that resolves with the final assistant response plus
	 *   step metadata when the stream finishes (also returned by `drain()`).
	 */
	sendMessage(args: {
		text: string;
		systemPrompt?: string;
		signal?: AbortSignal;
	}): Promise<AgentStreamResult>;
	getHistory(): ChatMessage[];
	clearHistory(): void;
	setContext(key: string, value: string): void;
	getContext(key: string): string | undefined;
};

/**
 * Create a Lix agent handle that wraps Lix SDK interactions.
 *
 * Provide `systemPrompt` to override the default instructions. Use
 * {@link appendDefaultSystemPrompt} to extend the default prompt with
 * additional guidance while keeping core behaviors.
 *
 * @example
 * import { createLixAgent, appendDefaultSystemPrompt } from "@lix-js/agent-sdk";
 *
 * const agent = await createLixAgent({
 * 	lix,
 * 	model,
 * 	systemPrompt: appendDefaultSystemPrompt("You are using flashtype..."),
 * });
 */
export async function createLixAgent(args: {
	lix: Lix;
	model: LanguageModelV2;
	systemPrompt?: string;
}): Promise<Agent> {
	const { lix, model, systemPrompt: providedSystemPrompt } = args;

	// Default conversation state (in-memory)
	const history: ChatMessage[] = [];
	const contextStore = new ContextStore();
	let systemInstruction = providedSystemPrompt ?? DEFAULT_SYSTEM_PROMPT;

	const send = createSendMessage({
		lix,
		model,
		history,
		contextStore,
		getSystemInstruction: () => systemInstruction,
		setSystemInstruction: (value: string) => {
			systemInstruction = value;
		},
	});

	function getHistory() {
		return history.slice();
	}

	async function clearHistory() {
		history.length = 0;
	}

	return {
		lix,
		model,
		sendMessage: ({
			text,
			systemPrompt,
			signal,
		}: {
			text: string;
			systemPrompt?: string;
			signal?: AbortSignal;
		}): Promise<AgentStreamResult> =>
			send({
				text,
				systemPromptOverride: systemPrompt,
				signal,
			}),
		getHistory,
		clearHistory,
		setContext: (key: string, value: string) => {
			contextStore.set(key, value);
		},
		getContext: (key: string) => contextStore.get(key),
	};
}

// KV-based hydration removed; using threads instead
