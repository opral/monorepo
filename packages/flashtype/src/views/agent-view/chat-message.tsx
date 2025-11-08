import * as React from "react";
import type { ChatMessage as Msg } from "./chat-types";
import { ToolRunList } from "./tool-run-list";

/**
 * Chat message component with clean typography and spacing.
 * User messages are shown in a subtle card, assistant messages are plain text.
 *
 * @example
 * <ChatMessage message={{ id: '1', role: 'user', content: 'hello' }} />
 */
export function ChatMessage({
	message,
	onAcceptDecision,
	onRejectDecision,
}: {
	message: Msg;
	onAcceptDecision?: (id: string) => void;
	onRejectDecision?: (id: string) => void;
}) {
	const isUser = message.role === "user";
	const isSystem = message.role === "system";
	const decision = message.decision;

	if (decision) {
		const acceptLabel = decision.acceptLabel ?? "Yes";
		const rejectLabel = decision.rejectLabel ?? "No";

		return (
			<div className="w-full py-2">
				<div className="max-w-sm rounded-lg border border-border/60 bg-secondary/40 px-4 py-3 shadow-sm">
					<p className="text-sm font-medium text-foreground">
						{decision.prompt}
					</p>
					<div className="mt-3 flex flex-col gap-2">
						<button
							type="button"
							onClick={() => onAcceptDecision?.(message.id)}
							className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-left text-sm font-medium transition hover:bg-muted"
						>
							1. {acceptLabel}
						</button>
						<button
							type="button"
							onClick={() => onRejectDecision?.(message.id)}
							className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-left text-sm font-medium transition hover:bg-muted"
						>
							2. {rejectLabel}
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (isSystem) {
		return (
			<div className="px-3 py-1">
				<div className="text-xs text-muted-foreground">{message.content}</div>
			</div>
		);
	}

	return (
		<div className="w-full pt-1 pb-2">
			{message.toolRuns && message.toolRuns.length > 0 && (
				<ToolRunList runs={message.toolRuns} />
			)}
			{message.content && (
				<div
					className={[
						"max-w-full leading-relaxed break-words",
						isUser
							? "rounded-lg border border-border/60 bg-secondary/40 px-4 py-3"
							: "text-foreground",
					].join(" ")}
				>
					<MessageBody content={message.content} isUser={isUser} />
				</div>
			)}
		</div>
	);
}

/**
 * Renders message content with lightweight code block styling.
 * Plain text uses sans-serif, code blocks use monospace.
 */
function MessageBody({
	content,
	isUser: _isUser,
}: {
	content: string;
	isUser: boolean;
}) {
	const parts = React.useMemo(() => splitFences(content), [content]);
	return (
		<div className="space-y-3">
			{parts.map((p, i) =>
				p.type === "fence" ? (
					<div
						key={i}
						className="rounded-md border border-border/50 bg-muted/30 overflow-hidden"
					>
						<div className="border-b border-border/40 bg-muted/50 px-3 py-1.5">
							<span className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground">
								{p.lang || "code"}
							</span>
						</div>
						<pre className="px-3 py-2.5 text-sm font-mono leading-relaxed text-foreground overflow-x-auto">
							{p.body}
						</pre>
					</div>
				) : (
					<div key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
						{p.body}
					</div>
				),
			)}
		</div>
	);
}

type Part = { type: "text" | "fence"; body: string; lang?: string };

function splitFences(input: string): Part[] {
	const out: Part[] = [];
	const fence = /```(\w+)?\n([\s\S]*?)\n```/g;
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = fence.exec(input))) {
		const [full, lang, body] = m;
		if (m.index > last)
			out.push({ type: "text", body: input.slice(last, m.index) });
		out.push({ type: "fence", lang, body });
		last = m.index + full.length;
	}
	if (last < input.length) out.push({ type: "text", body: input.slice(last) });
	return out;
}
