import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./types";

/**
 * Claude Code–like tool calling list adapted for light mode.
 * Renders a vertical list with status dots, title, and a small detail line.
 * Expandable output per tool.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	const [open, setOpen] = React.useState<Record<string, boolean>>({});
	const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));

	return (
		<div className="mb-2 flex flex-col gap-2">
			{runs.map((r) => (
				<div key={r.id} className="flex items-start gap-2">
					<StatusDot status={r.status} />
					<div className="flex-1 min-w-0">
						<div className="font-mono text-[12px]">
							<span className="font-semibold">{r.title}</span>
						</div>
						{r.detail ? (
							<div className="font-mono text-[11px] text-muted-foreground">
								{r.detail}{" "}
								{r.output ? (
									<button
										type="button"
										className="underline-offset-2 hover:underline"
										onClick={() => toggle(r.id)}
									>
										{open[r.id] ? "(collapse)" : "(expand)"}
									</button>
								) : null}
							</div>
						) : null}
						{r.output && open[r.id] ? (
							<pre className="mt-1 rounded border bg-muted/40 p-2 text-[11px] leading-snug whitespace-pre-wrap">
								{r.output}
							</pre>
						) : null}
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
				? "bg-amber-500 animate-pulse"
				: status === "error"
					? "bg-rose-500"
					: "bg-zinc-300";
	return <span className={`mt-1 inline-block size-2 rounded-full ${color}`} />;
}
