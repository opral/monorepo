import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
	ArrowUp,
	Brain,
	Check,
	ChevronDown,
	FastForward,
	Loader2,
} from "lucide-react";
import { ChangeProposalRejectedError } from "@lix-js/agent-sdk";
import { MentionMenu, CommandMenu } from "../menu";
import type { SlashCommand } from "../commands";
import { buildMentionList, calculateMentionRange } from "../mention-utils";

const MAX_HISTORY = 20;

type ModelOption = {
	id: string;
	label: string;
};

type PromptComposerProps = {
	/**
	 * Enablement flags for sending messages and slash commands.
	 */
	hasKey: boolean;
	/**
	 * Available model options rendered in the composer footer.
	 */
	models: readonly ModelOption[];
	/**
	 * Currently selected model identifier.
	 */
	modelId: string;
	/**
	 * Persist the selected model identifier.
	 */
	onModelChange(value: string): void;
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
	 * When `true`, apply agent edits without proposal review.
	 */
	autoAcceptEnabled: boolean;
	/**
	 * Toggle auto-accept mode for future messages.
	 */
	onAutoAcceptToggle(next: boolean): Promise<void> | void;
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
	models,
	modelId,
	onModelChange,
	autoAcceptEnabled,
	onAutoAcceptToggle,
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
			onNotice("Add an OpenRouter API key to enable the Lix Agent.");
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
		: "Add an OpenRouter API key to enable the Lix Agent…";
	const sendDisabled = pending || !hasKey;

	return (
		<div className="relative w-full max-w-3xl">
			<div className="relative overflow-visible rounded-md border border-border/80 bg-background transition focus-within:border-amber-500 focus-within:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]">
				<label htmlFor={textAreaId} className="sr-only">
					Ask the assistant
				</label>
				<textarea
					ref={textAreaRef}
					id={textAreaId}
					data-testid="agent-composer-input"
					placeholder={placeholder}
					disabled={!hasKey}
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
					className="h-28 w-full resize-none border-0 bg-transparent px-3 pr-14 pb-12 pt-3 text-sm leading-6 text-foreground outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
				/>
				{menuFragment ? (
					<div className="absolute left-0 right-0 bottom-full z-[2] mb-2">
						{menuFragment}
					</div>
				) : null}
				<button
					type="button"
					onClick={() => {
						void commit();
					}}
					disabled={sendDisabled}
					data-testid="agent-composer-send"
					className="absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-sm transition hover:bg-neutral-200/80 disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted/20 disabled:text-muted-foreground"
					aria-label={pending ? "Working..." : "Send message"}
				>
					{pending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<ArrowUp className="h-4 w-4" />
					)}
				</button>
			</div>
			<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
				<button
					type="button"
					onClick={() => {
						void onAutoAcceptToggle(!autoAcceptEnabled);
					}}
					disabled={!hasKey}
					className={[
						"inline-flex items-center gap-1 rounded-full border px-2 py-1 font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
						autoAcceptEnabled
							? "border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100"
							: "border-border/80 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
					].join(" ")}
					aria-pressed={autoAcceptEnabled}
					title={
						autoAcceptEnabled
							? "Auto-accept agent edits is enabled"
							: "Enable auto-accept agent edits"
					}
					aria-label={
						autoAcceptEnabled ? "Disable auto accept" : "Enable auto accept"
					}
				>
					<FastForward
						className={[
							"h-3.5 w-3.5",
							autoAcceptEnabled
								? "text-purple-500"
								: "text-muted-foreground/80",
						].join(" ")}
						aria-hidden="true"
					/>
					<span>Auto accept</span>
				</button>
				<ModelSelector
					options={models}
					value={modelId}
					onChange={onModelChange}
					disabled={pending}
				/>
			</div>
		</div>
	);
}

