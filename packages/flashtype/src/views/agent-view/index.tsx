import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Bot } from "lucide-react";
import { createGatewayProvider } from "@ai-sdk/gateway";
import { LixProvider, useLix, useQuery } from "@lix-js/react-utils";
import { selectVersionDiff, createConversation } from "@lix-js/sdk";
import {
	ChangeProposalRejectedError,
	createLixAgent,
	getChangeProposalSummary,
	type AgentConversationMessage,
	type AgentConversationMessageMetadata,
	type AgentEvent,
	type AgentStep,
	type AgentThinkingStep,
	type AgentToolStep,
	type Agent as LixAgent,
	type ChangeProposalSummary,
	sendMessage,
} from "@lix-js/agent-sdk";
import { fromPlainText, toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type { ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";
import { ChatMessageList } from "./chat-message-list";
import type {
	ViewContext,
	DiffViewConfig,
	RenderableDiff,
} from "../../app/types";
import type { ChatMessage, ToolRun, ToolRunStatus } from "./chat-types";
import { COMMANDS, type SlashCommand } from "./commands/index";
import { MentionMenu, CommandMenu } from "./menu";
import { useComposerState } from "./composer-state";
import { selectFilePaths } from "./select-file-paths";
import { clearConversation as runClearConversation } from "./commands/clear";
import { createReactViewDefinition } from "../../app/react-view";
import { systemPrompt } from "./system-prompt";
import { PromptComposer } from "./components/prompt-composer";
import { ChangeDecisionOverlay } from "./components/change-decision";
import { LLM_PROXY_PREFIX } from "@/env-variables";

type AgentViewProps = {
	readonly context?: ViewContext;
};

type ToolSession = {
	id: string;
	runs: ToolRun[];
};

const CONVERSATION_KEY = "flashtype_agent_conversation_id";
const MODEL_NAME = "google/gemini-2.5-pro";

const formatToolError = (value: unknown): string => {
	if (value instanceof Error) return value.message;
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

/**
 * Agent chat view backed by the real Lix agent.
 *
 * The composer retains the prototype UX (slash commands, mentions) while
 * delegating message handling to the agent SDK. Tool executions stream into
 * the transcript via the existing tool run visualization.
 *
 * @example
 * <AgentView />
 */
export function AgentView({ context }: AgentViewProps) {
	const lix = useLix();

	const [agentMessages, setAgentMessages] = useState<
		AgentConversationMessage[]
	>([]);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agent, setAgent] = useState<LixAgent | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [pendingProposal, setPendingProposal] = useState<{
		proposalId: string;
		summary?: string;
		details?: ChangeProposalSummary | null;
		accept: () => Promise<void>;
		reject: (reason?: string) => Promise<void>;
	} | null>(null);
	const [missingKey, setMissingKey] = useState(false);

	const provider = useMemo(() => {
		return createGatewayProvider({
			apiKey: "proxy",
			baseURL: `${LLM_PROXY_PREFIX}/v1/ai`,
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request =
					input instanceof Request ? input : new Request(input, init);
				const headers = new Headers(request.headers);
				headers.delete("authorization");
				const response = await fetch(new Request(request, { headers }));
				if (response.status === 500) {
					try {
						const clone = response.clone();
						const text = await clone.text();
						if (text.includes("Missing AI_GATEWAY_API_KEY")) {
							setMissingKey(true);
						}
					} catch {
						// ignore clone failures
					}
				} else {
					setMissingKey((prev) => (prev ? false : prev));
				}
				return response;
			},
		});
	}, []);

	const model = useMemo(
		() => (missingKey ? null : provider(MODEL_NAME)),
		[missingKey, provider],
	);
	const hasKey = !missingKey;
	const ready = !!agent;

	const upsertConversationPointer = useCallback(
		async (id: string) => {
			await lix.db.transaction().execute(async (trx) => {
				const existing = await trx
					.selectFrom("key_value_all")
					.where("lixcol_version_id", "=", "global")
					.where("key", "=", CONVERSATION_KEY)
					.select(["key"])
					.executeTakeFirst();

				if (existing) {
					await trx
						.updateTable("key_value_all")
						.set({ value: id, lixcol_untracked: true })
						.where("key", "=", CONVERSATION_KEY)
						.where("lixcol_version_id", "=", "global")
						.execute();
				} else {
					await trx
						.insertInto("key_value_all")
						.values({
							key: CONVERSATION_KEY,
							value: id,
							lixcol_version_id: "global",
							lixcol_untracked: true,
						})
						.execute();
				}
			});
		},
		[lix],
	);

	const refreshConversationId = useCallback(async (): Promise<string | null> => {
		const ptr = await lix.db
			.selectFrom("key_value_all")
			.where("lixcol_version_id", "=", "global")
			.where("key", "=", CONVERSATION_KEY)
			.select(["value"])
			.executeTakeFirst();
		const id =
			typeof ptr?.value === "string" && ptr.value.length > 0
				? (ptr.value as string)
				: null;
		setConversationId(id);
		return id;
	}, [lix]);

	const ensureConversationId = useCallback(async (): Promise<string> => {
		if (conversationId) return conversationId;

		const existing = await refreshConversationId();
		if (existing) {
			return existing;
		}

		const created = await createConversation({ lix, versionId: "global" });
		await upsertConversationPointer(created.id);
		setConversationId(created.id);
		return created.id;
	}, [conversationId, refreshConversationId, lix, upsertConversationPointer]);

	// Boot agent
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!hasKey || !model) {
				setAgent(null);
				setConversationId(null);
				setAgentMessages([]);
				return;
			}
			const nextAgent = await createLixAgent({ lix, model, systemPrompt });
			if (cancelled) return;
			setAgent(nextAgent);
			await refreshConversationId();
		})();
		return () => {
			cancelled = true;
		};
	}, [lix, model, hasKey, refreshConversationId]);

	// Subscribe to conversation messages when the ID changes
	useEffect(() => {
		let cancelled = false;
		let sub: { unsubscribe(): void } | null = null;
		(async () => {
			if (!conversationId) {
				setAgentMessages([]);
				return;
			}
			const query = lix.db
				.selectFrom("conversation_message")
				.where("conversation_id", "=", String(conversationId))
				.select([
					"id",
					"body",
					"lixcol_metadata",
					"lixcol_created_at",
					"parent_id",
					"conversation_id",
				])
				.orderBy("lixcol_created_at", "asc")
				.orderBy("id", "asc");
			sub = lix.observe(query).subscribe({
				next: (rows) => {
					if (cancelled) return;
					type ConversationRow = (typeof rows)[number] & {
						lixcol_metadata?: Record<string, unknown> | null;
					};
					const hist: AgentConversationMessage[] = (
						rows as ConversationRow[]
					).map((r) => ({
						...r,
						id: String(r.id),
						conversation_id: String(r.conversation_id),
						parent_id: (r.parent_id as string | null) ?? null,
						lixcol_metadata: (r.lixcol_metadata ??
							null) as AgentConversationMessageMetadata | null,
					}));
					setAgentMessages(hist);
				},
			});
		})();
		return () => {
			cancelled = true;
			sub?.unsubscribe();
		};
	}, [lix, conversationId]);

	const acceptPendingProposal = useCallback(async () => {
		if (!pendingProposal) return;
		try {
			await pendingProposal.accept();
		} catch (error_) {
			const message =
				error_ instanceof Error ? error_.message : String(error_ ?? "unknown");
			setError(`Error: ${message}`);
		}
	}, [pendingProposal]);

	const rejectPendingProposal = useCallback(async () => {
		if (!pendingProposal) return;
		try {
			await pendingProposal.reject();
		} catch (error_) {
			const message =
				error_ instanceof Error ? error_.message : String(error_ ?? "unknown");
			setError(`Error: ${message}`);
		}
	}, [pendingProposal]);

	const clear = useCallback(async () => {
		const newId = await runClearConversation({ lix, agent });
		setConversationId(newId);
		setAgentMessages([]);
		setPendingProposal(null);
	}, [agent, lix]);


	const textAreaId = useId();
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

	const fileRows = useQuery(({ lix }) => selectFilePaths({ lix, limit: 50 }));
	const filePaths = useMemo(
		() => (fileRows ?? []).map((row: any) => String(row.path)),
		[fileRows],
	);
	const hasFiles = filePaths.length > 0;

	const {
		value,
		setValue,
		history,
		historyIdx: _historyIdx,
		setHistoryIdx,
		slashOpen,
		setSlashOpen,
		slashIdx,
		setSlashIdx,
		mentionOpen,
		setMentionOpen,
		mentionIdx,
		setMentionIdx,
		mentionItems,
		mentionCtx,
		filteredCommands,
		updateMentions,
		pushHistory,
	} = useComposerState({ commands: COMMANDS, files: filePaths });

	// const hasConversations = agentMessages.length > 0;
	// const conversationLabel = hasConversations
	// 	? "Current conversation"
	// 	: "New conversation";

	const [notice, setNotice] = useState<string | null>(null);
	const [toolSessions, setToolSessions] = useState<ToolSession[]>([]);
	const activeSessionRef = useRef<string | null>(null);

	const agentTranscript = useMemo<ChatMessage[]>(() => {
		return agentMessages.flatMap((message) => {
			const metadata = message.lixcol_metadata as
				| AgentConversationMessageMetadata
				| undefined;
			const role =
				(metadata?.lix_agent_sdk_role as "user" | "assistant" | undefined) ??
				"assistant";
			const rawSteps = metadata?.lix_agent_sdk_steps;
			const steps: AgentStep[] = Array.isArray(rawSteps) ? rawSteps : [];
			const base: ChatMessage = {
				id: message.id,
				role,
				content: toPlainText(message.body as ZettelDoc),
			};
			if (role === "assistant" && steps.length > 0) {
				return [{ ...base, toolRuns: stepsToToolRuns(steps) }];
			}
			return [base];
		});
	}, [agentMessages]);

	const transcript = useMemo<ChatMessage[]>(() => {
		const out: ChatMessage[] = [...agentTranscript];
		if (toolSessions.length > 0) {
			const pendingRuns = toolSessions.flatMap((session) => session.runs);
			if (pendingRuns.length > 0) {
				const lastSessionId =
					toolSessions[toolSessions.length - 1]?.id ?? "pending";
				out.push({
					id: `tool-session-${lastSessionId}`,
					role: "assistant",
					content: "",
					toolRuns: pendingRuns,
				});
			}
		}
		if (pending) {
			out.push({
				id: "agent-pending",
				role: "assistant",
				content: "Thinking…",
			});
		}
		if (notice) {
			out.push({
				id: "agent-notice",
				role: "system",
				content: notice,
			});
		}
	if (error) {
		out.push({
			id: "agent-error",
			role: "system",
			content: error,
		});
	}
		if (!hasKey) {
			out.push({
				id: "agent-missing-key",
				role: "system",
				content:
					"Missing AI_GATEWAY_API_KEY. Add one to enable the Lix Agent conversation.",
			});
		}
		return out;
	}, [agentTranscript, toolSessions, pending, notice, error, hasKey]);

	const updateMention = useCallback(() => {
		updateMentions(textAreaRef.current);
	}, [updateMentions]);

	const insertMention = useCallback(
		(path: string) => {
			const ctx = mentionCtx.current;
			if (!ctx) return;
			const before = value.slice(0, ctx.start);
			const after = value.slice(ctx.end);
			const needsSpace = after.startsWith(" ") ? "" : " ";
			const next = `${before}${path}${needsSpace}${after}`;
			setValue(next);
			setMentionOpen(false);
			setSlashOpen(false);
			setSlashIdx(0);
			mentionCtx.current = null;
			queueMicrotask(() => {
				const el = textAreaRef.current;
				if (el) {
					const pos = before.length + path.length + needsSpace.length;
					el.setSelectionRange(pos, pos);
					el.focus();
				}
			});
		},
		[value, setValue, setMentionOpen, setSlashOpen, setSlashIdx, mentionCtx],
	);

	const handleAcceptDecision = useCallback(
		(id: string) => {
			if (!pendingProposal || pendingProposal.proposalId !== id) return;
			acceptPendingProposal();
		},
		[pendingProposal, acceptPendingProposal],
	);

	const handleRejectDecision = useCallback(
		(id: string) => {
			if (!pendingProposal || pendingProposal.proposalId !== id) return;
			rejectPendingProposal();
		},
		[pendingProposal, rejectPendingProposal],
	);

	const beginToolSession = useCallback(() => {
		const id = generateSessionId();
		activeSessionRef.current = id;
		setToolSessions((prev) => [...prev, { id, runs: [] }]);
		return id;
	}, []);

	const finalizeToolSession = useCallback((id: string) => {
		setToolSessions((prev) => prev.filter((session) => session.id !== id));
	}, []);

	const resetToolSessions = useCallback(() => {
		activeSessionRef.current = null;
		setToolSessions([]);
	}, []);

	const handleToolEvent = useCallback(
		(event: Extract<AgentEvent, { type: "tool" }>) => {
			const sessionId = activeSessionRef.current;
			if (!sessionId) return;
			setToolSessions((prev) => {
				const index = prev.findIndex((session) => session.id === sessionId);
				if (index === -1) return prev;
				const session = prev[index];
				const runs = session.runs.slice();
				const name = formatToolName(event.call.tool_name);
				if (event.phase === "start") {
					runs.push({
						id: event.call.id,
						title: name,
						status: "running",
						input: stringifyPayload(event.call.tool_input),
					});
				} else if (event.phase === "finish") {
					const existingIdx = runs.findIndex((run) => run.id === event.call.id);
					const output = stringifyPayload(event.call.tool_output);
					if (existingIdx === -1) {
						runs.push({
							id: event.call.id,
							title: name,
							status: "success",
							output,
						});
					} else {
						runs[existingIdx] = {
							...runs[existingIdx],
							status: "success",
							title: name,
							output,
						};
					}
				} else if (event.phase === "error") {
					const existingIdx = runs.findIndex((run) => run.id === event.call.id);
					const errorText = formatToolError(event.call.error_text);
					if (existingIdx === -1) {
						runs.push({
							id: event.call.id,
							title: name,
							status: "error",
							output: errorText,
						});
					} else {
						runs[existingIdx] = {
							...runs[existingIdx],
							status: "error",
							title: name,
							output: errorText,
						};
					}
				}
				const next = prev.slice();
				next[index] = { ...session, runs };
				return next;
			});
		},
		[]
	);
	const handleThinkingEvent = useCallback(
		(event: Extract<AgentEvent, { type: "thinking" }>) => {
			const sessionId = activeSessionRef.current;
			if (!sessionId) return;
			setToolSessions((prev) => {
				const index = prev.findIndex((session) => session.id === sessionId);
				if (index === -1) return prev;
				const session = prev[index];
				const runs = session.runs.slice();
				const existingIdx = runs.findIndex((run) => run.id === event.id);
				const nextContent =
					(existingIdx === -1 ? "" : runs[existingIdx]?.content ?? "") +
					event.delta;
				if (existingIdx === -1) {
					runs.push({
						id: event.id,
						title: "Thinking",
						status: "thinking",
						content: nextContent,
					});
				} else {
					const existing = runs[existingIdx];
					runs[existingIdx] = {
						...existing,
						title: existing.title || "Thinking",
						status: "thinking",
						content: nextContent,
					};
				}
				const next = prev.slice();
				next[index] = { ...session, runs };
				return next;
			});
		},
		[]
	);
	const handleStepEvent = useCallback(
		(event: Extract<AgentEvent, { type: "step" }>) => {
			if (event.step.kind !== "thinking") return;
			const thinkingStep = event.step as AgentThinkingStep;
			const sessionId = activeSessionRef.current;
			if (!sessionId) return;
			setToolSessions((prev) => {
				const index = prev.findIndex((session) => session.id === sessionId);
				if (index === -1) return prev;
				const session = prev[index];
				const runs = session.runs.slice();
				const existingIdx = runs.findIndex((run) => run.id === thinkingStep.id);
				if (existingIdx === -1) {
					runs.push({
						id: thinkingStep.id,
						title: "Thinking",
						status: "thinking",
						content: thinkingStep.text,
					});
				} else {
					const existing = runs[existingIdx];
					runs[existingIdx] = {
						...existing,
						title: existing.title || "Thinking",
						status: "thinking",
						content: thinkingStep.text,
					};
				}
				const next = prev.slice();
				next[index] = { ...session, runs };
				return next;
			});
		},
		[]
	);

	const send = useCallback(
		async (
			text: string,
				opts?: {
					signal?: AbortSignal;
					onToolEvent?: (event: Extract<AgentEvent, { type: "tool" }>) => void;
				},
		) => {
			if (!agent) throw new Error("Agent not ready");
			const trimmed = text.trim();
			if (!trimmed) return;
			setError(null);
			setPendingProposal(null);
			setPending(true);
			try {
				const convId = await ensureConversationId();
				setConversationId(convId);
				console.log("[agent] send", {
					conversationId: convId,
					proposalMode: true,
				});
				const stream = sendMessage({
					agent,
					prompt: fromPlainText(trimmed),
					conversationId: convId,
					signal: opts?.signal,
					proposalMode: true,
				});
				let finalMessage: AgentConversationMessage | null = null;
				let errorEvent: Extract<AgentEvent, { type: "error" }> | null = null;
				let activeProposal: {
					id: string;
					summary?: string;
					details?: ChangeProposalSummary | null;
				} | null = null;
				const handledToolPhases = new Map<
					string,
					Extract<AgentEvent, { type: "tool" }>["phase"]
				>();
				for await (const event of stream) {
					switch (event.type) {
						case "thinking":
							handleThinkingEvent(event);
							break;
						case "tool": {
							const { call, phase } = event;
							const name = call.tool_name;
							if (name && handledToolPhases.get(call.id) !== phase) {
								handledToolPhases.set(call.id, phase);
								opts?.onToolEvent?.(event);
							}
							break;
						}
						case "step":
							handleStepEvent(event);
							break;
						case "proposal:open": {
							const details = agent
								? getChangeProposalSummary(agent, event.proposal.id)
								: null;
							activeProposal = {
								id: event.proposal.id,
								summary: event.proposal.summary,
								details,
							};
							setPendingProposal({
								proposalId: event.proposal.id,
								summary: event.proposal.summary,
								details,
								accept: event.accept,
								reject: event.reject,
							});
							if (context && details?.fileId && details.filePath) {
								console.log("Proposal event", event);
								const diffConfig = createProposalDiffConfig({
									fileId: details.fileId,
									filePath: details.filePath,
									sourceVersionId: details.source_version_id,
									targetVersionId: details.target_version_id,
								});
								context.openDiffView?.(details.fileId, details.filePath, {
									focus: true,
									diffConfig,
								});
							}
							break;
						}
						case "proposal:closed": {
							const details = activeProposal?.details;
							if (context && details?.fileId) {
								context.closeDiffView?.(details.fileId);
							}
							setPendingProposal(null);
							activeProposal = null;
							break;
						}
						case "message":
							finalMessage = event.message;
							setConversationId(String(event.message.conversation_id));
							break;
						case "error":
							errorEvent = event;
							break;
						default:
							break;
					}
				}

				if (errorEvent) {
					const err =
						errorEvent.error instanceof Error
							? errorEvent.error
							: new Error(String(errorEvent.error ?? "Agent stream error"));
					throw err;
				}

				if (!finalMessage) {
					throw new Error("Agent did not produce a final message");
				}

				console.log("[agent] turn completed", {
					conversationId: finalMessage.conversation_id,
				});
			} catch (err) {
				const message =
					err instanceof Error ? err.message : String(err ?? "unknown");
				if (err instanceof ChangeProposalRejectedError) {
					setError(
						"Change proposal rejected. Tell the agent what to do differently.",
					);
				} else {
					setError(`Error: ${message}`);
				}
				throw err;
			} finally {
				setPending(false);
			}
		},
		[agent, ensureConversationId, context, handleThinkingEvent, handleStepEvent],
	);

	useEffect(() => {
		updateMention();
	}, [value, updateMention]);

	const handleSlashCommand = useCallback(
		async (raw: string) => {
			const normalized = raw.trim().toLowerCase();
			if (normalized === "clear" || normalized === "reset") {
				try {
					await clear();
					resetToolSessions();
					setNotice("Conversation cleared.");
				} catch (err) {
					const message =
						err instanceof Error ? err.message : String(err ?? "unknown");
					setNotice(`Failed to clear conversation: ${message}`);
				}
				return;
			}
			if (normalized === "help") {
				setNotice(
					"Commands: /clear – clear the conversation, /help – show this list.",
				);
				return;
			}
			setNotice(`Unknown command: /${normalized}`);
		},
		[clear, resetToolSessions],
	);

	const commit = useCallback(async () => {
		const trimmedEnd = value.trimEnd();
		if (!trimmedEnd) return;
		const trimmedStart = trimmedEnd.trimStart();

		const resetComposer = () => {
			setHistoryIdx(-1);
			setValue("");
			setSlashOpen(false);
			setSlashIdx(0);
			setMentionOpen(false);
			setMentionIdx(0);
			mentionCtx.current = null;
			lastActionFocus(textAreaRef.current);
		};

		if (trimmedStart.startsWith("/")) {
			const token = trimmedStart.slice(1).split(/\s+/)[0] ?? "";
			const lower = token.toLowerCase();
			const matched =
				filteredCommands.find((cmd: SlashCommand) =>
					cmd.name.toLowerCase().startsWith(lower),
				) ?? COMMANDS.find((cmd) => cmd.name.toLowerCase() === lower);
			resetComposer();
			await handleSlashCommand((matched?.name ?? token).toLowerCase());
			return;
		}

		if (!hasKey) {
			setNotice("Add a GOOGLE_API_KEY to enable the Lix Agent.");
			return;
		}
		if (!ready) {
			setNotice(
				"The Lix Agent is still starting up. Please try again shortly.",
			);
			return;
		}

		const sessionId = beginToolSession();
		setNotice(null);
		pushHistory(trimmedEnd);
		resetComposer();

		try {
			await send(trimmedEnd, { onToolEvent: handleToolEvent });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : String(err ?? "unknown");
			if (err instanceof ChangeProposalRejectedError) {
				setNotice(null);
			} else {
				console.error("Failed to send agent message:", err);
				setNotice(`Failed to send message: ${message}`);
			}
		} finally {
			finalizeToolSession(sessionId);
			activeSessionRef.current = null;
		}
	}, [
		value,
		hasKey,
		ready,
		setHistoryIdx,
		setValue,
		setSlashOpen,
		setSlashIdx,
		setMentionOpen,
		setMentionIdx,
		mentionCtx,
		handleSlashCommand,
		beginToolSession,
		pushHistory,
		send,
		handleToolEvent,
		finalizeToolSession,
		filteredCommands,
	]);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			// Enter sends unless shift pressed
			if (e.key === "Enter" && !e.shiftKey) {
				if (mentionOpen && mentionItems[mentionIdx]) {
					e.preventDefault();
					insertMention(mentionItems[mentionIdx]);
					return;
				}
				e.preventDefault();
				void commit();
				return;
			}

			if (mentionOpen) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					setMentionIdx((idx: number) =>
						Math.min(idx + 1, Math.max(mentionItems.length - 1, 0)),
					);
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					setMentionIdx((idx: number) => Math.max(idx - 1, 0));
					return;
				}
				if (e.key === "Tab") {
					e.preventDefault();
					if (mentionItems[mentionIdx]) insertMention(mentionItems[mentionIdx]);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					setMentionOpen(false);
					mentionCtx.current = null;
					return;
				}
			}

			if (slashOpen) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					setSlashIdx((idx: number) =>
						Math.min(idx + 1, Math.max(filteredCommands.length - 1, 0)),
					);
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					setSlashIdx((idx: number) => Math.max(idx - 1, 0));
					return;
				}
				if (e.key === "Tab") {
					e.preventDefault();
					const pick = filteredCommands[slashIdx];
					if (pick) setValue(`/${pick.name} `);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					setSlashOpen(false);
					return;
				}
			}

			if (
				(e.key === "ArrowUp" || e.key === "ArrowDown") &&
				!e.shiftKey &&
				!e.metaKey &&
				!e.ctrlKey
			) {
				e.preventDefault();
				setHistoryIdx((idx) => {
					if (e.key === "ArrowUp") {
						const nextIdx = Math.min(idx + 1, history.length - 1);
						const entry = history[nextIdx];
						if (entry !== undefined) setValue(entry);
						queueMicrotask(() => moveCaretToEnd(textAreaRef.current));
						return nextIdx;
					}
					const nextIdx = Math.max(idx - 1, -1);
					const entry = nextIdx === -1 ? "" : (history[nextIdx] ?? "");
					setValue(entry);
					queueMicrotask(() => moveCaretToEnd(textAreaRef.current));
					return nextIdx;
				});
				return;
			}

			if (e.key === "@" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
				queueMicrotask(() => updateMention());
			}

			if (e.key === "Escape") {
				if (mentionOpen || slashOpen) {
					e.preventDefault();
					setMentionOpen(false);
					setSlashOpen(false);
					mentionCtx.current = null;
					return;
				}
			}
		},
		[
			mentionOpen,
			mentionItems,
			mentionIdx,
			insertMention,
			commit,
			slashOpen,
			filteredCommands,
			slashIdx,
			history,
			setMentionIdx,
			setSlashIdx,
			setSlashOpen,
			setValue,
			setHistoryIdx,
			setMentionOpen,
			mentionCtx,
			updateMention,
		],
	);

	const menuFragment = useMemo(() => {
		if (mentionOpen) {
			if (mentionItems.length > 0) {
				return <MentionMenu items={mentionItems} selectedIndex={mentionIdx} />;
			}
			return (
				<div className="pointer-events-none rounded-md border border-border/50 bg-white px-3 py-2 text-sm text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
					{hasFiles ? "Type to search files…" : "No files available"}
				</div>
			);
		}
		if (slashOpen) {
			return (
				<CommandMenu commands={filteredCommands} selectedIndex={slashIdx} />
			);
		}
		return null;
	}, [
		mentionOpen,
		mentionItems,
		mentionIdx,
		hasFiles,
		slashOpen,
		filteredCommands,
		slashIdx,
	]);

	const composerPlaceholder = hasKey
		? "Ask Lix Agent…"
		: "Add GOOGLE_API_KEY to enable the Lix Agent…";
	const sendDisabled = pending || !hasKey || !ready;

	return (
		<div className="flex min-h-0 flex-1 flex-col px-3 py-2">
			{/* Header with conversation picker */}
			{/*
			<header className="flex items-center justify-between border-b border-border/80 py-1">
				<button
					type="button"
					disabled={!hasConversations}
					className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-foreground transition hover:text-foreground/70 disabled:cursor-default disabled:text-muted-foreground"
				>
					<span>{conversationLabel}</span>
					<ChevronDown className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground/70"
				>
					<Plus className="h-4 w-4" />
				</button>
			</header>
			*/}

			{/* Chat messages */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<ChatMessageList
					messages={transcript}
					onAcceptDecision={handleAcceptDecision}
					onRejectDecision={handleRejectDecision}
				/>
			</div>

			<div className="sticky bottom-0 flex justify-center px-0 pb-1 pt-6">
				{pendingProposal ? (
					<ChangeDecisionOverlay
						id={pendingProposal.proposalId}
						onAccept={handleAcceptDecision}
						onReject={handleRejectDecision}
					/>
				) : (
					<PromptComposer
						textAreaId={textAreaId}
						value={value}
						setValue={setValue}
						setNotice={setNotice}
						setSlashOpen={setSlashOpen}
						setSlashIdx={setSlashIdx}
						setMentionOpen={setMentionOpen}
						mentionCtx={mentionCtx}
						textAreaRef={textAreaRef}
						onKeyDown={onKeyDown}
						updateMention={updateMention}
						menuFragment={menuFragment}
						placeholder={composerPlaceholder}
						sendDisabled={sendDisabled}
						onSend={() => {
							void commit();
						}}
					/>
				)}
			</div>
		</div>
	);
}

