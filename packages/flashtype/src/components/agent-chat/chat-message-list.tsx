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
		<div ref={ref} className="flex-1 overflow-auto px-3 py-3">
			<div className="mx-auto max-w-[720px]">
				{messages.map((m) => (
					<ChatMessage key={m.id} message={m} />
				))}
			</div>
		</div>
	);
}
