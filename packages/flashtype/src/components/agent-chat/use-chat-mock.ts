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
	// Start empty; reply with lorem ipsum on send.
	const [messages, setMessages] = React.useState<ChatMessage[]>([]);

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

		// Always simulate 3 tool runs, then stream a final plain-text reply.
		const assistantId = cryptoId();
		const base: ChatMessage = {
			id: assistantId,
			role: "assistant",
			content: "",
			at: Date.now(),
			toolRuns: [
				{
					id: cryptoId(),
					title: "Plan()",
					detail: "Generate 3 steps",
					status: "queued",
				},
			],
		};
		const readId = cryptoId();
		const sumId = cryptoId();
		setMessages((prev) => [...prev, base]);
		setStreaming(true);

		// Tool 1 running
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: m.toolRuns?.map((r, i) =>
									i === 0 ? { ...r, status: "running" } : r,
								),
							}
						: m,
				),
			);
		}, 150);

		// Tool 1 success + output (and append Tool 2 queued)
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: [
									...(m.toolRuns ?? []).map((r, i) =>
										i === 0
											? {
													...r,
													status: "success" as const,
													output: "1) gather info\n2) read files\n3) summarize",
												}
											: r,
									),
									{
										id: readId,
										title: "Read(README.md)",
										detail: "Read 32 lines",
										status: "queued" as const,
									},
								],
							}
						: m,
				),
			);
		}, 850);

		// Tool 2 running
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: (m.toolRuns ?? []).map((r) =>
									r.id === readId ? { ...r, status: "running" as const } : r,
								),
							}
						: m,
				),
			);
		}, 1000);

		// Tool 2 success + output (and append Tool 3 queued)
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: [
									...(m.toolRuns ?? []).map((r) =>
										r.id === readId
											? {
													...r,
													status: "success" as const,
													output: "README.md: 32 lines loaded",
												}
											: r,
									),
									{
										id: sumId,
										title: "Summarize()",
										detail: "Drafting summary",
										status: "queued" as const,
									},
								],
							}
						: m,
				),
			);
		}, 1500);

		// Tool 3 running
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: (m.toolRuns ?? []).map((r) =>
									r.id === sumId ? { ...r, status: "running" as const } : r,
								),
							}
						: m,
				),
			);
		}, 1700);

		// Tool 3 success + final content streaming
		window.setTimeout(() => {
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								toolRuns: (m.toolRuns ?? []).map((r) =>
									r.id === sumId ? { ...r, status: "success" as const } : r,
								),
							}
						: m,
				),
			);

			const demo = loremIpsum();
			let i = 0;
			const interval = window.setInterval(() => {
				i += 3 + Math.floor(Math.random() * 5);
				const slice = demo.slice(0, i);
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId ? { ...m, content: slice } : m,
					),
				);
				if (i >= demo.length) {
					window.clearInterval(interval);
					setStreaming(false);
				}
			}, 14);
		}, 2100);
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

function loremIpsum() {
	return (
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do " +
		"eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, " +
		"quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
		"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
		"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
	);
}
