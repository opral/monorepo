import {
	createConversation,
	createConversationMessage,
	uuidV7,
} from "@lix-js/sdk";
import { streamText, stepCountIs } from "ai";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type { ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";
import type { Agent } from "./create-lix-agent.js";
import { getAgentState } from "./create-lix-agent.js";
import { loadConversation } from "./conversation-storage.js";
import {
	ChangeProposalRejectedError,
	type AgentChangeProposalEvent,
} from "./proposal-mode.js";
import { buildSystemPrompt } from "./system/build-system-prompt.js";
import type {
	AgentConversation,
	AgentConversationMessage,
	AgentConversationMessageMetadata,
	AgentEvent,
	AgentStep,
	AgentToolStep,
	AgentThinkingStep,
	AgentTurnMessage,
	AgentTurn,
	ChangeProposalSummary,
} from "./types.js";

export type SendMessageArgs = {
	/**
	 * Agent instance created via {@link createLixAgent}.
	 */
	agent: Agent;
	/**
	 * Prompt content for the turn.
	 */
	prompt: string | ZettelDoc;
	/**
	 * Persist the turn to an existing conversation when provided.
	 */
	conversationId?: string;
	/**
	 * Persist the turn automatically when `true`. Defaults to `true`.
	 */
	persist?: boolean;
	/**
	 * Accept proposals automatically when `true`.
	 */
	autoAcceptProposals?: boolean;
	/**
	 * Abort signal for cancelling the request.
	 */
	signal?: AbortSignal;
	/**
	 * Enable proposal review mode. Defaults to `false`.
	 */
	proposalMode?: boolean;
};

/**
 * Send a single turn to the agent and receive a unified event stream.
 *
 * @example
 * const turn = sendMessage({ agent, prompt: "Apply change" });
 * for await (const event of turn) {
 * 	if (event.type === "text") process.stdout.write(event.delta);
 * }
 */
const MUTATING_TOOL_NAMES = new Set(["write_file", "delete_file"]);

export function sendMessage(args: SendMessageArgs): AgentTurn {
	const state = getAgentState(args.agent);
	const shouldPersist = args.persist !== false;
	const autoAccept = args.autoAcceptProposals === true;
	const proposalModeEnabled = args.proposalMode === true;
	const proposalController = proposalModeEnabled
		? (state.proposal ?? null)
		: null;
	if (proposalModeEnabled && !proposalController) {
		throw new Error("ProposalModeController is unavailable on the agent state");
	}
	if (proposalController?.hasPending()) {
		throw new Error(
			"Cannot start a new turn while a change proposal is pending."
		);
	}

	const queue = createEventQueue<AgentEvent>();
	const iterable = queue.iterable();

	const turn: AgentTurn = {
		[Symbol.asyncIterator]() {
			return iterable[Symbol.asyncIterator]();
		},
		async complete(opts = {}) {
			const { autoAcceptProposals: autoAcceptDuringDrain = false, onError } =
				opts;
			let finalMessage: AgentConversationMessage | null = null;
			const iterator = iterable[Symbol.asyncIterator]();
			try {
				while (true) {
					const { value, done } = await iterator.next();
					if (done) break;
					if (!value) continue;

					switch (value.type) {
						case "message":
							finalMessage = value.message;
							break;
						case "proposal:open":
							if (autoAcceptDuringDrain) {
								await value.accept();
							}
							break;
						case "error":
							throw toError(value.error);
						case "done":
							return finalizeTurn(finalMessage);
						default:
							break;
					}
				}
				return finalizeTurn(finalMessage);
			} catch (error) {
				const err = toError(error);
				onError?.(err);
				throw err;
			} finally {
				if (typeof iterator.return === "function") {
					try {
						await iterator.return();
					} catch {
						// ignore iterator return errors
					}
				}
			}
		},
	};

	const previousConversationSnapshot: AgentConversation = {
		id: state.conversation.id,
		messages: state.conversation.messages.map((message) => ({ ...message })),
	};

	const worker = async () => {
		const {
			agent,
			prompt,
			conversationId: providedConversationId,
			signal: externalAbortSignal,
		} = args;

		const promptMessages = await collectPromptMessages(agent, prompt);
		if (promptMessages.length === 0) {
			throw new Error("Prompt produced no messages");
		}

		const readAbortReason = (signal: AbortSignal | undefined): unknown =>
			signal && "reason" in signal
				? (signal as AbortSignal & { reason?: unknown }).reason
				: undefined;
		const coerceAbortError = (value?: unknown): Error => {
			if (value instanceof Error) return value;
			if (value === undefined || value === null) {
				return new Error("sendMessage aborted");
			}
			if (typeof value === "string" && value.length > 0) {
				return new Error(value);
			}
			return new Error(String(value));
		};

		if (externalAbortSignal?.aborted) {
			throw coerceAbortError(readAbortReason(externalAbortSignal));
		}

		const turnAbortController = new AbortController();
		let abortReason: Error | null = null;
		let cleanupExternalAbort: (() => void) | null = null;
		const abortTurn = (reason?: unknown) => {
			if (reason !== undefined || !abortReason) {
				abortReason = coerceAbortError(reason);
			}
			if (!turnAbortController.signal.aborted) {
				turnAbortController.abort(abortReason);
			}
		};

		if (externalAbortSignal) {
			const handleExternalAbort = () => {
				abortTurn(readAbortReason(externalAbortSignal));
			};
			externalAbortSignal.addEventListener("abort", handleExternalAbort, {
				once: true,
			});
			cleanupExternalAbort = () => {
				externalAbortSignal.removeEventListener("abort", handleExternalAbort);
			};
		}

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
				messages: state.conversation.messages.map((message) => ({
					...message,
				})),
			};
		}

		const workingMessages = baseConversation.messages.map((message) => ({
			...message,
		}));
		const workingTurns = workingMessages
			.map(conversationMessageToTurn)
			.filter((turn): turn is AgentTurnMessage => turn !== null)
			.map((turn) => ({ ...turn }));

		const mentionSources: string[] = [];
		for (const promptMessage of promptMessages) {
			if (promptMessage.role === "user") {
				const metadata: AgentConversationMessageMetadata = {
					lix_agent_sdk_role: "user",
				};
				let storedMessage: AgentConversationMessage;
				if (shouldPersist) {
					const stored = await createConversationMessage({
						lix: agent.lix,
						conversation_id: conversationId,
						body: promptMessage.body!,
						lixcol_metadata: metadata,
					});
					storedMessage = {
						...stored,
						id: String(stored.id),
						conversation_id: String(stored.conversation_id ?? conversationId),
						lixcol_metadata: {
							...stored.lixcol_metadata,
							lix_agent_sdk_role: "user",
						} as AgentConversationMessageMetadata | null,
					};
				} else {
					storedMessage = {
						id: promptMessage.id,
						conversation_id: conversationId,
						parent_id: null,
						body: promptMessage.body!,
						lixcol_metadata: metadata,
					};
				}
				workingMessages.push({ ...storedMessage });
			}
			workingTurns.push({ ...promptMessage });
			mentionSources.push(promptMessage.content);
		}

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
			mentionPaths: extractMentionPaths(mentionSources.join("\n")),
			contextOverlay: state.contextStore.toOverlayBlock(),
		});

		const assistantMessageId = await uuidV7({ lix: agent.lix });

		const queuedProposalEvents: AgentEvent[] = [];
		const flushProposalEvents = () => {
			while (queuedProposalEvents.length > 0) {
				queue.push(queuedProposalEvents.shift()!);
			}
		};

		let proposalSessionActive = false;
		const startProposalSession = () => {
			if (!proposalController || proposalSessionActive) {
				return;
			}
			proposalController.beginTurn({
				conversationId,
				messageId: assistantMessageId,
				onChangeProposal: (event) => {
					handleProposalEvent({
						event,
						controller: proposalController,
						autoAccept,
						queue: queuedProposalEvents,
						abortTurn,
					});
					flushProposalEvents();
				},
			});
			proposalSessionActive = true;
		};

		if (proposalController && proposalModeEnabled) {
			startProposalSession();
		}

		const steps: AgentStep[] = [];
		const toolPhases = new Map<string, AgentToolStep["status"]>();
		const emitStep = (step: AgentStep) => {
			queue.push({ type: "step", step: { ...step } });
		};
		const emitToolEvent = (
			phase: "start" | "finish" | "error",
			call: AgentToolStep
		) => {
			queue.push({ type: "tool", phase, call: { ...call } });
		};
		const upsertStep = (
			toolCallId: string,
			updater: (step: AgentToolStep) => AgentToolStep
		) => {
			const index = steps.findIndex(
				(step): step is AgentToolStep =>
					step.id === toolCallId && step.kind === "tool_call"
			);
			if (index === -1) {
				const next = updater({
					id: toolCallId,
					kind: "tool_call",
					status: "running",
					tool_name: "",
					started_at: new Date().toISOString(),
				});
				steps.push(next);
				return next;
			}
			const existing = steps[index];
			if (!existing || existing.kind !== "tool_call") {
				const next = updater({
					id: toolCallId,
					kind: "tool_call",
					status: "running",
					tool_name: "",
					started_at: new Date().toISOString(),
				});
				steps.splice(index, 0, next);
				return next;
			}
			const next = updater(existing);
			steps[index] = next;
			return next;
		};

		const markRunning = (
			toolCallId: string,
			toolName: string,
			input: unknown,
			label?: string
		) => {
			const started_at = new Date().toISOString();
			const step = upsertStep(toolCallId, (step) => ({
				...step,
				tool_name: toolName,
				tool_input: input,
				label: label ?? step.label,
				status: "running",
				started_at: step.started_at ?? started_at,
			}));
			const previous = toolPhases.get(toolCallId);
			if (previous !== "running") {
				toolPhases.set(toolCallId, "running");
				emitToolEvent("start", step);
			}
			emitStep(step);
		};

		const markFinished = (
			toolCallId: string,
			output: unknown,
			label?: string
		) => {
			const finished_at = new Date().toISOString();
			const step = upsertStep(toolCallId, (step) => ({
				...step,
				status: "succeeded",
				tool_output: output,
				label: label ?? step.label,
				finished_at,
			}));
			const previous = toolPhases.get(toolCallId);
			if (previous !== "succeeded") {
				toolPhases.set(toolCallId, "succeeded");
				emitToolEvent("finish", step);
			}
			emitStep(step);
		};

		const markFailed = (toolCallId: string, error: unknown, label?: string) => {
			const finished_at = new Date().toISOString();
			const step = upsertStep(toolCallId, (step) => ({
				...step,
				status: "failed",
				error_text: toErrorText(error),
				label: label ?? step.label,
				finished_at,
			}));
			const previous = toolPhases.get(toolCallId);
			if (previous !== "failed") {
				toolPhases.set(toolCallId, "failed");
				emitToolEvent("error", step);
			}
			emitStep(step);
		};

		const pushToolError = (
			toolCallId: string,
			toolName: string,
			error: unknown,
			label?: string
		) => {
			markFailed(toolCallId, error, label);
		};

		const thinkingBuffers = new Map<
			string,
			{ text: string; started_at: string }
		>();
		const flushThinking = () => {
			if (thinkingBuffers.size === 0) return;
			const finished_at = new Date().toISOString();
			for (const [id, data] of thinkingBuffers) {
				const step: AgentThinkingStep = {
					id,
					kind: "thinking",
					text: data.text,
					started_at: data.started_at,
					finished_at,
				};
				steps.push(step);
				emitStep(step);
			}
			thinkingBuffers.clear();
		};
		const enqueueThinking = (id: string, delta: string) => {
			let record = thinkingBuffers.get(id);
			if (!record) {
				record = { text: "", started_at: new Date().toISOString() };
				thinkingBuffers.set(id, record);
			}
			record.text += delta;
			queue.push({ type: "thinking", id, delta });
		};

		let assistantText = "";
		try {
			const aiSdkStream = streamText({
				model: agent.model,
				system: finalSystem,
				messages: toAiMessages(workingTurns),
				tools: agent.tools as any,
				abortSignal: turnAbortController.signal,
				stopWhen: stepCountIs(30),
				prepareStep: async ({ messages }) => {
					if (messages.length > 20) {
						return { messages: messages.slice(-10) };
					}
					return {};
				},
				onChunk: ({ chunk }) => {
					switch (chunk.type) {
						case "reasoning-delta": {
							const record = chunk as Record<string, unknown>;
							const text =
								typeof record.text === "string"
									? (record.text as string)
									: typeof record.delta === "string"
										? (record.delta as string)
										: "";
							if (text.length > 0) {
								enqueueThinking(chunk.id, text);
							}
							break;
						}
						case "text-delta": {
							flushThinking();
							assistantText += chunk.text;
							queue.push({ type: "text", delta: chunk.text });
							break;
						}
						case "tool-call": {
							flushThinking();
							const input = parseToolInput(chunk.input);
							const label = extractToolLabel(chunk);
							if (
								proposalModeEnabled &&
								MUTATING_TOOL_NAMES.has(chunk.toolName)
							) {
								startProposalSession();
							}
							markRunning(chunk.toolCallId, chunk.toolName, input, label);
							break;
						}
						case "tool-result": {
							flushThinking();
							const label = extractToolLabel(chunk);
							markFinished(chunk.toolCallId, chunk.output, label);
							break;
						}
						default:
							break;
					}
				},
				onFinish: (stepResult) => {
					const usage = stepResult.totalUsage;
					if (!usage) return;
					queue.push({
						type: "usage",
						inputTokens: usage.inputTokens ?? 0,
						outputTokens: usage.outputTokens ?? 0,
						totalTokens: usage.totalTokens ?? 0,
					});
				},
				onStepFinish: (stepResult) => {
					for (const part of stepResult.content) {
						if (!isToolErrorPart(part)) continue;
						const label = extractToolLabel(part);
						pushToolError(part.toolCallId, part.toolName, part.error, label);
					}
				},
				onError: (error) => {
					abortTurn(error ?? new Error("sendMessage stream error"));
				},
				onAbort: () => {
					abortTurn(abortReason ?? new Error("sendMessage aborted"));
				},
			});

			await aiSdkStream.consumeStream();
			if (abortReason) {
				throw abortReason;
			}
			flushThinking();
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

			queue.push({ type: "message", message: assistantMessage });
		} finally {
			cleanupExternalAbort?.();
			if (proposalController && proposalSessionActive) {
				await proposalController.endTurn({
					aborted: abortReason !== null,
				});
			}
		}
	};

	worker()
		.then(() => {
			queue.push({ type: "done" });
		})
		.catch((error) => {
			if (!shouldPersist) {
				state.conversation.id = previousConversationSnapshot.id;
				state.conversation.messages = previousConversationSnapshot.messages.map(
					(message) => ({
						...message,
					})
				);
			}
			queue.push({ type: "error", error });
			queue.push({ type: "done" });
		})
		.finally(() => {
			queue.close();
		});

	return turn;
}

