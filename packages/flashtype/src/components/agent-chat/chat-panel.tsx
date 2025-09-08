import * as React from "react";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useLix } from "@lix-js/react-utils";
import type { ChatMessage as UiMessage } from "./types";

/**
 * The main terminal-like chat surface for the Lix Agent (mock).
 * No backend calls; it simulates streaming to validate the UX quickly.
 *
 * @example
 * <ChatPanel />
 */
export function ChatPanel() {
	const lix = useLix();
	const system =
		"You are a helpful coding assistant for Flashtype. Keep answers concise and practical. Avoid unnecessary markdown formatting.";
	const { messages: agentMsgs, send, clear } = useAgentChat({ lix, system });

	const messages = React.useMemo<UiMessage[]>(() => {
		return agentMsgs.map((m) => ({
			id: m.id,
			role: m.role,
			content: m.content,
			at: undefined,
		}));
	}, [agentMsgs]);

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
		<div
			ref={panelRef}
			className="relative flex h-full max-h-full w-full min-h-0 flex-col overflow-hidden text-xs"
		>
			<ChatMessageList messages={messages} />
			<ChatInput
				onSend={send}
				onCommand={async (cmd) => {
					if (cmd === "clear" || cmd === "reset" || cmd === "new") {
						await clear();
						return;
					}
				}}
				onQueryMentions={async (q) => {
					if (!q) return [];
					const rows = await lix.db
						.selectFrom("file")
						.where("path", "like", `%${q}%`)
						.select(["path"])
						.limit(50)
						.execute();
					return rows.map((r) => String((r as any).path));
				}}
			/>
		</div>
	);
}
