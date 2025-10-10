import * as React from "react";
import type { KeyHint } from "./types";

/**
 * Inline, unobtrusive shortcuts list. Can be shown persistently or toggled.
 * Uses compact monospace to reinforce the terminal vibe.
 *
 * @example
 * <ChatShortcuts hints={[{ key: 'Enter', label: 'Send' }]} />
 */
export function ChatShortcuts({
	hints,
	className,
}: {
	hints: KeyHint[];
	className?: string;
}) {
	return (
		<div
			className={[
				"flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-2 py-1 font-mono text-xs text-muted-foreground",
				className ?? "",
			].join(" ")}
		>
			{hints.map((h, i) => (
				<div key={`${h.key}-${i}`} className="inline-flex items-center gap-1">
					<kbd className="rounded border bg-background px-1 py-[1px] text-xs font-medium leading-none">
						{h.key}
					</kbd>
					<span>{h.label}</span>
				</div>
			))}
		</div>
	);
}
