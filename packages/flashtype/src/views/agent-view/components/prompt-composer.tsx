import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";
import { ArrowUp } from "lucide-react";
import { ChangeProposalRejectedError } from "@lix-js/agent-sdk";
import { MentionMenu, CommandMenu } from "../menu";
import type { SlashCommand } from "../commands";
import { buildMentionList, calculateMentionRange } from "../mention-utils";

const MAX_HISTORY = 20;

type PromptComposerProps = {
	/**
	 * Enablement flags for sending messages and slash commands.
	 */
	hasKey: boolean;
	/**
	 * Available slash commands surfaced in the composer.
	 */
	commands: readonly SlashCommand[];
	/**
	 * Mentionable file paths resolved for the current workspace.
	 */
	files: readonly string[];
	/**
	 * When `true`, disables the composer send action.
	 */
	pending: boolean;
	/**
	 * Update the notice banner rendered by the parent view.
	 */
	onNotice(value: string | null): void;
	/**
	 * Dispatch the normalized slash command selected by the user.
	 *
	 * @example
	 * await onSlashCommand("clear");
	 */
	onSlashCommand(command: string): Promise<void>;
	/**
	 * Send a free-form message to the agent.
	 *
	 * @example
	 * await onSendMessage("What changed in commit abc?");
	 */
	onSendMessage(value: string): Promise<void>;
};

/**
 * Prompt composer textarea with slash-command support.
 */
