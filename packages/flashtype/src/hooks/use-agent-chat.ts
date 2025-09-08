import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { Lix } from "@lix-js/sdk";
import {
	createLixAgent,
	type LixAgent,
	type ChatMessage as AgentMessage,
} from "@lix-js/agent";

export function useAgentChat(args: { lix: Lix; system?: string }) {
	const { lix, system } = args;

	const [messages, setMessages] = useState<AgentMessage[]>(() =>
		system ? [{ id: "system", role: "system", content: system }] : [],
	);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agent, setAgent] = useState<LixAgent | null>(null);

	const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
	const modelName =
		(import.meta.env.VITE_GOOGLE_MODEL as string | undefined) ??
		"gemini-2.5-flash";
	const hasKey = !!apiKey;
	const provider = useMemo(
		() => (apiKey ? createGoogleGenerativeAI({ apiKey }) : null),
		[apiKey],
	);
	const model = useMemo(
		() => (provider ? provider(modelName) : null),
		[provider, modelName],
	);

	// Boot agent and subscribe to KV changes (single source of truth)
	useEffect(() => {
		let cancelled = false;
		let sub: { unsubscribe(): void } | null = null;
		(async () => {
			if (!hasKey || !model) {
				setAgent(null);
				return;
			}
			const a = await createLixAgent({ lix, model, system });
			if (cancelled) return;
			setAgent(a);
			const query = lix.db
				.selectFrom("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_conversation_default")
				.select(["value"]);
			sub = lix.observe(query).subscribe({
				next: (rows) => {
					const payload = rows?.[0]?.value as any;
					const histRaw = Array.isArray(payload?.messages)
						? (payload.messages as AgentMessage[])
						: [];
					const hist = histRaw.map((m, i) => ({
						id: (m as any).id ?? `m_${i}`,
						role: m.role,
						content: m.content,
					}));
					const base = system
						? [
								{
									id: "system",
									role: "system",
									content: system,
								} as AgentMessage,
							]
						: [];
					setMessages([...base, ...hist]);
				},
				error: (e) => setError(e?.message || String(e)),
			});
		})();
		return () => {
			cancelled = true;
			sub?.unsubscribe();
		};
	}, [lix, model, hasKey, system]);

	const send = useCallback(
		async (text: string) => {
			if (!agent) throw new Error("Agent not ready");
			if (!text.trim()) return;
			setError(null);
			setPending(true);
			try {
				await agent.sendMessage({ text });
			} finally {
				setPending(false);
			}
		},
		[agent, system],
	);

	const clear = useCallback(async () => {
		if (!agent) return;
		await agent.clearHistory();
		setMessages(system ? [{ role: "system", content: system }] : []);
	}, [agent, system]);

	return {
		messages,
		send,
		clear,
		pending,
		error,
		ready: !!agent,
		modelName,
		hasKey,
	} as const;
}
