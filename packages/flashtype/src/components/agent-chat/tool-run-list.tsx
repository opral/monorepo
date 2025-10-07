import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./types";
import { ChevronRight } from "lucide-react";

/**
 * Tool call timeline with subtle connectors and compact status dots.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	return (
		<div className="space-y-1.5">
			{runs.map((run, index) => (
				<ToolRunRow
					key={run.id}
					run={run}
					connectAbove={index > 0}
					connectBelow={index < runs.length - 1}
				/>
			))}
		</div>
	);
}

function ToolRunRow({
	run,
	connectAbove,
	connectBelow,
}: {
	run: ToolRun;
	connectAbove: boolean;
	connectBelow: boolean;
}) {
	const [isExpanded, setIsExpanded] = React.useState(false);
	const hasContent = Boolean(run.input || run.output);
	const isThinking = run.status === "thinking";

	return (
		<div className="group flex min-w-0 gap-3">
			<div className="relative flex w-4 justify-center">
				{connectAbove ? (
					<span className="absolute left-1/2 top-0 bottom-1/2 w-px -translate-x-1/2 bg-border/60" />
				) : null}
				{connectBelow ? (
					<span className="absolute left-1/2 top-1/2 bottom-0 w-px -translate-x-1/2 bg-border/60" />
				) : null}
				<div className="mt-1">
					<StatusDot status={run.status} />
				</div>
			</div>

			{isThinking && run.content ? (
				<div className="flex-1 text-sm leading-relaxed text-foreground">
					{run.content}
				</div>
			) : (
				<div className="flex-1">
					<button
						type="button"
						onClick={() => hasContent && setIsExpanded(!isExpanded)}
						disabled={!hasContent}
						className="flex w-full items-start justify-between rounded-md py-1 pr-1 text-left transition hover:bg-muted/20 disabled:cursor-default disabled:hover:bg-transparent"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-foreground">
									{run.title}
								</span>
								{hasContent ? (
									<ChevronRight
										className={`h-3 w-3 text-muted-foreground transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								) : null}
							</div>
							{run.detail ? (
								<div className="text-xs text-muted-foreground">
									{run.detail}
								</div>
							) : null}
						</div>
					</button>

					{hasContent && isExpanded ? (
						<div className="ml-5 mt-1 space-y-2 overflow-hidden rounded-lg border border-border/60 bg-muted/10 text-xs">
							{run.input ? (
								<div>
									<div className="border-b border-border/40 bg-muted/20 px-3 py-1 font-medium text-muted-foreground">
										IN
									</div>
									<pre className="overflow-x-auto px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
										{run.input}
									</pre>
								</div>
							) : null}
							{run.output ? (
								<div>
									<div className="border-b border-border/40 bg-muted/20 px-3 py-1 font-medium text-muted-foreground">
										OUT
									</div>
									<pre className="overflow-x-auto px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground">
										{run.output}
									</pre>
								</div>
							) : null}
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}

function StatusDot({ status }: { status: ToolRunStatus }) {
	const { fill, ring } = getStatusColors(status);
	return (
		<span className="relative flex h-3.5 w-3.5 items-center justify-center">
			<span
				className={`absolute h-3 w-3 rounded-full border ${ring} bg-background`}
			/>
			<span className={`relative h-2 w-2 rounded-full ${fill}`} />
		</span>
	);
}

function getStatusColors(status: ToolRunStatus) {
	switch (status) {
		case "success":
			return { fill: "bg-emerald-500", ring: "border-emerald-200" };
		case "error":
			return { fill: "bg-rose-500", ring: "border-rose-200" };
		case "running":
			return { fill: "bg-zinc-400 animate-pulse", ring: "border-zinc-300" };
		case "thinking":
			return { fill: "bg-zinc-400", ring: "border-zinc-300" };
		default:
			return { fill: "bg-zinc-300", ring: "border-zinc-200" };
	}
}