export function PromptComposer({
	hasKey,
	commands,
	files,
	pending,
	onNotice,
	onSlashCommand,
	onSendMessage,
}: PromptComposerProps) {
	const textAreaId = useId();
	const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
	const [value, setValue] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [, setHistoryIdx] = useState(-1);
	const [slashOpen, setSlashOpen] = useState(false);
	const [slashIdx, setSlashIdx] = useState(0);
	const [mentionOpen, setMentionOpen] = useState(false);
	const [mentionIdx, setMentionIdx] = useState(0);
	const [mentionItems, setMentionItems] = useState<string[]>([]);
	const mentionCtx = useRef<{
		start: number;
		end: number;
		query: string;
	} | null>(null);
	const slashToken = useMemo(() => extractSlashToken(value), [value]);
	const filteredCommands = useMemo(() => {
		if (slashToken === null) return [] as SlashCommand[];
		if (slashToken === "") return commands;
		const token = slashToken.toLowerCase();
		return commands.filter((cmd) => cmd.name.toLowerCase().startsWith(token));
	}, [commands, slashToken]);
	const updateMentions = useCallback(
		(textarea: HTMLTextAreaElement | null) => {
			const caret = textarea
				? (textarea.selectionStart ?? value.length)
				: value.length;
			const mention = calculateMentionRange(value, caret);
			if (!mention) {
				setMentionOpen(false);
				setMentionItems([]);
				mentionCtx.current = null;
				return;
			}
			setSlashOpen(false);
			mentionCtx.current = mention;
			setMentionItems(buildMentionList(mention.query, files));
			setMentionIdx(0);
			setMentionOpen(true);
		},
		[value, files],
	);
	const pushHistory = useCallback((entry: string) => {
		setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
	}, []);

	useEffect(() => {
		updateMentions(textAreaRef.current);
	}, [value, updateMentions]);

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
				) ?? commands.find((cmd) => cmd.name.toLowerCase() === lower);
			resetComposer();
			await onSlashCommand((matched?.name ?? token).toLowerCase());
			return;
		}

		if (!hasKey) {
			onNotice("Add a GOOGLE_API_KEY to enable the Lix Agent.");
			return;
		}

		onNotice(null);
		pushHistory(trimmedEnd);
		resetComposer();

		try {
			await onSendMessage(trimmedEnd);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : String(err ?? "unknown");
			if (err instanceof ChangeProposalRejectedError) {
				onNotice(null);
			} else {
				console.error("Failed to send agent message:", err);
				onNotice(`Failed to send message: ${message}`);
			}
		}
	}, [
		value,
		setHistoryIdx,
		setValue,
		setSlashOpen,
		setSlashIdx,
		setMentionOpen,
		setMentionIdx,
		mentionCtx,
		filteredCommands,
		commands,
		onSlashCommand,
		hasKey,
		onNotice,
		pushHistory,
		onSendMessage,
	]);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLTextAreaElement>) => {
			// Enter sends unless shift pressed
			if (event.key === "Enter" && !event.shiftKey) {
				if (mentionOpen && mentionItems[mentionIdx]) {
					event.preventDefault();
					insertMention(mentionItems[mentionIdx]);
					return;
				}
				event.preventDefault();
				void commit();
				return;
			}

			if (mentionOpen) {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					setMentionIdx((idx: number) =>
						Math.min(idx + 1, Math.max(mentionItems.length - 1, 0)),
					);
					return;
				}
				if (event.key === "ArrowUp") {
					event.preventDefault();
					setMentionIdx((idx: number) => Math.max(idx - 1, 0));
					return;
				}
				if (event.key === "Tab") {
					event.preventDefault();
					if (mentionItems[mentionIdx]) insertMention(mentionItems[mentionIdx]);
					return;
				}
				if (event.key === "Escape") {
					event.preventDefault();
					setMentionOpen(false);
					mentionCtx.current = null;
					return;
				}
			}

			if (slashOpen) {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					setSlashIdx((idx: number) =>
						Math.min(idx + 1, Math.max(filteredCommands.length - 1, 0)),
					);
					return;
				}
				if (event.key === "ArrowUp") {
					event.preventDefault();
					setSlashIdx((idx: number) => Math.max(idx - 1, 0));
					return;
				}
				if (event.key === "Tab") {
					event.preventDefault();
					const pick = filteredCommands[slashIdx];
					if (pick) setValue(`/${pick.name} `);
					return;
				}
				if (event.key === "Escape") {
					event.preventDefault();
					setSlashOpen(false);
					return;
				}
			}

			if (
				(event.key === "ArrowUp" || event.key === "ArrowDown") &&
				!event.shiftKey &&
				!event.metaKey &&
				!event.ctrlKey
			) {
				event.preventDefault();
				setHistoryIdx((idx) => {
					if (event.key === "ArrowUp") {
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

			if (
				event.key === "@" &&
				!event.shiftKey &&
				!event.metaKey &&
				!event.ctrlKey
			) {
				queueMicrotask(() => updateMentions(textAreaRef.current));
			}

			if (event.key === "Escape") {
				if (mentionOpen || slashOpen) {
					event.preventDefault();
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
			updateMentions,
		],
	);

	const menuFragment = useMemo(() => {
		if (mentionOpen) {
			if (mentionItems.length > 0) {
				return <MentionMenu items={mentionItems} selectedIndex={mentionIdx} />;
			}
			return (
				<div className="pointer-events-none rounded-md border border-border/50 bg-white px-3 py-2 text-sm text-zinc-500 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
					{files.length > 0 ? "Type to search files…" : "No files available"}
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
		files.length,
		slashOpen,
		filteredCommands,
		slashIdx,
	]);

	const placeholder = hasKey
		? "Ask Lix Agent…"
		: "Add GOOGLE_API_KEY to enable the Lix Agent…";
	const sendDisabled = pending || !hasKey;

	return (
		<div className="relative w-full max-w-3xl overflow-visible rounded-md border border-border/80 bg-background transition focus-within:border-amber-500 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]">
			<label htmlFor={textAreaId} className="sr-only">
				Ask the assistant
			</label>
			<textarea
				ref={textAreaRef}
				id={textAreaId}
				data-testid="agent-composer-input"
				placeholder={placeholder}
				value={value}
				onChange={(event) => {
					const next = event.target.value;
					const token = extractSlashToken(next);
					setValue(next);
					onNotice(null);
					setSlashOpen(token !== null);
					setSlashIdx(0);
					if (token !== null) {
						setMentionOpen(false);
						mentionCtx.current = null;
					}
				}}
				onKeyDown={onKeyDown}
				onClick={() => {
					updateMentions(textAreaRef.current);
				}}
				onSelect={() => {
					updateMentions(textAreaRef.current);
				}}
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
	);
}

/**
 * Derives the active slash command token if the input currently forms a command.
 * Returns `null` when the input should not trigger the slash menu (e.g. mentions).
 *
 * @example
 * extractSlashToken("/he") // "he"
 * extractSlashToken("/clear arg") // null
 * extractSlashToken("hello") // null
 */
function extractSlashToken(input: string): string | null {
	if (!input.includes("/")) return null;
	const trimmedLeft = input.trimStart();
	if (!trimmedLeft.startsWith("/")) return null;
	const afterSlash = trimmedLeft.slice(1);
	if (afterSlash.length === 0) return "";
	if (/\s/.test(afterSlash)) return null;
	if (afterSlash.includes("/") || afterSlash.includes(".")) return null;
	return afterSlash;
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
