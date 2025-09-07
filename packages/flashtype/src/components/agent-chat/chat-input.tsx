import * as React from "react";

/**
 * Terminal-like input with a leading prompt symbol. Supports multiline (Shift+Enter)
 * and message history via ArrowUp/ArrowDown.
 *
 * @example
 * <ChatInput onSend={(v) => console.log(v)} />
 */
export function ChatInput({ onSend }: { onSend: (value: string) => void }) {
	const [value, setValue] = React.useState("");
	const [history, setHistory] = React.useState<string[]>([]);
	const [idx, setIdx] = React.useState<number>(-1); // -1 means live input
	const ref = React.useRef<HTMLTextAreaElement>(null);

	React.useEffect(() => {
		ref.current?.focus();
	}, []);

	const commit = React.useCallback(() => {
		const next = value.trimEnd();
		if (!next) return;
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

	return (
		<div className="border-t px-3 py-2">
			<div className="mx-auto flex max-w-[720px] items-start gap-2">
				<div className="select-none pt-2 font-mono text-xs text-muted-foreground">
					&gt;
				</div>
				<div className="flex-1">
					<textarea
						ref={ref}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={onKeyDown}
						placeholder="Type a command… Try /outline, /summarize, /rewrite. Enter to send."
						rows={1}
						className="min-h-[40px] w-full resize-none rounded-md border bg-background px-3 py-2 font-mono text-[13px] leading-snug shadow-[inset_0_1px_theme(colors.border)] focus-visible:outline-none focus-visible:ring-2"
					/>
					<div className="mt-1 select-none font-mono text-[11px] text-muted-foreground">
						Enter to send • Shift+Enter newline • ↑/↓ history • ⌘U clear
					</div>
				</div>
			</div>
		</div>
	);
}

function moveCaretToEnd(el: HTMLTextAreaElement | null) {
	if (!el) return;
	const len = el.value.length;
	el.setSelectionRange(len, len);
}
