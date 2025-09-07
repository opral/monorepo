import * as React from "react";
import type { ChatMessage as Msg } from "./types";

/**
 * Renders a single chat message in a terminal‑like block. User messages have a
 * right-aligned prompt vibe; assistant messages are left-aligned.
 *
 * @example
 * <ChatMessage message={{ id: '1', role: 'user', content: 'hello' }} />
 */
export function ChatMessage({ message }: { message: Msg }) {
	const isUser = message.role === "user";
	const isAssistant = message.role === "assistant";
	const isSystem = message.role === "system";

	const chrome = isSystem
		? "text-xs text-muted-foreground"
		: isUser
			? "bg-secondary/60 border border-border text-foreground"
			: "bg-background border border-border";

	return (
		<div className="w-full py-1">
			<div
				className={[
					"max-w-none rounded-md px-3 py-2 font-mono leading-relaxed whitespace-pre-wrap",
					chrome,
					isUser ? "ml-auto" : "mr-auto",
				].join(" ")}
			>
				{isSystem ? (
					<span>{message.content}</span>
				) : (
					<MessageBody content={message.content} />
				)}
			</div>
		</div>
	);
}

/**
 * Very light inline renderer that treats triple‑backtick blocks as styled panels.
 * Keeps everything monospace to preserve a terminal feel.
 */
function MessageBody({ content }: { content: string }) {
	const parts = React.useMemo(() => splitFences(content), [content]);
	return (
		<div className="space-y-2">
			{parts.map((p, i) =>
				p.type === "fence" ? (
					<div
						key={i}
						className="rounded-sm border border-border/60 bg-muted/40 px-3 py-2"
					>
						<div className="text-[10px] uppercase tracking-wide text-muted-foreground">
							{p.lang || "block"}
						</div>
						<pre className="mt-1 text-[12px] leading-snug whitespace-pre-wrap">
							{p.body}
						</pre>
					</div>
				) : (
					<span key={i}>{p.body}</span>
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
