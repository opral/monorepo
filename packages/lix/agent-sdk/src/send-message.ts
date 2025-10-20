import type { Lix } from "@lix-js/sdk";
import { uuidV7 } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { streamText, stepCountIs } from "ai";
import type { StreamTextResult } from "ai";
import type {
	ChatMessage,
	AgentStep,
	AgentConversationMessageMetadata,
} from "./conversation-message.js";
import type { ContextStore } from "./context/context-store.js";
import { createAgentToolSet, type AgentToolSet } from "./tools/index.js";
import { buildSystemPrompt } from "./system/build-system-prompt.js";

type SendMessageDeps = {
	lix: Lix;
	model: LanguageModelV2;
	history: ChatMessage[];
	contextStore: ContextStore;
	getSystemInstruction(): string;
	setSystemInstruction(next: string): void;
};

type SendMessageInput = {
	text: string;
	systemPromptOverride?: string;
	signal?: AbortSignal;
};

type AgentToolStream = StreamTextResult<AgentToolSet, never>;

export type AgentTurnOutcome = {
	text: string;
	metadata?: AgentConversationMessageMetadata;
	steps: AgentStep[];
};

export type AgentStreamResult = {
	ai_sdk: AgentToolStream;
	done: Promise<AgentTurnOutcome>;
	drain(): Promise<AgentTurnOutcome>;
};

export function createSendMessage(deps: SendMessageDeps) {
	const {
		lix,
		model,
		history,
		contextStore,
		getSystemInstruction,
		setSystemInstruction,
	} = deps;

	const tools = createAgentToolSet({ lix });

	const steps: AgentStep[] = [];

	const upsertStep = (
		toolCallId: string,
		updater: (step: AgentStep) => AgentStep
	) => {
		const index = steps.findIndex((step) => step.id === toolCallId);
		if (index === -1) {
			const next = updater({
				id: toolCallId,
				kind: "tool_call",
				status: "running",
				tool_name: "",
				started_at: new Date().toISOString(),
			});
			steps.push(next);
		} else {
			const current = steps[index]!;
			steps[index] = updater(current);
		}
	};

	const markRunning = (
		toolCallId: string,
		toolName: string,
		input: unknown
	) => {
		upsertStep(toolCallId, (step) => ({
			...step,
			tool_name: toolName,
			tool_input: input,
			status: "running",
			started_at: step.started_at ?? new Date().toISOString(),
		}));
	};

	const markFinished = (toolCallId: string, output: unknown) => {
		upsertStep(toolCallId, (step) => ({
			...step,
			status: "succeeded",
			tool_output: output,
			finished_at: new Date().toISOString(),
		}));
	};

	const markErrored = (
		toolCallId: string,
		errorText: string,
		output?: unknown
	) => {
		upsertStep(toolCallId, (step) => ({
			...step,
			status: "failed",
			error_text: errorText,
			tool_output: output ?? step.tool_output,
			finished_at: new Date().toISOString(),
		}));
	};

	return async function sendMessageImpl({
		text,
		systemPromptOverride,
		signal,
	}: SendMessageInput): Promise<AgentStreamResult> {
		if (systemPromptOverride !== undefined) {
			setSystemInstruction(systemPromptOverride);
		}

		const userMessageId = await uuidV7({ lix });
		history.push({ id: userMessageId, role: "user", content: text });

		const mentionPaths = extractMentionPaths(text);
		const systemInstruction = getSystemInstruction();

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.select(["version.id", "version.name"])
			.executeTakeFirstOrThrow();

		contextStore.set(
			"active_version",
			`id=${String(activeVersion.id)}, name=${String(
				activeVersion.name ?? "null"
			)}`
		);
		const finalSystem = buildSystemPrompt({
			basePrompt: systemInstruction,
			mentionPaths,
			contextOverlay: contextStore.toOverlayBlock(),
		});

		let doneSettled = false;
		let resolveDone!: (value: AgentTurnOutcome) => void;
		let rejectDone!: (reason: unknown) => void;
		const done = new Promise<AgentTurnOutcome>((resolve, reject) => {
			resolveDone = resolve;
			rejectDone = reject;
		});
		const resolveTurn = (value: AgentTurnOutcome) => {
			if (doneSettled) return;
			doneSettled = true;
			resolveDone(value);
		};
		const rejectTurn = (reason: unknown) => {
			if (doneSettled) return;
			doneSettled = true;
			rejectDone(reason);
		};
		let drainInvoked = false;

		let aiSdkStream: AgentToolStream;
		try {
			aiSdkStream = streamText({
				model,
				system: finalSystem,
				messages: toAiMessages(history),
				tools: tools as any,
				stopWhen: stepCountIs(30),
				prepareStep: async ({ messages }) => {
					if (messages.length > 20) {
						return { messages: messages.slice(-10) };
					}
					return {};
				},
				onChunk: ({ chunk }) => {
					if (chunk.type === "tool-call") {
						const input = parseToolInput(chunk.input);
						markRunning(chunk.toolCallId, chunk.toolName, input);
					} else if (chunk.type === "tool-result") {
						markFinished(chunk.toolCallId, chunk.output);
					}
				},
				onFinish: async ({ text }) => {
					const finalizeTurn = async (): Promise<AgentTurnOutcome> => {
						const stepSnapshot =
							steps.length > 0 ? steps.map((step) => ({ ...step })) : [];
						const metadata: AgentConversationMessageMetadata | undefined =
							stepSnapshot.length > 0
								? { lix_agent_sdk_steps: stepSnapshot }
								: undefined;

						const assistantMessageId = await uuidV7({ lix });
						history.push({
							id: assistantMessageId,
							role: "assistant",
							content: text,
							metadata,
						});

						return {
							text,
							metadata,
							steps: stepSnapshot,
						};
					};

					return finalizeTurn()
						.then((outcome) => {
							resolveTurn(outcome);
						})
						.catch((error) => {
							rejectTurn(error);
							throw error;
						})
						.finally(() => {
							steps.length = 0;
						});
				},
				onError: (error) => {
					rejectTurn(error ?? new Error("sendMessage stream error"));
					steps.length = 0;
				},
				onAbort: () => {
					rejectTurn(new Error("sendMessage aborted"));
					steps.length = 0;
				},
				abortSignal: signal,
			}) as AgentToolStream;
		} catch (error) {
			steps.length = 0;
			rejectTurn(error);
			throw error;
		}

		return {
			ai_sdk: aiSdkStream,
			done,
			drain: async () => {
				if (!drainInvoked) {
					drainInvoked = true;
					await aiSdkStream.consumeStream();
				}
				return done;
			},
		};
	};
}

function toAiMessages(
	history: ChatMessage[]
): { role: "user" | "assistant"; content: string }[] {
	const out: { role: "user" | "assistant"; content: string }[] = [];
	for (const m of history) {
		if (m.role === "user" || m.role === "assistant") {
			out.push({ role: m.role, content: m.content });
		}
	}
	return out;
}

function extractMentionPaths(text: string): string[] {
	const out = new Set<string>();
	const re = /@([A-Za-z0-9_./-]+)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text))) {
		const p = match[1];
		if (p) out.add(p);
	}
	return [...out];
}

function parseToolInput(raw: unknown): unknown {
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw);
		} catch {
			return raw;
		}
	}
	return raw;
}
