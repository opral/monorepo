import * as React from "react";
import type {
	AgentConversationMessage,
	AgentConversationMessageMetadata,
	AgentStep,
	AgentThinkingStep,
	AgentToolStep,
} from "@lix-js/agent-sdk";
import { toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import type { ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";
import { ChevronRight } from "lucide-react";
import { MessageBody } from "./markdown/message-body";

type ConversationMessageProps = {
	message: AgentConversationMessage;
};

/**
 * Presentational component that renders a single conversation message by delegating
 * to either the agent or user specific renderer depending on the stored message role.
 *
 * @example
 * <ConversationMessage message={message} />
 */
export function ConversationMessage({ message }: ConversationMessageProps) {
	const metadata = message.lixcol_metadata as
		| AgentConversationMessageMetadata
		| null
		| undefined;
	const role = metadata?.lix_agent_sdk_role as "user" | "assistant" | undefined;

	const steps = React.useMemo(() => {
		return Array.isArray(metadata?.lix_agent_sdk_steps)
			? (metadata?.lix_agent_sdk_steps as AgentStep[])
			: [];
	}, [metadata?.lix_agent_sdk_steps]);

	const content = React.useMemo(() => {
		if (!message.body) return "";
		return toPlainText(message.body as ZettelDoc);
	}, [message.body]);

	if (role === "assistant") {
		return <AgentMessage steps={steps} content={content} />;
	}

	return <UserMessage content={content} />;
}

type AgentMessageProps = {
	steps: AgentStep[];
	content: string;
};

/**
 * Renders the assistant-facing message with optional tool call steps
 * displayed above the message body when provided by the metadata.
 *
 * @example
 * <AgentMessage steps={steps} content="Tool call output" />
 */
function AgentMessage({ steps, content }: AgentMessageProps) {
	return (
		<div className="w-full px-3.5">
			{steps.length > 0 && <StepList steps={steps} />}
			{content ? (
				<div className="max-w-full break-words leading-relaxed text-foreground">
					<MessageBody content={content} />
				</div>
			) : null}
		</div>
	);
}

type UserMessageProps = {
	content: string;
};

/**
 * Renders the user-authored message in a bordered bubble to highlight the
 * prompt content supplied to the agent.
 *
 * @example
 * <UserMessage content="Summarize the plan." />
 */
function UserMessage({ content }: UserMessageProps) {
	if (!content) return null;
	return (
		<div className="w-full px-2">
			<div className="max-w-full break-words rounded-lg border border-border/60 bg-secondary/40 px-2 py-1.5 leading-relaxed">
				<MessageBody content={content} />
			</div>
		</div>
	);
}

function StepList({ steps }: { steps: AgentStep[] }) {
	return (
		<div className="flex flex-col">
			{steps.map((step, index) => (
				<StepRow
					key={step.id}
					step={step}
					connectAbove={index > 0}
					connectBelow={index < steps.length - 1}
				/>
			))}
		</div>
	);
}

function StepRow({
	step,
	connectAbove,
	connectBelow,
}: {
	step: AgentStep;
	connectAbove: boolean;
	connectBelow: boolean;
}) {
	const [isExpanded, setExpanded] = React.useState(false);
	const isThinking = step.kind === "thinking";
	const thinkingText = isThinking
		? (step as AgentThinkingStep).text
		: undefined;
	const thinkingHeader = isThinking
		? extractFirstBold(thinkingText)
		: undefined;
	const hasStructuredIO =
		step.kind === "tool_call" &&
		(Boolean(step.tool_input) || Boolean(step.tool_output));
	const detail = step.kind === "tool_call" ? step.label : undefined;
	const title =
		step.kind === "tool_call"
			? (step.tool_name ?? detail ?? "Tool")
			: "Thinking";
	const status = isThinking ? "thinking" : step.status;
	const plainContent = isThinking
		? (thinkingHeader ?? summarizeThinking(thinkingText))
		: status === "failed"
			? formatToolError(step.error_text)
			: undefined;

	const inputText =
		step.kind === "tool_call" ? stringifyPayload(step.tool_input) : undefined;
	const outputText =
		step.kind === "tool_call"
			? stringifyPayload(
					step.status === "failed"
						? (step.error_text ?? step.tool_output)
						: step.tool_output,
				)
			: undefined;

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
					<StatusDot status={status} />
				</div>
			</div>

			{isThinking ? (
				<div
					className="flex-1 text-sm leading-relaxed text-muted-foreground"
					title={
						thinkingText && plainContent && thinkingText !== plainContent
							? thinkingText
							: undefined
					}
				>
					{thinkingHeader ? (
						<span className="text-foreground">{thinkingHeader}</span>
					) : (
						(plainContent ?? "Thinking…")
					)}
				</div>
			) : (
				<div className="flex-1 pb-2">
					<button
						type="button"
						onClick={() => hasStructuredIO && setExpanded(!isExpanded)}
						disabled={!hasStructuredIO}
						className="flex w-full items-start justify-between rounded-md pr-1 text-left transition hover:bg-muted/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-default disabled:hover:bg-transparent"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								{title ? (
									<span className="text-sm text-foreground">{title}</span>
								) : null}
								{hasStructuredIO ? (
									<ChevronRight
										className={`h-3 w-3 text-muted-foreground transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								) : null}
							</div>
							{detail && !hasStructuredIO ? (
								<div className="text-xs text-muted-foreground">{detail}</div>
							) : null}
						</div>
					</button>

					{hasStructuredIO && isExpanded ? (
						<ToolCard
							className="mt-4 mb-2"
							name={detail ?? title ?? "tool"}
							input={inputText}
							output={outputText}
						/>
					) : null}
					{!isExpanded && !hasStructuredIO && plainContent ? (
						<div className="ml-5 text-xs text-muted-foreground">
							{plainContent}
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}

type StepStatus = AgentToolStep["status"] | "thinking";

function StatusDot({ status }: { status: StepStatus }) {
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

function getStatusColors(status: StepStatus) {
	switch (status) {
		case "succeeded":
			return { fill: "bg-emerald-500", ring: "border-emerald-200" };
		case "failed":
			return { fill: "bg-rose-500", ring: "border-rose-200" };
		case "thinking":
			return { fill: "bg-zinc-400/80", ring: "border-zinc-300/70" };
		default:
			return { fill: "bg-zinc-400 animate-pulse", ring: "border-zinc-300" };
	}
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
	const classes = [
		"overflow-hidden rounded-lg border border-border/60 bg-muted/10 text-xs",
		className,
	]
		.filter(Boolean)
		.join(" ");
	return (
		<div className={classes}>
			<div className="border-b border-border/60 bg-muted/20 px-4 py-2">
				<span className="text-sm font-medium text-foreground">{name}</span>
			</div>
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

function stringifyPayload(payload: unknown): string | undefined {
	if (payload === null || payload === undefined) return undefined;
	if (typeof payload === "string") return payload;
	try {
		return JSON.stringify(payload, null, 2);
	} catch {
		return String(payload);
	}
}

function formatToolError(value: unknown): string | undefined {
	if (value === null || value === undefined) return undefined;
	if (value instanceof Error) return value.message;
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

/**
 * Converts verbose model thinking text into a concise single-line summary.
 *
 * @example
 * summarizeThinking("Line one\nMore detail") // "Line one"
 */
function summarizeThinking(input: string | undefined): string | undefined {
	if (!input) return undefined;
	const firstLine =
		input
			.split(/\r?\n/)
			.map((segment) => segment.trim())
			.find(Boolean) ?? "";
	if (!firstLine) return undefined;
	return firstLine.length > 140 ? `${firstLine.slice(0, 137)}...` : firstLine;
}

/**
 * Extracts the first Markdown bold segment (`**text**`) from the provided input.
 *
 * @example
 * extractFirstBold("Intro **Header** details") // "Header"
 */
function extractFirstBold(input: string | undefined): string | undefined {
	if (!input) return undefined;
	const start = input.indexOf("**");
	if (start === -1) return undefined;
	const rest = input.slice(start + 2);
	const end = rest.indexOf("**");
	if (end === -1) return undefined;
	const candidate = rest.slice(0, end).trim();
	return candidate.length > 0 ? candidate : undefined;
}

export default ConversationMessage;