/**
 * Agent panel view definition used by the registry.
 *
 * @example
 * import { view as agentView } from "@/views/agent-view";
 */
export const view = createReactViewDefinition({
	key: "agent",
	label: "Lix Agent",
	description: "Chat with the project assistant.",
	icon: Bot,
	component: ({ context }) => (
		<LixProvider lix={context.lix}>
			<AgentView context={context} />
		</LixProvider>
	),
});

export default AgentView;

function stepsToToolRuns(steps: AgentStep[]): ToolRun[] {
	const runs: ToolRun[] = [];
	for (const step of steps) {
		if (step.kind === "thinking") {
			const thinking = step as AgentThinkingStep;
			runs.push({
				id: thinking.id,
				title: "Thinking",
				status: "thinking",
				content: thinking.text,
			});
			continue;
		}
		if (step.kind !== "tool_call") continue;
		const toolStep = step as AgentToolStep;
		const status = statusFromStep(toolStep.status);
		const formattedInput = stringifyPayload(toolStep.tool_input);
		const formattedOutput =
			status === "error"
				? (toolStep.error_text ?? stringifyPayload(toolStep.tool_output))
				: stringifyPayload(toolStep.tool_output);
		const titleSource = toolStep.tool_name
			? formatToolName(toolStep.tool_name)
			: (toolStep.label ?? "Tool");
		runs.push({
			id: toolStep.id,
			title: titleSource,
			detail: toolStep.label,
			status,
			input: formattedInput,
			output: formattedOutput,
			content:
				status === "error" ? (toolStep.error_text ?? undefined) : undefined,
		});
	}
	return runs;
}

