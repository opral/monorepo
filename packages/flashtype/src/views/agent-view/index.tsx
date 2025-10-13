import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { ArrowUp, ChevronDown, Plus } from "lucide-react";
import { useLix, useQuery } from "@lix-js/react-utils";
import { ChatMessageList } from "./chat-message-list";
import type { ViewContext } from "../../app/types";
import type { ChatMessage, ToolRun } from "./chat-types";
import { MOCK_COMMANDS } from "./commands";
import { MentionMenu, CommandMenu } from "./menu";
import { extractSlashToken, useComposerState } from "./composer-state";
import { selectFilePaths } from "./select-file-paths";
import { useAgentChat } from "./hooks/use-agent-chat";

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
export function AgentView({ context: _context }: AgentViewProps) {
	const lix = useLix();
	const {
		messages: agentMessages,
		send,
		clear,
		pending,
		error,
		ready,
		hasKey,
	} = useAgentChat({ lix });

	const textAreaId = useId();
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
	} = useComposerState({ commands: MOCK_COMMANDS, files: filePaths });

	const hasConversations = agentMessages.length > 0;
	const conversationLabel = hasConversations
		? "Current conversation"
		: "New conversation";

	const [notice, setNotice] = useState<string | null>(null);
	const [toolSessions, setToolSessions] = useState<ToolSession[]>([]);
	const activeSessionRef = useRef<string | null>(null);

	const agentTranscript = useMemo<ChatMessage[]>(() => {
		return agentMessages.map((message) => ({
			id: message.id,
			role: message.role,
			content: message.content,
		}));
	}, [agentMessages]);

	const transcript = useMemo<ChatMessage[]>(() => {
		const out: ChatMessage[] = [...agentTranscript];
		for (const session of toolSessions) {
			if (session.runs.length === 0) continue;
			out.push({
				id: `tool-session-${session.id}`,
				role: "assistant",
				content: "",
				toolRuns: session.runs,
			});
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
					"Missing GOOGLE_API_KEY. Add one to enable the Lix Agent conversation.",
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

	const beginToolSession = useCallback(() => {
		const id = generateSessionId();
		activeSessionRef.current = id;
		setToolSessions((prev) => [...prev, { id, runs: [] }]);
		return id;
	}, []);

	const finalizeToolSession = useCallback((id: string) => {
		setToolSessions((prev) => {
			const index = prev.findIndex((session) => session.id === id);
			if (index === -1) return prev;
			const next = prev.slice();
			if (next[index]?.runs.length === 0) {
				next.splice(index, 1);
				return next;
			}
			return next;
		});
	}, []);

	const resetToolSessions = useCallback(() => {
		activeSessionRef.current = null;
		setToolSessions([]);
	}, []);

	const handleToolEvent = useCallback(
		(event: import("@lix-js/agent-sdk").ToolEvent) => {
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
		},
		[],
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
				filteredCommands.find((cmd) =>
					cmd.name.toLowerCase().startsWith(lower),
				) ?? MOCK_COMMANDS.find((cmd) => cmd.name.toLowerCase() === lower);
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

			{/* Chat messages */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<ChatMessageList messages={transcript} />
			</div>

			{/* Input area */}
			<div className="sticky bottom-0 flex justify-center px-0 pb-1 pt-6">
				<div className="relative w-full max-w-3xl overflow-visible rounded-md border border-border/80 bg-background transition focus-within:border-amber-500 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]">
					<label htmlFor={textAreaId} className="sr-only">
						Ask the assistant
					</label>
					<textarea
						ref={textAreaRef}
						id={textAreaId}
						data-testid="agent-composer-input"
						placeholder={composerPlaceholder}
						value={value}
						onChange={(event) => {
							const next = event.target.value;
							const token = extractSlashToken(next);
							setValue(next);
							setNotice(null);
							setSlashOpen(token !== null);
							setSlashIdx(0);
							if (token !== null) {
								setMentionOpen(false);
								mentionCtx.current = null;
							}
						}}
						onKeyDown={onKeyDown}
						onClick={updateMention}
						onSelect={updateMention}
						className="h-28 w-full resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none focus-visible:outline-none"
					/>
					{menuFragment ? (
						<div className="absolute left-0 right-0 bottom-full z-[2] mb-2">
							{menuFragment}
						</div>
					) : null}
					<div className="flex justify-end bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
						<button
							type="button"
							onClick={() => {
								void commit();
							}}
							disabled={sendDisabled}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
						>
							<ArrowUp className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

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
