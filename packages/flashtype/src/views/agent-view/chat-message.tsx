import * as React from "react";
import type { ChatMessage as Msg } from "./chat-types";
import { ToolRunList } from "./tool-run-list";
import { MessageBody } from "./markdown/message-body";

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
					<MessageBody content={message.content} />
				</div>
			)}
		</div>
	);
}
