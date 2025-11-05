import { useEffect, useMemo, useState, useCallback } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { Lix } from "@lix-js/sdk";
import { toPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import { LLM_PROXY_PREFIX } from "@/config/proxy";
import {
	createLixAgent,
	type LixAgent,
	type ChatMessage as AgentMessage,
} from "@lix-js/agent-sdk";

export function useAgentChat(args: { lix: Lix; system?: string }) {
	const { lix, system } = args;

	const [messages, setMessages] = useState<AgentMessage[]>([]);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agent, setAgent] = useState<LixAgent | null>(null);

	const modelName = "gemini-2.5-pro";
	const [missingKey, setMissingKey] = useState(false);
	const provider = useMemo(() => {
		return createGoogleGenerativeAI({
			apiKey: "proxy", // placeholder, the worker injects the real key
			baseURL: `${LLM_PROXY_PREFIX}/v1beta`,
			fetch: async (input, init) => {
				const request =
					input instanceof Request ? input : new Request(input, init);
				const headers = new Headers(request.headers);
				headers.delete("x-goog-api-key");
				const response = await fetch(new Request(request, { headers }));
				if (response.status === 500) {
					try {
						const clone = response.clone();
						const text = await clone.text();
						if (text.includes("Missing GOOGLE_API_KEY")) {
							setMissingKey(true);
						}
					} catch {
						// ignore clone failures
					}
				} else {
					setMissingKey((prev) => (prev ? false : prev));
				}
				return response;
			},
		});
	}, []);
	const model = useMemo(
		() => (missingKey ? null : provider(modelName)),
		[missingKey, provider, modelName],
	);
	const hasKey = !missingKey;

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
				.selectFrom("key_value_by_version")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_conversation_id")
				.select(["value"])
				.executeTakeFirst();
			const conversationId = (ptr?.value as any) ?? null;
			if (!conversationId) return;

			const query = lix.db
				.selectFrom("conversation_message")
				.where("conversation_id", "=", String(conversationId))
				.select(["id", "body", "lixcol_metadata", "lixcol_created_at"])
				.orderBy("lixcol_created_at", "asc")
				.orderBy("id", "asc");
			sub = lix.observe(query).subscribe({
				next: (rows) => {
					type ConversationRow = (typeof rows)[number] & {
						lixcol_metadata?: {
							lix_agent_role?: "user" | "assistant" | string;
						} | null;
					};
					const hist: AgentMessage[] = (rows as ConversationRow[]).map((r) => {
						const role =
							(r.lixcol_metadata?.lix_agent_role as
								| "user"
								| "assistant"
								| undefined) ?? "assistant";
						return {
							id: String(r.id),
							role,
							content: toPlainText(r.body),
						};
					});
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
		async (
			text: string,
			opts?: {
				onToolEvent?: (e: import("@lix-js/agent-sdk").ToolEvent) => void;
			},
		) => {
			if (!agent) throw new Error("Agent not ready");
			if (!text.trim()) return;
			setError(null);
			setPending(true);
			try {
				const res = await agent.sendMessage({
					text,
					onToolEvent: opts?.onToolEvent,
				});
				return res;
			} finally {
				setPending(false);
			}
		},
		[agent],
	);

	const clear = useCallback(async () => {
		if (!agent) return;
		await agent.clearHistory();
		// After clearing, refetch pointer and let subscription update
		try {
			const ptr = await lix.db
				.selectFrom("key_value_by_version")
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
