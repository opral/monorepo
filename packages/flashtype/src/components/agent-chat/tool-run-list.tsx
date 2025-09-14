import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./types";

/**
 * Claude Code–like tool calling list adapted for light mode.
 * Renders a vertical list with status dots, title, and a small detail line.
 * Expandable output per tool.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	return (
		<div className="mb-1 px-3">
			<div className="flex flex-col gap-0.5">
				{runs.map((r) => (
					<div
						key={r.id}
						className="grid grid-cols-[12px_1fr] items-center leading-tight"
					>
						<StatusDot status={r.status} />
						<div className={titleClass(r.status)}>{r.title}</div>
					</div>
				))}
			</div>
		</div>
	);
}

function titleClass(_status: ToolRunStatus): string {
	// Keep tool call text neutral; status is conveyed by the dot
	return "font-mono text-[12px] text-foreground";
}

function StatusDot({ status }: { status: ToolRunStatus }) {
	const color =
		status === "success"
			? "bg-emerald-500"
			: status === "running"
				? "bg-zinc-400 animate-pulse"
				: status === "error"
					? "bg-rose-500"
					: "bg-zinc-300";
	return (
		<span
			className={`inline-block h-1.5 w-1.5 rounded-full ${color} shrink-0`}
		/>
	);
}