function statusFromStep(status?: string): ToolRunStatus {
	if (status === "succeeded") return "success";
	if (status === "failed") return "error";
	return "running";
}

function lastActionFocus(el: HTMLTextAreaElement | null) {
	if (!el) return;
	el.focus();
	el.setSelectionRange(0, 0);
}

function moveCaretToEnd(el: HTMLTextAreaElement | null) {
	if (!el) return;
	const len = el.value.length;
	el.setSelectionRange(len, len);
	el.focus();
}

function generateSessionId(): string {
	const rand = Math.random().toString(36).slice(2, 10);
	return `session-${Date.now().toString(36)}-${rand}`;
}

function formatToolName(name: string): string {
	if (!name) return "Tool";
	return name
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function stringifyPayload(payload: unknown): string | undefined {
	if (payload === null || payload === undefined) return undefined;
	if (typeof payload === "string") return payload;
	try {
		return JSON.stringify(payload, null, 2);
	} catch {
		return String(payload);
	}
}

function createProposalDiffConfig(args: {
	fileId: string;
	filePath: string;
	sourceVersionId: string;
	targetVersionId: string;
}): DiffViewConfig {
	const title = proposalDiffTitle(args.filePath);
	return {
		title,
		query: ({ lix }) =>
			selectVersionDiff({
				lix,
				source: { id: args.sourceVersionId },
				target: { id: args.targetVersionId },
			})
				.where("diff.file_id", "=", args.fileId)
				.orderBy("diff.entity_id")
				.leftJoin("change as after", "after.id", "diff.after_change_id")
				.leftJoin("change as before", "before.id", "diff.before_change_id")
				.select((eb) => [
					eb.ref("diff.entity_id").as("entity_id"),
					eb.ref("diff.schema_key").as("schema_key"),
					eb.ref("diff.status").as("status"),
					eb.ref("before.snapshot_content").as("before_snapshot_content"),
					eb.ref("after.snapshot_content").as("after_snapshot_content"),
					eb.fn
						.coalesce(
							eb.ref("after.plugin_key"),
							eb.ref("before.plugin_key"),
							eb.val("lix_own_entity"),
						)
						.as("plugin_key"),
				])
				.$castTo<RenderableDiff>(),
	};
}

function proposalDiffTitle(filePath: string): string {
	try {
		const decoded = decodeURIComponent(filePath);
		const trimmed = decoded.startsWith("/") ? decoded.slice(1) : decoded;
		return trimmed.length > 0 ? `Proposal: ${trimmed}` : "Proposal Diff";
	} catch {
		const trimmed = filePath.startsWith("/") ? filePath.slice(1) : filePath;
		return trimmed.length > 0 ? `Proposal: ${trimmed}` : "Proposal Diff";
	}
}
