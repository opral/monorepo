import {
	useState,
	useId,
	useRef,
	useCallback,
	useMemo,
	useEffect,
} from "react";
import { ArrowUp, ChevronDown, Plus } from "lucide-react";
import { ChatMessageList } from "@/components/agent-chat/chat-message-list";
import type { ViewContext } from "../../types";
import type { ChatMessage } from "@/components/agent-chat/types";
import { MOCK_COMMANDS } from "./commands";
import { MentionMenu, CommandMenu } from "./menu";
import { extractSlashToken, useComposerState } from "./composer-state";
import { useQuery } from "@lix-js/react-utils";
import { selectFilePaths } from "./select-file-paths";

type AgentViewProps = {
	readonly context?: ViewContext;
};

// Mock data to demonstrate the agent UI prototype
const MOCK_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		role: "user",
		content:
			"can you see the vscode's extensions source code at ~/.vscode/extensions/anthropic.claude-code-2.0.5/webview?",
	},
	{
		id: "2",
		role: "assistant",
		content: "",
		toolRuns: [
			{
				id: "t1",
				title: "Bash",
				detail: "List contents of the extension webview directory",
				status: "success",
				input:
					"ls -la ~/.vscode/extensions/anthropic.claude-code-2.0.5/webview",
				output: `total 9008
drwxr-xr-x  5 samuel  staff      160 Oct  3 09:19 .
drwxr-xr-x  9 samuel  staff      288 Oct  3 09:19 ..
-rw-r--r--  1 samuel  staff    80340 Oct  3 09:19 codicon-37A3DWZT.ttf
-rw-r--r--  1 samuel  staff   167564 Oct  3 09:19 index.css
-rw-r--r--  1 samuel  staff  4362164 Oct  3 09:19 index.js`,
			},
			{
				id: "t2",
				title: "Read",
				detail: "index.js (lines 2-101)",
				status: "success",
				input:
					"/Users/samuel/.vscode/extensions/anthropic.claude-code-2.0.5/webview/index.js",
				output: `var TKe=Object.create;var dX=Object.defineProperty;...
[498 lines truncated]`,
			},
			{
				id: "t3",
				title: "Read",
				detail: "index.css (lines 2-201)",
				status: "success",
				input:
					"/Users/samuel/.vscode/extensions/anthropic.claude-code-2.0.5/webview/index.css",
			},
			{
				id: "t3a",
				title: "",
				status: "thinking",
				content:
					"Yes! I can access that directory. Let me explore the structure:",
			},
		],
	},
	{
		id: "3",
		role: "assistant",
		content: "",
		toolRuns: [
			{
				id: "t3b",
				title: "",
				status: "thinking",
				content:
					"The files are too large since they're bundled/minified. Let me check if there's a source directory or look at the extension's package structure:",
			},
			{
				id: "t4",
				title: "Bash",
				detail: "List extension root directory",
				status: "success",
				input: "ls -la ~/.vscode/extensions/anthropic.claude-code-2.0.5/",
				output: `total 1936
drwxr-xr-x   9 samuel  staff     288 Oct  3 09:19 .
drwxr-xr-x  89 samuel  staff    2848 Oct  4 17:53 ..
-rw-r--r--   1 samuel  staff    1969 Oct  3 09:19 .vsixmanifest
-rw-r--r--   1 samuel  staff   12368 Oct  3 09:19 claude-code-settings.schema.json
-rw-r--r--   1 samuel  staff  954679 Oct  3 09:19 extension.js
-rw-r--r--   1 samuel  staff    5974 Oct  3 09:19 package.json
-rw-r--r--   1 samuel  staff    1360 Oct  3 09:19 README.md
drwxr-xr-x   8 samuel  staff     256 Oct  3 09:19 resources
drwxr-xr-x   5 samuel  staff     160 Oct  3 09:19 webview`,
			},
			{
				id: "t5",
				title: "Glob",
				detail: 'pattern: "**/panel-views/**/index.tsx"',
				status: "success",
				input: 'find . -path "**/panel-views/**/index.tsx"',
				output: `/Users/samuel/git-repos/monorepo-3/packages/flashtype/src/prototypes/v2-layout/panel-views/agent-view/index.tsx
/Users/samuel/git-repos/monorepo-3/packages/flashtype/src/prototypes/v2-layout/panel-views/diff-view/index.tsx`,
			},
			{
				id: "t5a",
				title: "",
				status: "thinking",
				content:
					"The extension is bundled. However, I can help you design an AI agent chat view inspired by the reference UI.",
			},
		],
	},
];