function ModelSelector({
	options,
	value,
	onChange,
	disabled,
}: {
	options: readonly ModelOption[];
	value: string;
	onChange(value: string): void;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState(false);
	const [menuRect, setMenuRect] = useState<{
		top: number;
		left: number;
		width: number;
		anchorBottom: number;
	} | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!open) return;
		const handlePointer = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (
				target &&
				(buttonRef.current?.contains(target) ||
					menuRef.current?.contains(target))
			) {
				return;
			}
			setOpen(false);
		};
		window.addEventListener("pointerdown", handlePointer);
		return () => {
			window.removeEventListener("pointerdown", handlePointer);
		};
	}, [open]);

	const updateMenuRect = useCallback(() => {
		if (!buttonRef.current) return;
		const rect = buttonRef.current.getBoundingClientRect();
		setMenuRect({
			top: rect.bottom + window.scrollY + 6,
			left: rect.left + window.scrollX,
			width: Math.max(rect.width, 200),
			anchorBottom: rect.bottom + window.scrollY,
		});
	}, []);

	useLayoutEffect(() => {
		if (!open) {
			setMenuRect(null);
			return;
		}
		updateMenuRect();
		window.addEventListener("resize", updateMenuRect);
		window.addEventListener("scroll", updateMenuRect, true);
		return () => {
			window.removeEventListener("resize", updateMenuRect);
			window.removeEventListener("scroll", updateMenuRect, true);
		};
	}, [open, updateMenuRect]);

	useLayoutEffect(() => {
		if (!open || !menuRect) return;
		const menuEl = menuRef.current;
		if (!menuEl) return;
		const height = menuEl.offsetHeight;
		const viewportBottom = window.scrollY + window.innerHeight;
		const preferredBottom = menuRect.top + height;
		if (preferredBottom <= viewportBottom - 12) {
			return;
		}
		const desiredTop = Math.max(
			window.scrollY + 12,
			menuRect.anchorBottom - height - 6,
		);
		if (Math.abs(desiredTop - menuRect.top) > 1) {
			setMenuRect((prev) => (prev ? { ...prev, top: desiredTop } : prev));
		}
	}, [open, menuRect]);

	const toggle = useCallback(() => {
		if (disabled) return;
		setOpen((prev) => !prev);
	}, [disabled]);

	const handleSelect = useCallback(
		(next: string) => {
			onChange(next);
			setOpen(false);
		},
		[onChange],
	);

	const activeOption = options.find((option) => option.id === value);

	return (
		<div className="relative inline-flex">
			<button
				ref={buttonRef}
				type="button"
				disabled={disabled}
				onClick={toggle}
				title={activeOption ? `Model: ${activeOption.label}` : "Select model"}
				className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label={
					activeOption
						? `Change model (current: ${activeOption.label})`
						: "Select model"
				}
			>
				<Brain
					className="h-3.5 w-3.5 text-muted-foreground/80"
					aria-hidden="true"
				/>
				<span className="max-w-[12rem] truncate">
					{activeOption ? activeOption.label : "Select model"}
				</span>
				<ChevronDown
					className="h-3 w-3 text-muted-foreground/70"
					aria-hidden="true"
				/>
			</button>
			{open && menuRect
				? createPortal(
						<div
							ref={menuRef}
							role="menu"
							className="fixed z-[999] overflow-hidden rounded-lg border border-border/70 bg-background shadow-xl"
							style={{
								top: menuRect.top,
								left: menuRect.left,
								width: menuRect.width,
							}}
						>
							<ul className="divide-y divide-border/70 text-xs text-foreground">
								{options.map((option) => {
									const isActive = option.id === value;
									return (
										<li key={option.id}>
											<button
												type="button"
												onClick={() => handleSelect(option.id)}
												className={[
													"flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition",
													isActive
														? "bg-muted/30 text-foreground"
														: "hover:bg-muted/40",
												].join(" ")}
												role="menuitemradio"
												aria-checked={isActive}
											>
												<span className="flex items-center gap-2">
													<Brain className="h-3.5 w-3.5 text-muted-foreground/80" />
													{option.label}
												</span>
												{isActive ? <Check className="h-3 w-3" /> : null}
											</button>
										</li>
									);
								})}
							</ul>
						</div>,
						document.body,
					)
				: null}
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
