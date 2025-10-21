import { useEffect, useMemo, useState, useCallback } from "react";
import { createGatewayProvider } from "@ai-sdk/gateway";
import { createConversation, type Lix } from "@lix-js/sdk";
import { fromPlainText } from "@lix-js/sdk/dependency/zettel-ast";
import { LLM_PROXY_PREFIX } from "@/env-variables";
import {
	createLixAgent,
	type Agent as LixAgent,
	type AgentConversationMessage,
	type AgentConversationMessageMetadata,
	type SendMessageResult,
	sendMessage,
} from "@lix-js/agent-sdk";
import { clearConversation as runClearConversation } from "../commands/clear";

type AgentChatMessage = AgentConversationMessage;

type PendingDecision = {
	id: string;
};

export type ToolEvent =
	| {
			type: "start";
			id: string;
			name: string;
			input?: unknown;
			at: number;
	  }
	| {
			type: "finish";
			id: string;
			name: string;
			output?: unknown;
			at: number;
	  }
	| {
			type: "error";
			id: string;
			name: string;
			errorText: string;
			at: number;
	  };

const CONVERSATION_KEY = "flashtype_agent_conversation_id";

const formatToolError = (value: unknown): string => {
	if (value instanceof Error) return value.message;
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

const consumeAgentStream = async (
	aiSdk: SendMessageResult["aiSdk"],
	toPromise: SendMessageResult["toPromise"],
	onToolEvent?: (event: ToolEvent) => void,
): Promise<AgentConversationMessage> => {
	if (!onToolEvent) {
		for await (const _ of aiSdk.fullStream) {
			// consume events without emitting tool updates
		}
		return await toPromise();
	}

	for await (const part of aiSdk.fullStream) {
		if (part.type === "tool-call") {
			onToolEvent({
				type: "start",
				id: part.toolCallId,
				name: String(part.toolName),
				input: part.input,
				at: Date.now(),
			});
		} else if (part.type === "tool-result") {
			if (part.preliminary) continue;
			onToolEvent({
				type: "finish",
				id: part.toolCallId,
				name: String(part.toolName),
				output: part.output,
				at: Date.now(),
			});
		} else if (part.type === "tool-error") {
			onToolEvent({
				type: "error",
				id: part.toolCallId,
				name: String(part.toolName),
				errorText: formatToolError(part.error),
				at: Date.now(),
			});
		}
	}
	return await toPromise();
};

export function useAgentChat(args: { lix: Lix; systemPrompt?: string }) {
	const { lix, systemPrompt } = args;

	const [messages, setMessages] = useState<AgentChatMessage[]>([]);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [agent, setAgent] = useState<LixAgent | null>(null);
	const [conversationId, setConversationId] = useState<string | null>(null);
	const [pendingDecision, setPendingDecision] =
		useState<PendingDecision | null>(null);

	const modelName = "google/gemini-2.5-pro";
	const [missingKey, setMissingKey] = useState(false);
	const provider = useMemo(() => {
		return createGatewayProvider({
			apiKey: "proxy", // placeholder, the worker injects the real key
			baseURL: `${LLM_PROXY_PREFIX}/v1/ai`,
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request =
					input instanceof Request ? input : new Request(input, init);
				const headers = new Headers(request.headers);
				headers.delete("authorization");
				const response = await fetch(new Request(request, { headers }));
				if (response.status === 500) {
					try {
						const clone = response.clone();
						const text = await clone.text();
						if (text.includes("Missing AI_GATEWAY_API_KEY")) {
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

	const upsertConversationPointer = useCallback(
		async (id: string) => {
			await lix.db.transaction().execute(async (trx) => {
				const existing = await trx
					.selectFrom("key_value_all")
					.where("lixcol_version_id", "=", "global")
					.where("key", "=", CONVERSATION_KEY)
					.select(["key"])
					.executeTakeFirst();

				if (existing) {
					await trx
						.updateTable("key_value_all")
						.set({ value: id, lixcol_untracked: true })
						.where("key", "=", CONVERSATION_KEY)
						.where("lixcol_version_id", "=", "global")
						.execute();
				} else {
					await trx
						.insertInto("key_value_all")
						.values({
							key: CONVERSATION_KEY,
							value: id,
							lixcol_version_id: "global",
							lixcol_untracked: true,
						})
						.execute();
				}
			});
		},
		[lix],
	);

	const refreshConversationId = useCallback(async (): Promise<
		string | null
	> => {
		const ptr = await lix.db
			.selectFrom("key_value_all")
			.where("lixcol_version_id", "=", "global")
			.where("key", "=", CONVERSATION_KEY)
			.select(["value"])
			.executeTakeFirst();
		const id =
			typeof ptr?.value === "string" && ptr.value.length > 0
				? (ptr.value as string)
				: null;
		setConversationId(id);
		return id;
	}, [lix]);

	const ensureConversationId = useCallback(async (): Promise<string> => {
		if (conversationId) return conversationId;

		const existing = await refreshConversationId();
		if (existing) {
			return existing;
		}

		const created = await createConversation({ lix, versionId: "global" });
		await upsertConversationPointer(created.id);
		setConversationId(created.id);
		return created.id;
	}, [conversationId, refreshConversationId, lix, upsertConversationPointer]);

	// Boot agent
	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!hasKey || !model) {
				setAgent(null);
				setConversationId(null);
				setMessages([]);
				return;
			}
			const a = await createLixAgent({ lix, model, systemPrompt });
			if (cancelled) return;
			setAgent(a);
			await refreshConversationId();
		})();
		return () => {
			cancelled = true;
		};
	}, [lix, model, hasKey, systemPrompt, refreshConversationId]);

	// Subscribe to conversation messages when the ID changes
	useEffect(() => {
		let cancelled = false;
		let sub: { unsubscribe(): void } | null = null;
		(async () => {
			if (!conversationId) {
				setMessages([]);
				return;
			}
			const query = lix.db
				.selectFrom("conversation_message")
				.where("conversation_id", "=", String(conversationId))
				.select([
					"id",
					"body",
					"lixcol_metadata",
					"lixcol_created_at",
					"parent_id",
					"conversation_id",
				])
				.orderBy("lixcol_created_at", "asc")
				.orderBy("id", "asc");
			sub = lix.observe(query).subscribe({
				next: (rows) => {
					if (cancelled) return;
					type ConversationRow = (typeof rows)[number] & {
						lixcol_metadata?: Record<string, unknown> | null;
					};
					const hist: AgentChatMessage[] = (rows as ConversationRow[]).map(
						(r) => ({
							...r,
							id: String(r.id),
							conversation_id: String(r.conversation_id),
							parent_id: (r.parent_id as string | null) ?? null,
							lixcol_metadata: (r.lixcol_metadata ??
								null) as AgentConversationMessageMetadata | null,
						}),
					);
					setMessages(hist);
				},
				error: (e) => setError(e?.message || String(e)),
			});
		})();
		return () => {
			cancelled = true;
			sub?.unsubscribe();
		};
	}, [lix, conversationId]);

	const send = useCallback(
		async (
			text: string,
			opts?: {
				signal?: AbortSignal;
				onToolEvent?: (event: ToolEvent) => void;
			},
		) => {
			if (!agent) throw new Error("Agent not ready");
			const trimmed = text.trim();
			if (!trimmed) return;
			setError(null);
			setPendingDecision(null);
			setPending(true);
			try {
				const convId = await ensureConversationId();
				const turn = await sendMessage({
					agent,
					prompt: fromPlainText(trimmed),
					conversationId: convId,
					signal: opts?.signal,
				});
				setConversationId(turn.conversationId);
				await consumeAgentStream(turn.aiSdk, turn.toPromise, opts?.onToolEvent);
				setPendingDecision({
					id: `decision-${Date.now().toString(36)}`,
				});
			} catch (err) {
				const message =
					err instanceof Error ? err.message : String(err ?? "unknown");
				setError(message);
				throw err;
			} finally {
				setPending(false);
			}
		},
		[agent, ensureConversationId],
	);

	const acceptPendingDecision = useCallback(() => {
		if (!pendingDecision) return;
		// eslint-disable-next-line no-console
		console.log("Accepting agent changes", pendingDecision);
		setPendingDecision(null);
	}, [pendingDecision]);

	const rejectPendingDecision = useCallback(() => {
		if (!pendingDecision) return;
		// eslint-disable-next-line no-console
		console.log("Rejecting agent changes", pendingDecision);
		setPendingDecision(null);
	}, [pendingDecision]);

	const clear = useCallback(async () => {
		const newId = await runClearConversation({ lix, agent });
		setConversationId(newId);
		setMessages([]);
		setPendingDecision(null);
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
		pendingDecision,
		acceptPendingDecision,
		rejectPendingDecision,
	} as const;
}
