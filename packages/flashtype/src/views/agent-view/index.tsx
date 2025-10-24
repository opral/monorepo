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
import { createConversation, selectVersionDiff } from "@lix-js/sdk";
import {
	ChangeProposalRejectedError,
	createLixAgent,
	getChangeProposalSummary,
	type AgentConversationMessage,
	type AgentEvent,
	type Agent as LixAgent,
	type ChangeProposalSummary,
	sendMessage,
} from "@lix-js/agent-sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type {
	ViewContext,
	DiffViewConfig,
	RenderableDiff,
} from "../../app/types";
import ConversationMessage from "./conversation-message";
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
import { useKeyValue } from "@/hooks/key-value/use-key-value";

type AgentViewProps = {
	readonly context?: ViewContext;
};

export const CONVERSATION_KEY = "flashtype_agent_conversation_id";
const MODEL_NAME = "google/gemini-2.5-pro";

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

	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agent, setAgent] = useState<LixAgent | null>(null);
	const [conversationId, setConversationId] = useKeyValue(CONVERSATION_KEY);

	useEffect(() => {
		(async () => {
			if (!conversationId) {
				const conversation = await createConversation({ lix });
				setConversationId(conversation.id);
			}
		})();
	}, [conversationId, lix, setConversationId]);

	const [pendingProposal, setPendingProposal] = useState<{
		proposalId: string;
		summary?: string;
		details?: ChangeProposalSummary | null;
		accept: () => Promise<void>;
		reject: (reason?: string) => Promise<void>;
	} | null>(null);

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
				return response;
			},
		});
	}, []);

	const model = useMemo(() => provider(MODEL_NAME), [provider]);
	const hasKey = true;
	const ready = !!agent;

	const messages = useQuery(({ lix }) =>
		lix.db
			.selectFrom("conversation_message")
			.where("conversation_id", "=", conversationId)
			.selectAll()
			.orderBy("lixcol_created_at", "asc")
			.orderBy("id", "asc"),
	);

	// Boot agent
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!hasKey || !model) {
				setAgent(null);
				return;
			}
			const nextAgent = await createLixAgent({ lix, model, systemPrompt });
			if (cancelled) return;
			setAgent(nextAgent);
		})();
		return () => {
			cancelled = true;
		};
	}, [lix, model, hasKey]);

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
		await runClearConversation({ agent: agent!, conversationId });
		setPendingProposal(null);
		setPendingMessage(null);
	}, [agent, conversationId]);

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
	const [pendingMessage, setPendingMessage] =
		useState<AgentConversationMessage | null>(null);

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
				console.log("[agent] send", {
					conversationId: conversationId!,
					proposalMode: true,
				});
				const turn = sendMessage({
					agent,
					prompt: fromPlainText(trimmed),
					conversationId: conversationId!,
					signal: opts?.signal,
					proposalMode: true,
				});
				const updatePending = () => {
					setPendingMessage(structuredClone(turn.message));
				};
				updatePending();
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
				for await (const event of turn) {
					switch (event.type) {
						case "text":
							updatePending();
							break;
						case "thinking":
							updatePending();
							break;
						case "tool": {
							const { call, phase } = event;
							const name = call.tool_name;
							if (name && handledToolPhases.get(call.id) !== phase) {
								handledToolPhases.set(call.id, phase);
								opts?.onToolEvent?.(event);
							}
							updatePending();
							break;
						}
						case "step":
							updatePending();
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
							updatePending();
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
				setPendingMessage(null);
			} catch (err) {
				setPendingMessage(null);
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
		[agent, conversationId, context],
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
		[clear],
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

		setNotice(null);
		pushHistory(trimmedEnd);
		resetComposer();

		try {
			await send(trimmedEnd);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : String(err ?? "unknown");
			if (err instanceof ChangeProposalRejectedError) {
				setNotice(null);
			} else {
				console.error("Failed to send agent message:", err);
				setNotice(`Failed to send message: ${message}`);
			}
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
		pushHistory,
		send,
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

			{/* Conversation messages */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				{messages.map((message) => (
					<ConversationMessage key={message.id} message={message} />
				))}
				{pendingMessage ? (
					<ConversationMessage
						key={pendingMessage.id || "agent-pending"}
						message={pendingMessage}
					/>
				) : pending ? (
					<div className="px-3 py-1 text-xs text-muted-foreground">
						Thinking…
					</div>
				) : null}
				{notice ? (
					<div className="px-3 py-1 text-xs text-muted-foreground">
						{notice}
					</div>
				) : null}
				{error ? (
					<div className="px-3 py-1 text-xs text-rose-500">{error}</div>
				) : null}
				{!hasKey ? (
					<div className="px-3 py-1 text-xs text-muted-foreground">
						Missing AI_GATEWAY_API_KEY. Add one to enable the Lix Agent
						conversation.
					</div>
				) : null}
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
