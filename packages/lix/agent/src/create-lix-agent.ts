import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { generateText } from "ai";

export type ChatMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

/**
 * Placeholder for the Lix agent.
 *
 * v0 will start with: "Describe my working changes".
 * The real implementation will land behind this API.
 *
 * @example
 * import { createLixAgent } from "@lix-js/agent";
 * const agent = createLixAgent({ lix });
 * // Throws: not implemented yet
 */
export type LixAgent = {
	lix: Lix;
	model: LanguageModelV2;
	// Default conversation API
	sendMessage(args: {
		text: string;
		system?: string;
		signal?: AbortSignal;
	}): Promise<{
		text: string;
		usage?: {
			inputTokens?: number;
			outputTokens?: number;
			totalTokens?: number;
		};
	}>;
	getHistory(): ChatMessage[];
	clearHistory(): void;
};

/**
 * Create a minimal Lix agent handle.
 *
 * Wraps the Lix instance and optionally a LanguageModelV2 to be used by
 * higher-level helpers (e.g., summarizeWorkingChanges({ agent })) when
 * generating natural-language output.
 */
export async function createLixAgent(args: {
	lix: Lix;
	model: LanguageModelV2;
	system?: string;
}): Promise<LixAgent> {
	const { lix, model } = args;

	// Default conversation state (in-memory)
	const history: ChatMessage[] = [];
	let systemInstruction: string | undefined = args.system;

	// Attempt to hydrate from Lix KV (global, untracked)
	await hydrateFromKv(lix, history, (sys) => {
		if (!systemInstruction) systemInstruction = sys;
	});

	function toAiMessages(): { role: "user" | "assistant"; content: string }[] {
		const out: { role: "user" | "assistant"; content: string }[] = [];
		for (const m of history) {
			if (m.role === "user" || m.role === "assistant") {
				out.push({ role: m.role, content: m.content });
			}
		}
		return out;
	}

	async function sendMessage({
		text,
		system,
		signal,
	}: {
		text: string;
		system?: string;
		signal?: AbortSignal;
	}) {
		if (system) systemInstruction = system;
		history.push({ role: "user", content: text });
		// Persist immediately so observers (UI) see the user message before model response
		await persistToKv(lix, { system: systemInstruction, messages: history });

		const { text: reply, usage } = await generateText({
			model,
			system: systemInstruction,
			messages: toAiMessages(),
			abortSignal: signal,
		});

		history.push({ role: "assistant", content: reply });

		// Persist new state
		await persistToKv(lix, { system: systemInstruction, messages: history });
		return { text: reply, usage };
	}

	function getHistory() {
		return history.slice();
	}

	function clearHistory() {
		history.length = 0;
		void clearKv(lix);
	}

	return { lix, model, sendMessage, getHistory, clearHistory };
}

const CONVO_KEY = "lix_agent_conversation_default";

async function hydrateFromKv(
	lix: Lix,
	history: ChatMessage[],
	setSystem: (system?: string) => void
) {
	const row = await lix.db
		.selectFrom("key_value_all")
		.where("lixcol_version_id", "=", "global")
		.where("key", "=", CONVO_KEY)
		.select(["value"])
		.executeTakeFirst();
	const payload = row?.value as any;
	if (payload && typeof payload === "object") {
		if (payload.system && typeof payload.system === "string")
			setSystem(payload.system);
		if (Array.isArray(payload.messages)) {
			for (const m of payload.messages) {
				if (
					m &&
					(m.role === "user" || m.role === "assistant" || m.role === "system")
				) {
					history.push({ role: m.role, content: String(m.content ?? "") });
				}
			}
		}
	}
}

async function persistToKv(
	lix: Lix,
	data: { system?: string; messages: ChatMessage[] }
) {
	const exists = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", CONVO_KEY)
		.where("lixcol_version_id", "=", "global")
		.select(["key"])
		.executeTakeFirst();
	if (exists) {
		await lix.db
			.updateTable("key_value_all")
			.set({ value: data, lixcol_untracked: true })
			.where("key", "=", CONVO_KEY)
			.where("lixcol_version_id", "=", "global")
			.execute();
	} else {
		await lix.db
			.insertInto("key_value_all")
			.values({
				key: CONVO_KEY,
				value: data,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			})
			.execute();
	}
}

async function clearKv(lix: Lix) {
	await lix.db
		.updateTable("key_value_all")
		.set({ value: { system: undefined, messages: [] }, lixcol_untracked: true })
		.where("key", "=", CONVO_KEY)
		.where("lixcol_version_id", "=", "global")
		.execute();
}
