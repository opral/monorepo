import * as React from "react";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useLix } from "@lix-js/react-utils";
import type { ChatMessage as UiMessage } from "./types";
import { LoadingBar } from "./loading-bar";
import { AcceptChangesMenu } from "./accept-changes-menu";

/**
 * The main terminal-like chat surface for the Lix Agent (mock).
 * No backend calls; it simulates streaming to validate the UX quickly.
 *
 * @example
 * <ChatPanel />
 */
export function ChatPanel() {
	const lix = useLix();
	const {
		messages: agentMsgs,
		send,
		clear,
		pending,
	} = useAgentChat({
		lix,
		system:
			"You are running embedded in an app called 'Flashtype'. Flashtype is a WISIWYG markdown editor that runs in the browser with lix change control.",
	});

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
	const [showDecision, setShowDecision] = React.useState(false);
	const pendingPrev = React.useRef(false);
	React.useEffect(() => {
		// Show decision menu when pending flips from true -> false
		if (pendingPrev.current && !pending) setShowDecision(true);
		pendingPrev.current = pending;
	}, [pending]);

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
			{pending ? <LoadingBar /> : null}
			{showDecision ? (
				<AcceptChangesMenu
					onPick={(idx) => {
						setShowDecision(false);
						// Mock: append a small summary message depending on choice
						const text =
							idx === 0
								? "Accepted all changes (mock)."
								: idx === 1
									? "Rejected all changes (mock)."
									: "Entering review mode (mock).";
						// No real agent call here; just a visual cue via console
						console.debug("Decision picked:", idx, text);
					}}
					onCancel={() => setShowDecision(false)}
				/>
			) : null}
			{!showDecision && (
				<ChatInput
					onSend={(v) => {
						if (pending) return; // prevent send while working
						send(v);
					}}
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
			)}
		</div>
	);
}
