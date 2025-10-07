import { useCallback, useMemo, useRef, useState } from "react";
import type { SlashCommand } from "./commands";
import { buildMentionList, calculateMentionRange } from "./mention-utils";

const MAX_HISTORY = 20;

export interface ComposerStateOptions {
	readonly commands: readonly SlashCommand[];
	readonly files: readonly string[];
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
	const mentionCtx = useRef<{ start: number; end: number; query: string } | null>(
		null,
	);

	const filteredCommands = useMemo(() => {
		if (!value.startsWith("/")) return commands;
		const token = value.slice(1).trim().toLowerCase();
		if (!token) return commands;
		return commands.filter(
			(cmd) =>
				cmd.name.toLowerCase().startsWith(token) ||
				cmd.description.toLowerCase().includes(token),
		);
	}, [commands, value]);

	const updateMentions = useCallback(
		(textarea: HTMLTextAreaElement | null) => {
			const caret = textarea ? textarea.selectionStart ?? value.length : value.length;
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
		updateMentions,
		pushHistory,
	};
}
