import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Bot } from "lucide-react";
import { LixProvider, useLix, useQuery } from "@lix-js/react-utils";
import { selectVersionDiff } from "@lix-js/sdk";
import type {
	AgentConversationMessage,
	AgentConversationMessageMetadata,
	AgentStep,
	ChangeProposalEvent,
} from "@lix-js/agent-sdk";
import { toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
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
import { useAgentChat, type ToolEvent } from "./hooks/use-agent-chat";
import { createReactViewDefinition } from "../../app/react-view";
import { systemPrompt } from "./system-prompt";
import { PromptComposer } from "./components/prompt-composer";
import { ChangeDecisionOverlay } from "./components/change-decision";

type AgentViewProps = {
	readonly context?: ViewContext;
};

type ToolSession = {
	id: string;
	runs: ToolRun[];
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

	const handleProposalEvent = useCallback(
		(event: ChangeProposalEvent) => {
			if (!context) return;
			// eslint-disable-next-line no-console
			console.log("Proposal event", event);
			if (event.status === "open") {
				if (!event.fileId || !event.filePath) {
					return;
				}
				const diffConfig = createProposalDiffConfig({
					fileId: event.fileId,
					filePath: event.filePath,
					sourceVersionId:
						event.sourceVersionId ?? event.proposal.source_version_id,
					targetVersionId:
						event.targetVersionId ?? event.proposal.target_version_id,
				});
				context.openDiffView?.(event.fileId, event.filePath, {
					focus: true,
					diffConfig,
				});
				return;
			}
			if (event.fileId) {
				context.closeDiffView?.(event.fileId);
			}
		},
		[context],
	);
	const {
		messages: agentMessages,
		send,
		clear,
		pending,
		error,
		ready,
		hasKey,
		pendingProposal,
		acceptPendingProposal,
		rejectPendingProposal,
	} = useAgentChat({
		lix,
		systemPrompt,
		onProposalEvent: handleProposalEvent,
	});

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
				content: `Error: ${error}`,
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

	const handleToolEvent = useCallback((event: ToolEvent) => {
		const sessionId = activeSessionRef.current;
		if (!sessionId) return;
		setToolSessions((prev) => {
			const index = prev.findIndex((session) => session.id === sessionId);
			if (index === -1) return prev;
			const session = prev[index];
			const runs = session.runs.slice();
			const name = formatToolName(event.name);
			if (event.type === "start") {
				runs.push({
					id: event.id,
					title: name,
					status: "running",
					input: stringifyPayload(event.input),
				});
			} else if (event.type === "finish") {
				const existingIdx = runs.findIndex((run) => run.id === event.id);
				const output = stringifyPayload(event.output);
				if (existingIdx === -1) {
					runs.push({
						id: event.id,
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
			} else if (event.type === "error") {
				const existingIdx = runs.findIndex((run) => run.id === event.id);
				if (existingIdx === -1) {
					runs.push({
						id: event.id,
						title: name,
						status: "error",
						output: event.errorText,
					});
				} else {
					runs[existingIdx] = {
						...runs[existingIdx],
						status: "error",
						title: name,
						output: event.errorText,
					};
				}
			}
			const next = prev.slice();
			next[index] = { ...session, runs };
			return next;
		});
	}, []);

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
			console.error("Failed to send agent message:", err);
			setNotice(`Failed to send message: ${message}`);
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
	return steps
		.filter((step) => (step.kind ?? "tool_call") === "tool_call")
		.map((step) => {
			const status = statusFromStep(step.status);
			const formattedInput = stringifyPayload(step.tool_input);
			const formattedOutput =
				status === "error"
					? (step.error_text ?? stringifyPayload(step.tool_output))
					: stringifyPayload(step.tool_output);
			const titleSource = step.tool_name
				? formatToolName(step.tool_name)
				: (step.label ?? "Tool");
			return {
				id: step.id,
				title: titleSource,
				detail: step.label,
				status,
				input: formattedInput,
				output: formattedOutput,
				content:
					status === "error" ? (step.error_text ?? undefined) : undefined,
			};
		});
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
