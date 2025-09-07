import * as React from "react";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { useChatMock } from "./use-chat-mock";

/**
 * The main terminal-like chat surface for the Lix Agent (mock).
 * No backend calls; it simulates streaming to validate the UX quickly.
 *
 * @example
 * <ChatPanel />
 */
export function ChatPanel() {
	const { messages, isStreaming, send } = useChatMock();

	// Focus management: pressing "/" anywhere inside the panel focuses the input.
	const panelRef = React.useRef<HTMLDivElement>(null);
	const inputRef = React.useRef<{ focus: () => void } | null>(null);

	React.useEffect(() => {
		const el = panelRef.current;
		if (!el) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				const target = e.target as HTMLElement | undefined;
				const isTyping =
					target &&
					(target.tagName === "TEXTAREA" || target.tagName === "INPUT");
				if (!isTyping) {
					e.preventDefault();
					// Focus the textarea in ChatInput
					const tArea = el.querySelector(
						"textarea",
					) as HTMLTextAreaElement | null;
					tArea?.focus();
				}
			}
		};
		el.addEventListener("keydown", onKey);
		return () => el.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div ref={panelRef} className="flex h-full min-h-0 flex-col text-xs">
			<ChatMessageList messages={messages} />
			{isStreaming ? (
				<div className="px-3 pb-1 text-center text-[11px] text-muted-foreground">
					Streaming…
				</div>
			) : null}
			<ChatInput onSend={send} />
		</div>
	);
}
