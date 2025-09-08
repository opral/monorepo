import * as React from "react";
import type { SlashCommand } from "./commands";
import { DEFAULT_COMMANDS } from "./commands";

/**
 * Terminal-like input with a leading prompt symbol. Supports multiline (Shift+Enter)
 * and message history via ArrowUp/ArrowDown.
 *
 * @example
 * <ChatInput onSend={(v) => console.log(v)} />
 */
export function ChatInput({
	onSend,
	onCommand,
	commands = DEFAULT_COMMANDS,
}: {
	onSend: (value: string) => void;
	onCommand?: (command: string) => void;
	commands?: SlashCommand[];
}) {
	const [value, setValue] = React.useState("");
	const [history, setHistory] = React.useState<string[]>([]);
	const [idx, setIdx] = React.useState<number>(-1); // -1 means live input
	const ref = React.useRef<HTMLTextAreaElement>(null);
	const [openMenu, setOpenMenu] = React.useState(false);
	const [selected, setSelected] = React.useState(0);

	React.useEffect(() => {
		ref.current?.focus();
	}, []);

	const commit = React.useCallback(() => {
		const next = value.trimEnd();
		if (!next) return;
		if (next.startsWith("/")) {
			// Slash command flow
			const token = next.slice(1).trim().split(/\s+/)[0] ?? "";
			const found = commands.find(
				(c) =>
					c.name.startsWith(token) ||
					c.aliases?.some((a) => a.startsWith(token)),
			);
			const cmd = found?.name ?? token;
			onCommand?.(cmd);
			setOpenMenu(false);
			setSelected(0);
			setValue("");
			setIdx(-1);
			return;
		}
		onSend(next);
		setHistory((h) => [next, ...h].slice(0, 50));
		setIdx(-1);
		setValue("");
	}, [onSend, value]);

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			commit();
			return;
		}
		if (openMenu) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelected((s) => Math.min(s + 1, filtered.length - 1));
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelected((s) => Math.max(s - 1, 0));
				return;
			}
			if (e.key === "Tab") {
				e.preventDefault();
				// autocomplete selection
				const pick = filtered[selected];
				if (pick) setValue(`/${pick.name} `);
				return;
			}
			if (e.key === "Escape") {
				e.preventDefault();
				setOpenMenu(false);
				return;
			}
		}
		if (e.key === "ArrowUp" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
			e.preventDefault();
			setIdx((n) => {
				const next = Math.min(n + 1, history.length - 1);
				const val = history[next] ?? value;
				setValue(val);
				// move caret to end
				queueMicrotask(() => moveCaretToEnd(ref.current));
				return next;
			});
			return;
		}
		if (e.key === "ArrowDown" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
			e.preventDefault();
			setIdx((n) => {
				const next = Math.max(n - 1, -1);
				const val = next === -1 ? "" : (history[next] ?? "");
				setValue(val);
				queueMicrotask(() => moveCaretToEnd(ref.current));
				return next;
			});
			return;
		}
		// Quickly clear input
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
			e.preventDefault();
			setValue("");
			setIdx(-1);
		}
	};

	// Slash menu filtering
	const filtered = React.useMemo(() => {
		if (!value.startsWith("/")) return [] as SlashCommand[];
		const token = value.slice(1).toLowerCase();
		if (!token) return commands;
		return commands.filter(
			(c) =>
				c.name.toLowerCase().startsWith(token) ||
				c.aliases?.some((a) => a.toLowerCase().startsWith(token)),
		);
	}, [value, commands]);

	React.useEffect(() => {
		setOpenMenu(value.startsWith("/"));
		setSelected(0);
	}, [value]);

	return (
		<div className="px-1 py-2 shrink-0">
			<div className="mx-auto max-w-[720px]">
				<textarea
					ref={ref}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder={'Prompt or try a command with "/"'}
					rows={1}
					className="min-h-[36px] w-full resize-none rounded-md border bg-background px-3 py-2 font-mono text-xs leading-snug shadow-[inset_0_1px_theme(colors.border)] focus-visible:outline-none focus-visible:ring-2"
				/>
				{openMenu && (
					<div className="mt-1 mb-1 text-[11px] font-mono text-muted-foreground/70">
						Use ↑/↓ to navigate • Enter to execute
					</div>
				)}
				{openMenu && (
					<div className="mt-2 max-h-64 overflow-auto font-mono text-[12px] leading-[1.5]">
						{filtered.length === 0 ? (
							<div className="px-2 py-1 text-muted-foreground">No commands</div>
						) : (
							filtered.map((cmd, i) => {
								const isSel = i === selected;
								const sel = "text-[rgb(7,182,212)]";
								const rowColor = isSel ? sel : "text-foreground";
								const descColor = isSel ? sel : "text-foreground/90";
								return (
									<div
										key={cmd.name}
										className={[
											"grid grid-cols-[max-content_1fr] gap-x-3 items-start py-1",
											rowColor,
										].join(" ")}
									>
										<div
											className={[
												"font-mono",
												isSel ? "font-semibold" : "",
											].join(" ")}
										>
											/{cmd.name}
										</div>
										<div className={["pr-2", descColor].join(" ")}>
											{cmd.description}
										</div>
									</div>
								);
							})
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function moveCaretToEnd(el: HTMLTextAreaElement | null) {
	if (!el) return;
	const len = el.value.length;
	el.setSelectionRange(len, len);
}
