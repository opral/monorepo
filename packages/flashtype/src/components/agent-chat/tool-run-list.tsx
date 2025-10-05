import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./types";
import { ChevronRight } from "lucide-react";

/**
 * Claude Code–inspired tool calling list with collapsible IN/OUT sections.
 * Matches the design aesthetic with green dots, monospace text, and smooth animations.
 * Tool items are visually connected with a vertical line to show they're part of a reasoning series.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	return (
		<div className="mb-2 relative">
			{runs.map((r, index) => (
				<ToolRunItem
					key={r.id}
					run={r}
					isFirst={index === 0}
					isLast={index === runs.length - 1}
				/>
			))}
		</div>
	);
}

function ToolRunItem({
	run,
	isFirst,
	isLast,
}: {
	run: ToolRun;
	isFirst: boolean;
	isLast: boolean;
}) {
	const [isExpanded, setIsExpanded] = React.useState(false);
	const hasContent = run.input || run.output;
	const isThinking = run.status === "thinking";

	return (
		<div className="group relative">
			{/* Connecting line between tools */}
			{!isLast && (
				<div className="absolute left-1 top-[13px] bottom-[-2px] w-[1px] bg-border/60" />
			)}

			{/* For thinking/reasoning steps, show content inline without collapsing */}
			{isThinking && run.content ? (
				<div className="relative flex w-full items-start gap-2 px-1 py-0.5">
					<StatusDot status={run.status} />
					<div className="flex-1 min-w-0 text-sm leading-relaxed text-foreground">
						{run.content}
					</div>
				</div>
			) : (
				<>
					{/* Tool header */}
					<button
						type="button"
						onClick={() => hasContent && setIsExpanded(!isExpanded)}
						disabled={!hasContent}
						className="relative flex w-full items-start gap-2 px-1 py-0.5 text-left transition-colors hover:bg-muted/30 disabled:cursor-default disabled:hover:bg-transparent"
					>
						<StatusDot status={run.status} />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-sm text-foreground">
									{run.title}
								</span>
								{hasContent && (
									<ChevronRight
										className={`h-3 w-3 text-muted-foreground transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								)}
							</div>
							{run.detail && (
								<div className="text-xs text-muted-foreground">{run.detail}</div>
							)}
						</div>
					</button>

					{/* Collapsible content */}
					{hasContent && isExpanded && (
						<div className="ml-5 mt-1 mb-2 space-y-2 overflow-hidden rounded-md border border-border/60 bg-muted/20 text-xs animate-in slide-in-from-top-1 duration-200">
							{run.input && (
								<div>
									<div className="border-b border-border/40 bg-muted/40 px-3 py-1">
										<span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
											IN
										</span>
									</div>
									<pre className="px-3 py-2 font-mono text-xs leading-relaxed text-foreground overflow-x-auto">
										{run.input}
									</pre>
								</div>
							)}
							{run.output && (
								<div>
									<div className="border-b border-border/40 bg-muted/40 px-3 py-1">
										<span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
											OUT
										</span>
									</div>
									<pre className="px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground overflow-x-auto">
										{run.output}
									</pre>
								</div>
							)}
						</div>
					)}
				</>
			)}
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
					: status === "thinking"
						? "bg-zinc-400"
						: "bg-zinc-300";
	return (
		<span
			className={`inline-block mt-1 h-2 w-2 rounded-full ${color} shrink-0`}
		/>
	);
}