async function collectPromptMessages(
	agent: Agent,
	prompt: string | ZettelDoc
): Promise<AgentTurnMessage[]> {
	if (typeof prompt === "string") {
		const body = fromPlainText(prompt);
		return [
			{
				id: await uuidV7({ lix: agent.lix }),
				role: "user",
				content: prompt,
				body,
			},
		];
	}
	const content = toPlainText(prompt);
	return [
		{
			id: await uuidV7({ lix: agent.lix }),
			role: "user",
			content,
			body: prompt,
		},
	];
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

function toErrorText(value: unknown): string | undefined {
	if (typeof value === "string") return value;
	if (value instanceof Error) return value.message;
	return undefined;
}

function extractToolLabel(source: unknown): string | undefined {
	if (!source || typeof source !== "object") {
		return undefined;
	}
	const record = source as Record<string, unknown>;
	const candidate = record.label;
	if (typeof candidate === "string" && candidate.trim().length > 0) {
		return candidate;
	}
	const args = record.args;
	if (args && typeof args === "object") {
		const fromArgs = extractToolLabel(args);
		if (fromArgs) return fromArgs;
	}
	const input = record.input;
	if (input && typeof input === "object") {
		const fromInput = extractToolLabel(input);
		if (fromInput) return fromInput;
	}
	return undefined;
}

type ToolErrorLike = {
	type: "tool-error";
	toolCallId: string;
	toolName: string;
	error: unknown;
};

function isToolErrorPart(value: unknown): value is ToolErrorLike {
	if (!value || typeof value !== "object") {
		return false;
	}
	const record = value as Record<string, unknown>;
	return (
		record.type === "tool-error" &&
		typeof record.toolCallId === "string" &&
		typeof record.toolName === "string"
	);
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

function handleProposalEvent(args: {
	event: AgentChangeProposalEvent;
	controller: {
		accept: (proposalId?: string) => Promise<void>;
		reject: (proposalId?: string) => Promise<void>;
	};
	autoAccept: boolean;
	queue: AgentEvent[];
	abortTurn: (reason?: unknown) => void;
}): void {
	const { event, controller, autoAccept, queue, abortTurn } = args;
	const summary = toProposalSummary(event);
	switch (event.status) {
		case "open": {
			const accept = async () => {
				await controller.accept(event.proposal.id);
			};
			const reject = async (reason?: string) => {
				await controller.reject(event.proposal.id);
				setTimeout(() => {
					abortTurn(new ChangeProposalRejectedError());
				}, 0);
				void reason;
			};
			queue.push({
				type: "proposal:open",
				proposal: {
					id: summary.id,
					summary: summary.summary ?? summary.title,
				},
				accept,
				reject,
			});
			if (autoAccept) {
				void accept();
			}
			break;
		}
		case "accepted":
			queue.push({
				type: "proposal:closed",
				proposalId: event.proposal.id,
				status: "accepted",
			});
			break;
		case "rejected":
			queue.push({
				type: "proposal:closed",
				proposalId: event.proposal.id,
				status: "rejected",
			});
			break;
		case "cancelled":
			queue.push({
				type: "proposal:closed",
				proposalId: event.proposal.id,
				status: "cancelled",
			});
			break;
		default:
			break;
	}
}

function toProposalSummary(
	event: AgentChangeProposalEvent
): ChangeProposalSummary {
	const proposal = event.proposal;
	const proposalRecord = proposal as Record<string, unknown>;
	const title =
		typeof proposalRecord["title"] === "string"
			? (proposalRecord["title"] as string)
			: undefined;
	const summary =
		typeof proposalRecord["summary"] === "string"
			? (proposalRecord["summary"] as string)
			: undefined;
	return {
		id: proposal.id,
		source_version_id: proposal.source_version_id,
		target_version_id: proposal.target_version_id,
		title,
		summary,
		fileId: event.fileId,
		filePath: event.filePath,
	};
}

function finalizeTurn(
	finalMessage: AgentConversationMessage | null
): AgentConversationMessage {
	if (!finalMessage) {
		throw new Error("Turn completed without an assistant message");
	}
	return finalMessage;
}

function toError(value: unknown): Error {
	if (value instanceof Error) return value;
	if (typeof value === "string" && value.length > 0) {
		return new Error(value);
	}
	if (value === null || value === undefined) {
		return new Error("Unknown agent error");
	}
	try {
		return new Error(JSON.stringify(value));
	} catch {
		return new Error(String(value));
	}
}

function createEventQueue<T>() {
	const buffer: T[] = [];
	const waiting: Array<{
		resolve: (value: IteratorResult<T>) => void;
		reject: (error: unknown) => void;
	}> = [];
	let closed = false;

	return {
		push(value: T) {
			if (closed) return;
			if (waiting.length > 0) {
				const waiter = waiting.shift()!;
				waiter.resolve({ value, done: false });
			} else {
				buffer.push(value);
			}
		},
		close() {
			if (closed) return;
			closed = true;
			while (waiting.length > 0) {
				const waiter = waiting.shift()!;
				waiter.resolve({ value: undefined, done: true });
			}
		},
		iterable(): AsyncIterable<T> {
			return {
				[Symbol.asyncIterator]() {
					return {
						async next(): Promise<IteratorResult<T>> {
							if (buffer.length > 0) {
								const value = buffer.shift()!;
								return { value, done: false };
							}
							if (closed) {
								return { value: undefined, done: true };
							}
							return new Promise<IteratorResult<T>>((resolve, reject) => {
								waiting.push({ resolve, reject });
							});
						},
						async return(): Promise<IteratorResult<T>> {
							closed = true;
							buffer.length = 0;
							while (waiting.length > 0) {
								const waiter = waiting.shift()!;
								waiter.resolve({ value: undefined, done: true });
							}
							return { value: undefined, done: true };
						},
					};
				},
			};
		},
	};
}
