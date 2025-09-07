import * as React from "react";
import type { ChatMessage } from "./types";

/**
 * Minimal, self-contained mock chat state with a streaming-like assistant reply.
 *
 * This does not call any backend. It only simulates latency and typing.
 *
 * @example
 * const chat = useChatMock();
 * chat.send("Outline the section on X");
 */
export function useChatMock() {
	const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
		{
			id: cryptoId(),
			role: "system",
			content:
				"Welcome to Flashtype Agent. Terminal-first. Keyboard-first. ‘Claude Code for writing’.",
			at: Date.now(),
		},
		{
			id: cryptoId(),
			role: "assistant",
			content:
				"Try: /outline Topic → I’ll produce a code-like scaffold you can iterate on.",
			at: Date.now(),
		},
	]);

	const [isStreaming, setStreaming] = React.useState(false);

	const send = React.useCallback((input: string) => {
		const trimmed = input.trim();
		if (!trimmed) return;

		const userMsg: ChatMessage = {
			id: cryptoId(),
			role: "user",
			content: trimmed,
			at: Date.now(),
		};
		setMessages((prev) => [...prev, userMsg]);

		// Simulate assistant streaming a result with a terminal-code-ish flavor.
		const assistantId = cryptoId();
		const base: ChatMessage = {
			id: assistantId,
			role: "assistant",
			content: "",
			at: Date.now(),
		};
		setMessages((prev) => [...prev, base]);
		setStreaming(true);

		const demo = synthesizeReply(trimmed);
		let i = 0;
		const interval = window.setInterval(() => {
			i += 2 + Math.floor(Math.random() * 4);
			const slice = demo.slice(0, i);
			setMessages((prev) =>
				prev.map((m) => (m.id === assistantId ? { ...m, content: slice } : m)),
			);
			if (i >= demo.length) {
				window.clearInterval(interval);
				setStreaming(false);
			}
		}, 16);
	}, []);

	return { messages, isStreaming, send } as const;
}

function cryptoId() {
	try {
		// In browsers, crypto exists. Fallback to Math.random otherwise.
		return (
			(crypto as any).randomUUID?.() ??
			`m_${Math.random().toString(36).slice(2)}`
		);
	} catch {
		return `m_${Math.random().toString(36).slice(2)}`;
	}
}

function synthesizeReply(prompt: string) {
	const isSlash = prompt.startsWith("/");
	if (isSlash) {
		const cmd = prompt.split(/\s+/)[0]?.slice(1) || "cmd";
		return [
			`▸ ${cmd} — draft plan`,
			"\n",
			"```terminal",
			"\n",
			"# step 1  scaffold the structure",
			"\n",
			"# step 2  write terse copy, iterate",
			"\n",
			"# step 3  review diffs, refine",
			"\n",
			"```",
			"\n",
			"Tip: Press ⌘K for actions • Enter to send • Shift+Enter newline",
		].join("");
	}

	// Default: produce an outline scaffold.
	return [
		"λ reasoning…",
		"\n\n",
		"```md",
		"\n",
		"# Outline\n",
		"- Premise: ‘Claude Code for writing’\n",
		"- Style: Terminal-first, keyboard-first\n",
		"- Actions: /outline /rewrite /summarize /expand\n",
		"\n",
		"## Next\n",
		"- Iterate via small commits\n",
		"- Compare diffs\n",
		"```",
	].join("");
}
