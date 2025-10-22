import {
	createConversation,
	createConversationMessage,
	uuidV7,
} from "@lix-js/sdk";
import { streamText, stepCountIs, type StreamTextResult } from "ai";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type { ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";
import type {
	AgentConversation,
	AgentConversationMessage,
	AgentConversationMessageMetadata,
	AgentStep,
	AgentTurnMessage,
} from "./types.js";
import { loadConversation } from "./conversation-storage.js";
import { buildSystemPrompt } from "./system/build-system-prompt.js";
import { getAgentState, type Agent } from "./create-lix-agent.js";
import type {
	ChangeProposalEvent,
	ChangeProposalSummary,
} from "./proposal-mode.js";

export type SendMessageArgs = {
	/**
	 * Agent instance created via {@link createLixAgent}.
	 */
	agent: Agent;
	/**
	 * Prompt content for the turn (typically produced with `fromPlainText`).
	 */
	prompt: ZettelDoc;
	/**
	 * Optional conversation ID. When omitted the turn is stored only in memory.
	 */
	conversationId?: string;
	/**
	 * Persist the turn to the conversation store. Defaults to `true`.
	 */
	persist?: boolean;
	/**
	 * Optional abort signal for cancelling the request.
	 */
	signal?: AbortSignal;
	/**
	 * Enable proposal mode, staging mutating tool calls for explicit review. Defaults to `false`.
	 */
	proposalMode?: boolean;
	/**
	 * Callback invoked when proposal review state changes. Receives an event
	 * for the proposal lifecycle (`open`, `accepted`, `rejected`, `cancelled`).
	 */
	onChangeProposal?: (event: ChangeProposalEvent) => void;
};

export type SendMessageResult = {
	conversationId: string;
	aiSdk: StreamTextResult<Agent["tools"], never>;
	toPromise(): Promise<AgentConversationMessage>;
	acceptChanges(proposalId?: string): Promise<void>;
	rejectChanges(proposalId?: string): Promise<void>;
	getPendingProposals(): ChangeProposalSummary[];
};

/**
 * Execute a single agent turn using the provided prompt.
 *
 * When `conversationId` is omitted the agent keeps the turn in memory.
 * Provide a `conversationId` to append the turn to a persisted conversation.
 * Set `proposalMode: true` to stage mutating tool calls in a change proposal
 * and require an explicit accept/reject before the turn continues.
 *
 * @example
 * const turn = await sendMessage({
 * 	agent,
 * 	prompt: fromPlainText("Hello"),
 * });
 * for await (const part of turn.aiSdk.fullStream) {
 * 	if (part.type === "text-delta") {
 * 		process.stdout.write(part.delta);
 * 	}
 * }
 * const assistantMessage = await turn.toPromise();
 */
export async function sendMessage(
	args: SendMessageArgs
): Promise<SendMessageResult> {
	const {
		agent,
		prompt,
		conversationId: providedConversationId,
		signal,
	} = args;
	const shouldPersist = args.persist !== false;
	const state = getAgentState(agent);
	const proposalModeEnabled = args.proposalMode === true;
	const proposalController = proposalModeEnabled
		? (state.proposal ?? null)
		: null;
	if (proposalModeEnabled && !proposalController) {
		throw new Error("ProposalModeController is unavailable on the agent state");
	}
	if (proposalController) {
		if (proposalController.hasPending()) {
			throw new Error(
				"Cannot start a new turn while a change proposal is pending."
			);
		}
	}

	const previousConversationSnapshot: AgentConversation = {
		id: state.conversation.id,
		messages: state.conversation.messages.map((message) => ({ ...message })),
	};

	let conversationId = providedConversationId ?? state.conversation.id ?? "";
	let baseConversation: AgentConversation;

	if (providedConversationId) {
		const loaded = await loadConversation(agent.lix, providedConversationId);
		if (!loaded) {
			throw new Error(
				`Conversation ${providedConversationId} not found in the Lix database.`
			);
		}
		conversationId = String(loaded.id);
		baseConversation = {
			id: conversationId,
			messages: loaded.messages.map((message) => ({ ...message })),
		};
	} else if (shouldPersist) {
		const created = await createConversation({
			lix: agent.lix,
			versionId: "global",
		});
		conversationId = String(created.id);
		baseConversation = { id: conversationId, messages: [] };
	} else {
		if (!conversationId) {
			conversationId = await uuidV7({ lix: agent.lix });
		}
		baseConversation = {
			id: conversationId,
			messages: state.conversation.messages.map((message) => ({ ...message })),
		};
	}

	const workingMessages = baseConversation.messages.map((message) => ({
		...message,
	}));
	const workingTurns = workingMessages
		.map(conversationMessageToTurn)
		.filter((turn): turn is AgentTurnMessage => turn !== null)
		.map((turn) => ({ ...turn }));

	const promptText = toPlainText(prompt);
	const userMetadata: AgentConversationMessageMetadata = {
		lix_agent_sdk_role: "user",
	};

	let userMessage: AgentConversationMessage;
	if (shouldPersist) {
		const stored = await createConversationMessage({
			lix: agent.lix,
			conversation_id: conversationId,
			body: prompt,
			lixcol_metadata: userMetadata,
		});
		userMessage = {
			...stored,
			id: String(stored.id),
			conversation_id: String(stored.conversation_id ?? conversationId),
			lixcol_metadata: {
				...stored.lixcol_metadata,
				lix_agent_sdk_role: "user",
			} as AgentConversationMessageMetadata | null,
		};
	} else {
		userMessage = {
			id: await uuidV7({ lix: agent.lix }),
			conversation_id: conversationId,
			parent_id: null,
			body: prompt,
			lixcol_metadata: userMetadata,
		};
	}

	workingMessages.push({ ...userMessage });
	workingTurns.push({
		id: String(userMessage.id),
		role: "user",
		content: promptText,
		body: prompt,
		metadata: userMessage.lixcol_metadata ?? undefined,
	});

	state.conversation.id = conversationId;
	state.conversation.messages = workingMessages.map((message) => ({
		...message,
	}));

	const activeVersion = await agent.lix.db
		.selectFrom("active_version")
		.innerJoin("version", "version.id", "active_version.version_id")
		.select(["version.id", "version.name"])
		.executeTakeFirstOrThrow();

	state.contextStore.set(
		"active_version",
		`id=${String(activeVersion.id)}, name=${String(
			activeVersion.name ?? "null"
		)}`
	);

	const finalSystem = buildSystemPrompt({
		basePrompt: state.systemPrompt,
		mentionPaths: extractMentionPaths(promptText),
		contextOverlay: state.contextStore.toOverlayBlock(),
	});

	const assistantMessageId = await uuidV7({ lix: agent.lix });

	if (proposalController) {
		proposalController.beginTurn({
			conversationId,
			messageId: assistantMessageId,
			onChangeProposal: args.onChangeProposal,
		});
	}

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

	let doneSettled = false;
	let resolveDone!: (value: AgentConversationMessage) => void;
	let rejectDone!: (reason: unknown) => void;
	const done = new Promise<AgentConversationMessage>((resolve, reject) => {
		resolveDone = resolve;
		rejectDone = reject;
	});
	const resolveTurn = (value: AgentConversationMessage) => {
		if (doneSettled) return;
		doneSettled = true;
		proposalController?.endTurn();
		resolveDone(value);
	};
	const rejectTurn = (reason: unknown) => {
		if (doneSettled) return;
		doneSettled = true;
		proposalController?.endTurn();
		if (!shouldPersist) {
			state.conversation.id = previousConversationSnapshot.id;
			state.conversation.messages = previousConversationSnapshot.messages.map(
				(message) => ({ ...message })
			);
		}
		rejectDone(reason);
	};
	let aiSdkStream: StreamTextResult<Agent["tools"], never>;
	let toPromiseResult: Promise<AgentConversationMessage> | undefined;
	try {
		aiSdkStream = streamText({
			model: agent.model,
			system: finalSystem,
			messages: toAiMessages(workingTurns),
			tools: agent.tools as any,
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
			onFinish: async ({ text: assistantText }) => {
				const stepSnapshot =
					steps.length > 0 ? steps.map((step) => ({ ...step })) : [];
				const metadata: AgentConversationMessageMetadata = {
					lix_agent_sdk_role: "assistant",
					...(stepSnapshot.length > 0
						? { lix_agent_sdk_steps: stepSnapshot }
						: {}),
				};
				const assistantBody = fromPlainText(assistantText);

				let assistantMessage: AgentConversationMessage;
				if (shouldPersist) {
					const stored = await createConversationMessage({
						lix: agent.lix,
						id: assistantMessageId,
						conversation_id: conversationId,
						body: assistantBody,
						lixcol_metadata: metadata,
					});
					assistantMessage = {
						...stored,
						id: String(stored.id),
						conversation_id: String(stored.conversation_id ?? conversationId),
						lixcol_metadata: {
							...stored.lixcol_metadata,
							lix_agent_sdk_role: "assistant",
						} as AgentConversationMessageMetadata | null,
					};
				} else {
					assistantMessage = {
						id: assistantMessageId,
						conversation_id: conversationId,
						parent_id: null,
						body: assistantBody,
						lixcol_metadata: metadata,
					};
				}

				workingMessages.push({ ...assistantMessage });
				workingTurns.push({
					id: String(assistantMessage.id),
					role: "assistant",
					content: assistantText,
					body: assistantBody,
					metadata: assistantMessage.lixcol_metadata ?? undefined,
				});

				state.conversation.id = conversationId;
				state.conversation.messages = workingMessages.map((message) => ({
					...message,
				}));

				resolveTurn(assistantMessage);
			},
			onError: (error) => {
				rejectTurn(error ?? new Error("sendMessage stream error"));
			},
			onAbort: () => {
				rejectTurn(new Error("sendMessage aborted"));
			},
			abortSignal: signal,
		}) as StreamTextResult<Agent["tools"], never>;
	} catch (error) {
		rejectTurn(error);
		throw error;
	}

	const toPromise = () => {
		if (!toPromiseResult) {
			toPromiseResult = (async () => {
				await aiSdkStream.consumeStream();
				return await done;
			})();
		}
		return toPromiseResult;
	};

	const ensureProposalModeEnabled = () => {
		if (!proposalController) {
			throw new Error("proposalMode was not enabled for this turn");
		}
	};

	const acceptChanges = async (proposalId?: string) => {
		ensureProposalModeEnabled();
		await proposalController?.accept(proposalId);
	};

	const rejectChanges = async (proposalId?: string) => {
		ensureProposalModeEnabled();
		await proposalController?.reject(proposalId);
	};

	const getPendingProposals = (): ChangeProposalSummary[] => {
		return proposalController ? proposalController.getPendingSummaries() : [];
	};

	return {
		conversationId,
		aiSdk: aiSdkStream,
		toPromise,
		acceptChanges,
		rejectChanges,
		getPendingProposals,
	};
}

function toAiMessages(
	history: AgentTurnMessage[]
): { role: "user" | "assistant"; content: string }[] {
	const out: { role: "user" | "assistant"; content: string }[] = [];
	for (const message of history) {
		if (message.role === "user" || message.role === "assistant") {
			out.push({ role: message.role, content: message.content });
		}
	}
	return out;
}

function extractMentionPaths(text: string): string[] {
	const out = new Set<string>();
	const re = /@([A-Za-z0-9_./-]+)/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text))) {
		const path = match[1];
		if (path) out.add(path);
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

function conversationMessageToTurn(
	message: AgentConversationMessage
): AgentTurnMessage | null {
	const metadata = message.lixcol_metadata ?? undefined;
	const role = metadata?.lix_agent_sdk_role;
	if (role !== "user" && role !== "assistant") {
		return null;
	}
	const content = toPlainText(message.body);
	return {
		id: String(message.id),
		role,
		content,
		body: message.body,
		metadata,
	};
}
