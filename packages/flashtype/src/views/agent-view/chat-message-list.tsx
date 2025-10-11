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
export function ChatMessageList({ messages }: { messages: Msg[] }) {
	const ref = React.useRef<HTMLDivElement>(null);
	const [hideScrollbar, setHideScrollbar] = React.useState(false);

	// Always keep the view anchored to the bottom whenever messages update
	// (new message or streaming content updates).
	React.useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		setHideScrollbar(true);
		el.scrollTop = el.scrollHeight;
		const t = window.setTimeout(() => setHideScrollbar(false), 150);
		return () => window.clearTimeout(t);
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
						<ChatMessage key={m.id} message={m} />
					))}
				</div>
			</div>
		</div>
	);
}
