import * as React from "react";
import type { ToolRun, ToolRunStatus } from "./chat-types";
import { ChevronRight } from "lucide-react";

/**
 * Tool call timeline with subtle connectors and compact status dots.
 */
export function ToolRunList({ runs }: { runs: ToolRun[] }) {
	return (
		<div className="flex flex-col">
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
	const hasStructuredIO = Boolean(run.input || run.output);
	const isThinking = run.status === "thinking";
	const showPlainContent = Boolean(run.content) && !hasStructuredIO;

	return (
		<div className="group flex min-w-0 gap-3 py-0">
			<div className="relative flex w-4 justify-center">
				{connectAbove ? (
					<span className="absolute left-1/2 top-0 bottom-1/2 w-px -translate-x-1/2 bg-border/60" />
				) : null}
				{connectBelow ? (
					<span className="absolute left-1/2 top-1/2 bottom-0 w-px -translate-x-1/2 bg-border/60" />
				) : (
					<span
						className="absolute left-1/2 bottom-0 w-px translate-y-full -translate-x-1/2 bg-border/40"
						style={{ height: "25%" }}
					/>
				)}
				<div className="mt-1">
					<StatusDot status={run.status} />
				</div>
			</div>

			{(isThinking || showPlainContent) && run.content ? (
				<div className="flex-1 text-sm leading-relaxed text-foreground">
					{run.content}
				</div>
			) : (
				<div className="flex-1 pb-2">
					<button
						type="button"
						onClick={() => hasStructuredIO && setIsExpanded(!isExpanded)}
						disabled={!hasStructuredIO}
						className="flex w-full items-start justify-between rounded-md pr-1 text-left transition hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-default disabled:hover:bg-transparent"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								{run.title ? (
									<span className="text-sm font-medium text-foreground">
										{run.title}
									</span>
								) : null}
								{hasStructuredIO ? (
									<ChevronRight
										className={`h-3 w-3 text-muted-foreground transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								) : null}
							</div>
							{run.detail && !hasStructuredIO ? (
								<div className="text-xs text-muted-foreground">
									{run.detail}
								</div>
							) : null}
						</div>
					</button>

					{hasStructuredIO && isExpanded ? (
						<ToolCard
							className="mt-4 mb-2"
							name={run.detail ?? run.title ?? "tool"}
							input={run.input}
							output={run.output}
						/>
					) : null}
					{!isExpanded && !hasStructuredIO && run.detail ? (
						<div className="ml-5 text-xs text-muted-foreground">
							{run.detail}
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}

type ToolCardProps = {
	name: string;
	input?: string;
	output?: string;
	className?: string;
};

function beautifyJSON(str: string) {
	try {
		const parsed = JSON.parse(str);
		return JSON.stringify(parsed, null, 2);
	} catch {
		return str;
	}
}

function ToolCard({ name, input, output, className }: ToolCardProps) {
	const containerClass = [
		"overflow-hidden rounded-lg border border-border/60 bg-muted/10 text-xs",
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={containerClass}>
			{/* Tool Name Header */}
			<div className="border-b border-border/60 bg-muted/20 px-4 py-2">
				<span className="text-sm font-medium text-foreground">{name}</span>
			</div>

			{/* Input Section */}
			{input ? (
				<div className="border-b border-border/60">
					<div className="bg-muted/10 px-4 py-1.5">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Input
						</span>
					</div>
					<pre className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground">
						{beautifyJSON(input)}
					</pre>
				</div>
			) : null}

			{/* Output Section */}
			{output ? (
				<div>
					<div className="bg-muted/10 px-4 py-1.5">
						<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Output
						</span>
					</div>
					<pre className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
						{beautifyJSON(output)}
					</pre>
				</div>
			) : null}
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
			return { fill: "bg-zinc-400/80", ring: "border-zinc-300/70" };
		default:
			return { fill: "bg-zinc-300", ring: "border-zinc-200" };
	}
}
