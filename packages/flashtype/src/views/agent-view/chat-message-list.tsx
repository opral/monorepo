import * as React from "react";
import type { ChatMessage as Msg } from "./chat-types";
import { ChatMessage } from "./chat-message";

/**
 * Virtual-less, simple scroll container for a mock chat transcript.
 * Auto-scrolls to newest messages.
 *
 * @example
 * <ChatMessageList messages={messages} />
 */
export function ChatMessageList({
	messages,
	onAcceptDecision,
	onRejectDecision,
}: {
	messages: Msg[];
	onAcceptDecision?: (id: string) => void;
	onRejectDecision?: (id: string) => void;
}) {
	const ref = React.useRef<HTMLDivElement>(null);
	const [hideScrollbar, setHideScrollbar] = React.useState(false);

	// Always keep the view anchored to the bottom whenever messages update
	// (new message or streaming content updates).
	React.useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const atBottomBeforeUpdate =
			el.scrollTop >= el.scrollHeight - el.clientHeight - 10;

		if (atBottomBeforeUpdate) {
			setHideScrollbar(true);
			el.scrollTop = el.scrollHeight;
			const t = window.setTimeout(() => setHideScrollbar(false), 150);
			return () => window.clearTimeout(t);
		}

		const previousScrollTop = el.scrollTop;
		const previousScrollHeight = el.scrollHeight;
		requestAnimationFrame(() => {
			const delta = el.scrollHeight - previousScrollHeight;
			if (delta !== 0) {
				el.scrollTop = previousScrollTop + delta;
			}
		});
	}, [messages]);

	return (
		<div
			ref={ref}
			data-testid="chat-scroller"
			className={`flex-1 min-h-0 overflow-y-auto py-1 ${hideScrollbar ? "scrollbar-hidden" : ""}`}
		>
			<div className="w-full flex min-h-full max-w-none flex-col">
				{/* Bottom‑anchored transcript */}
				<div className="mt-auto flex flex-col justify-end">
					{messages.map((m) => (
						<ChatMessage
							key={m.id}
							message={m}
							onAcceptDecision={onAcceptDecision}
							onRejectDecision={onRejectDecision}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
