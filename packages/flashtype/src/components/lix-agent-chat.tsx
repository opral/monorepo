import React from "react";
import { ChatPanel } from "@/components/agent-chat/chat-panel";

/**
 * Lix Agent Chat surface embedded in the right sidebar.
 * Mock only — no backend calls yet. Keyboard-first, terminal-style UX.
 *
 * @example
 * // Renders the chat panel
 * <LixAgentChat />
 */
export function LixAgentChat() {
	return <ChatPanel />;
}
