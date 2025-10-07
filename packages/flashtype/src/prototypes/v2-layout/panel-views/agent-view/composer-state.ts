import { useCallback, useMemo, useRef, useState } from "react";
import type { SlashCommand } from "./commands";
import { buildMentionList, calculateMentionRange } from "./mention-utils";

const MAX_HISTORY = 20;

export interface ComposerStateOptions {
	readonly commands: readonly SlashCommand[];
	readonly files: readonly string[];
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
export function extractSlashToken(input: string): string | null {
	if (!input.includes("/")) return null;
	const trimmedLeft = input.trimStart();
	if (!trimmedLeft.startsWith("/")) return null;
	const afterSlash = trimmedLeft.slice(1);
	if (afterSlash.length === 0) return "";
	if (/\s/.test(afterSlash)) return null;
	if (afterSlash.includes("/") || afterSlash.includes(".")) return null;
	return afterSlash;
}

/**
 * React hook that powers the Claude-like composer, handling history, slash commands,
 * and mention list state in a testable way.
 */
export function useComposerState({ commands, files }: ComposerStateOptions) {
	const [value, setValue] = useState("");
	const [history, setHistory] = useState<string[]>([]);
	const [historyIdx, setHistoryIdx] = useState(-1);
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

	return {
		value,
		setValue,
		history,
		setHistory,
		historyIdx,
		setHistoryIdx,
		slashOpen,
		setSlashOpen,
		slashIdx,
		setSlashIdx,
		mentionOpen,
		mentionIdx,
		setMentionIdx,
		mentionItems,
		setMentionItems,
		setMentionOpen,
		mentionCtx,
		filteredCommands,
		slashToken,
		updateMentions,
		pushHistory,
	};
}