/**
 * Agent chat view (UI-only mock for now).
 * Demonstrates the tool visualization design with collapsible sections.
 */
export function AgentView({ context: _context }: AgentViewProps) {
	const [messages] = useState<ChatMessage[]>(MOCK_MESSAGES);
	const textAreaId = useId();
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const fileRows =
		useQuery(({ lix }) => selectFilePaths({ lix, limit: 50 })) ?? [];
	const filePaths = fileRows.map((row: any) => String(row.path));

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

	const hasConversations = false;
	const conversationLabel = hasConversations
		? "New conversation"
		: "No previous conversations";

	const updateMention = useCallback(() => {
		updateMentions(textAreaRef.current);
	}, [textAreaRef, updateMentions]);

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
		[
			value,
			setValue,
			setMentionOpen,
			setSlashOpen,
			setSlashIdx,
			mentionCtx,
			textAreaRef,
		],
	);

	const commit = useCallback(() => {
		const trimmedEnd = value.trimEnd();
		if (!trimmedEnd) return;
		const trimmedStart = trimmedEnd.trimStart();
		if (trimmedStart.startsWith("/")) {
			const rawToken = trimmedStart.slice(1).split(/\s+/)[0] ?? "";
			const lower = rawToken.toLowerCase();
			const matched =
				filteredCommands.find((c) => c.name.toLowerCase().startsWith(lower)) ??
				MOCK_COMMANDS.find((c) => c.name.toLowerCase().startsWith(lower));
			const commandName = (matched?.name ?? rawToken).trim();
			console.info(`[mock] slash command: /${commandName}`);
		} else {
			console.info(`[mock] send message: ${trimmedEnd}`);
			pushHistory(trimmedEnd);
		}
		setHistoryIdx(-1);
		setValue("");
		setSlashOpen(false);
		setMentionOpen(false);
		mentionCtx.current = null;
		lastActionFocus(textAreaRef.current);
	}, [
		value,
		filteredCommands,
		pushHistory,
		setHistoryIdx,
		setValue,
		setSlashOpen,
		setMentionOpen,
		mentionCtx,
		textAreaRef,
	]);

	useEffect(() => {
		updateMention();
	}, [value, updateMention]);

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
				commit();
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

			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
				e.preventDefault();
				setValue("");
				setHistoryIdx(-1);
				setMentionOpen(false);
				setSlashOpen(false);
				return;
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
			textAreaRef,
		],
	);

	const menuFragment = useMemo(() => {
		if (mentionOpen && mentionItems.length > 0) {
			return <MentionMenu items={mentionItems} selectedIndex={mentionIdx} />;
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
		slashOpen,
		filteredCommands,
		slashIdx,
	]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
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
				<ChatMessageList messages={messages} />
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
						placeholder="Ask Lix Agent…"
						value={value}
						onChange={(event) => {
							const next = event.target.value;
							const token = extractSlashToken(next);
							setValue(next);
							setSlashOpen(token !== null);
							setSlashIdx(0);
							setMentionOpen(false);
							mentionCtx.current = null;
						}}
						onKeyDown={onKeyDown}
						onClick={updateMention}
						onSelect={updateMention}
						className="h-28 w-full resize-none border-0 bg-transparent pl-3 pr-3 py-3 text-sm leading-6 text-foreground outline-none focus-visible:outline-none"
					/>
					{menuFragment ? (
						<div className="absolute left-0 right-0 bottom-full z-[2] mb-2">
							{menuFragment}
						</div>
					) : null}
					<div className="flex justify-end bg-muted/40 pr-3 py-1 text-[11px] text-muted-foreground">
						<button
							type="button"
							onClick={() => commit()}
							className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition hover:bg-muted"
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
