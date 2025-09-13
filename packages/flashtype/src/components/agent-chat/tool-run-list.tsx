import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./types";

/**
 * Claude Code–like tool calling list adapted for light mode.
 * Renders a vertical list with status dots, title, and a small detail line.
 * Expandable output per tool.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	return (
		<div className="mb-2 flex flex-col gap-1">
			{runs.map((r) => (
				<div key={r.id} className="flex items-center gap-2 leading-none">
					<StatusDot status={r.status} />
					<div className="font-mono text-[12px] font-semibold truncate">
						{r.title}
					</div>
				</div>
			))}
		</div>
	);
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
			className={`inline-block h-2.5 w-2.5 rounded-full ${color} shrink-0 align-middle`}
		/>
	);
}
