import * as React from "react";
import type { ChatMessage as Msg } from "./types";
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

	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages.length]);

	return (
		<div ref={ref} className="min-h-0 overflow-y-auto px-3 py-3">
			<div className="w-full flex min-h-full max-w-none flex-col justify-end">
				{messages.map((m) => (
					<ChatMessage key={m.id} message={m} />
				))}
			</div>
		</div>
	);
}
