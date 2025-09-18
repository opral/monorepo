import React, { useCallback, useRef, useState } from "react";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useLix } from "@lix-js/react-utils";

export default function AgentChat() {
	const system =
		"You are a helpful coding assistant for Flashtype. Keep answers concise and practical. Avoid unnecessary markdown formatting.";
	const lix = useLix();

	const { messages, send, pending, error, ready, modelName, hasKey } =
		useAgentChat({ lix, system });
	const [input, setInput] = useState("");
	const listRef = useRef<HTMLDivElement>(null);

	const onSend = useCallback(async () => {
		if (!input.trim()) return;
		await send(input);
		setInput("");
		queueMicrotask(() =>
			listRef.current?.scrollTo({
				top: listRef.current.scrollHeight,
				behavior: "smooth",
			}),
		);
	}, [input, send]);

	const onKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				onSend();
			}
		},
		[onSend],
	);

	return (
		<div className="flex h-full w-full flex-col gap-3">
			<div ref={listRef} className="flex-1 overflow-auto rounded border p-3">
				{messages
					.filter((m) => m.role !== "system")
					.map((m, i) => (
						<div key={i} className="mb-3">
							<div className="text-xs text-neutral-500">{m.role}</div>
							<div className="whitespace-pre-wrap">{m.content}</div>
						</div>
					))}
				{pending ? (
					<div className="text-xs text-neutral-500">assistant is typing…</div>
				) : null}
			</div>

			<div className="flex flex-col gap-2">
				{error ? (
					<div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
						{error}
					</div>
				) : null}
				{!hasKey ? (
					<div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
						Missing Google API key. Set <code>VITE_GOOGLE_API_KEY</code> to
						enable chat. Using model <code>{modelName}</code>.
					</div>
				) : null}
				<div className="flex items-end gap-2">
					<textarea
						className="min-h-[60px] flex-1 resize-y rounded border p-2"
						placeholder="Type a message…"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={onKeyDown}
						disabled={pending}
					/>
					<button
						className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
						onClick={onSend}
						disabled={pending || !input.trim() || !ready}
						title={hasKey ? "Send" : "Missing API key"}
					>
						Send
					</button>
				</div>
			</div>
		</div>
	);
}
