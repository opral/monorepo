import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { useLix } from "@lix-js/react-utils";
import { createLixAgent, type LixAgent } from "@lix-js/agent";

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

function getGoogleModel() {
  const apiKey = import.meta?.env?.VITE_GOOGLE_API_KEY as string | undefined;
  const modelName = (import.meta?.env?.VITE_GOOGLE_MODEL as string | undefined) ?? "gemini-2.5-flash";
  if (!apiKey) {
    return { model: null as any, modelName, hasKey: false };
  }
  const provider = createGoogleGenerativeAI({ apiKey });
  const model = provider(modelName);
  return { model, modelName, hasKey: true };
}

export default function AgentChat() {
    const lix = useLix();
    const [agent, setAgent] = useState<LixAgent | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			role: "system",
			content:
				"You are a helpful coding assistant for Flashtype. Keep answers concise and practical. Avoid unnecessary markdown formatting.",
		},
	]);
	const [input, setInput] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

    const { model, modelName, hasKey } = useMemo(
        () => getGoogleModel(),
        [import.meta.env],
    );

    // Capture initial system instruction once
    const initialSystemRef = useRef<string | undefined>(
      ((): string | undefined => {
        const sys = messages.find((m) => m.role === "system")?.content;
        return sys;
      })(),
    );

    // Create the agent at mount or when model/lix changes
    useEffect(() => {
      let cancelled = false;
      async function boot() {
        try {
          if (!hasKey || !model) {
            setAgent(null);
            return;
          }
          const a = await createLixAgent({ lix, model, system: initialSystemRef.current });
          if (!cancelled) setAgent(a);
          // Hydrate UI messages from store/agent
          try {
            const systemMsg = initialSystemRef.current;
            const prior = a.getHistory();
            const base: ChatMessage[] = systemMsg ? [{ role: "system", content: systemMsg }] : [];
            setMessages([...base, ...prior]);
          } catch {
            // ignore
          }
        } catch (e) {
          if (!cancelled) {
            console.error("Failed to create agent:", e);
            setAgent(null);
          }
        }
      }
      void boot();
      return () => {
        cancelled = true;
      };
    }, [lix, model, hasKey]);

    const onSend = useCallback(async () => {
        if (!input.trim()) return;
        if (!hasKey) {
            setError("Missing Google API key. Set VITE_GOOGLE_API_KEY and reload.");
            return;
        }
        setError(null);
        const next = [...messages, { role: "user" as const, content: input }];
        setMessages(next);
        setInput("");
        setPending(true);
        try {
            if (!agent) throw new Error("Agent not ready");
            const { text } = await agent.sendMessage({ text: input });
            setMessages([...next, { role: "assistant", content: text }]);
            // scroll to bottom
            queueMicrotask(() =>
                listRef.current?.scrollTo({
                    top: listRef.current.scrollHeight,
                    behavior: "smooth",
                }),
            );
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setPending(false);
        }
    }, [input, messages, hasKey, model, lix, agent]);

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
                    disabled={pending || !input.trim() || !agent}
                    title={hasKey ? "Send" : "Missing API key"}
                >
						Send
					</button>
				</div>
			</div>
		</div>
	);
}
