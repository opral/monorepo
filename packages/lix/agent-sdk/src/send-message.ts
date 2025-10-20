import type { Lix } from "@lix-js/sdk";
import { uuidV7 } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { streamText, stepCountIs } from "ai";
import type { StreamTextResult } from "ai";
import type {
	ChatMessage,
	LixAgentStep,
	LixAgentConversationMessageMetadata,
} from "./conversation-message.js";
import type { ContextStore } from "./context/context-store.js";
import { createReadFileTool } from "./tools/read-file.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createSqlSelectStateTool } from "./tools/sql-select-state.js";
import { createWriteFileTool } from "./tools/write-file.js";
import { createDeleteFileTool } from "./tools/delete-file.js";
import { createCreateVersionTool } from "./tools/create-version.js";
import { createCreateChangeProposalTool } from "./tools/create-change-proposal.js";

export type AgentDetectedChange = {
	entity_id: string;
	schema_key: string;
	plugin_key: string;
	file_id: string;
	version_id: string;
	change_id: string;
	snapshot_content: unknown;
	metadata?: Record<string, unknown>;
};

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

type AgentToolSet = Record<string, any>;
type AgentToolStream = StreamTextResult<AgentToolSet, never>;

export type AgentTurnOutcome = {
	text: string;
	metadata?: LixAgentConversationMessageMetadata;
	steps: LixAgentStep[];
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

	const read_file = createReadFileTool({ lix });
	const list_files = createListFilesTool({ lix });
	const sql_select_state = createSqlSelectStateTool({ lix });
	const write_file = createWriteFileTool({ lix });
	const delete_file = createDeleteFileTool({ lix });
	const create_version = createCreateVersionTool({ lix });
	const create_change_proposal = createCreateChangeProposalTool({ lix });

	const tools = {
		read_file,
		list_files,
		sql_select_state,
		write_file,
		delete_file,
		create_version,
		create_change_proposal,
	};

	const steps: LixAgentStep[] = [];

	const upsertStep = (
		toolCallId: string,
		updater: (step: LixAgentStep) => LixAgentStep
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
		const mentionGuidance =
			mentionPaths.length > 0
				? `File mentions like @<path> may refer to files in the lix. If helpful, you can call the read_file tool with { path: "<path>" } to inspect content before answering. Only read files when needed.`
				: undefined;

		const systemInstruction = getSystemInstruction();
		const mergedSystemWithGuidance = mentionGuidance
			? `${systemInstruction}\n\n${mentionGuidance}`
			: systemInstruction;

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
		const contextOverlay = contextStore.toOverlayBlock();
		const finalSystem = contextOverlay
			? `${mergedSystemWithGuidance}\n\n${contextOverlay}`
			: mergedSystemWithGuidance;

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
						const metadata: LixAgentConversationMessageMetadata | undefined =
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
