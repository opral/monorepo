import { useEffect, useMemo, useState, useCallback } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { Lix } from "@lix-js/sdk";
import { toPlainText } from "@lix-js/sdk/zettel-ast";
import {
	createLixAgent,
	type LixAgent,
	type ChatMessage as AgentMessage,
} from "@lix-js/agent";

export function useAgentChat(args: { lix: Lix; system?: string }) {
	const { lix, system } = args;

	const [messages, setMessages] = useState<AgentMessage[]>([]);
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

	// Boot agent and subscribe to message changes for transcript
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
			// Fetch pointer to default conversation
			const ptr = await lix.db
				.selectFrom("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_conversation_id")
				.select(["value"])
				.executeTakeFirst();
			const conversationId = (ptr?.value as any) ?? null;
			if (!conversationId) return;

			const query = lix.db
				.selectFrom("conversation_message")
				.where("conversation_id", "=", String(conversationId))
				.select(["id", "body", "metadata", "lixcol_created_at"])
				.orderBy("lixcol_created_at", "asc")
				.orderBy("id", "asc");
			sub = lix.observe(query).subscribe({
				next: (rows) => {
					const hist: AgentMessage[] = rows.map((r: any) => ({
						id: String(r.id),
						role: (r.metadata?.lix_agent_role as any) ?? "assistant",
						content: toPlainText(r.body),
					}));
					setMessages(hist);
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
		// After clearing, refetch pointer and let subscription update
		try {
			const ptr = await lix.db
				.selectFrom("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_conversation_id")
				.select(["value"])
				.executeTakeFirst();
			void ptr;
		} catch {
			// ignore
		}
	}, [agent, lix]);

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
