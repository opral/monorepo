import type { Lix } from "@lix-js/sdk";
import { uuidV7 } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createReadFileTool } from "./tools/read-file.js";
import { generateText, stepCountIs } from "ai";

export type ChatMessage = {
	id: string;
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
		history.push({ id: uuidV7({ lix }), role: "user", content: text });
		// Persist immediately so observers (UI) see the user message before model response
		await persistToKv(lix, { system: systemInstruction, messages: history });

		// Detect @mentions of file paths and guide the model to use the tool.
		const mentionPaths = extractMentionPaths(text);
		const mentionGuidance =
			mentionPaths.length > 0
				? `File mentions like @<path> may refer to workspace files. If helpful, you can call the read_file tool with { path: "<path>" } to inspect content before answering. Only read files when needed.`
				: undefined;

		let stepNo = 0;
		const { text: reply, usage } = await generateText({
			model,
			system:
				mentionGuidance && systemInstruction
					? `${systemInstruction}\n\n${mentionGuidance}`
					: (mentionGuidance ?? systemInstruction),
			messages: toAiMessages(),
			// Expose tools so the model can call them (e.g., read_file).
			tools: { read_file },
			// Enable multi-step tool calling; allow up to 5 steps when tools are used.
			stopWhen: stepCountIs(5),
			// Do not force tool usage; the model decides when to call read_file.
			// Optional: compress messages for longer loops.
			prepareStep: async ({ messages }) => {
				if (messages.length > 20) {
					return { messages: messages.slice(-10) };
				}
				return {};
			},
			onStepFinish: ({
				toolCalls,
				toolResults,
				usage: stepUsage,
				finishReason,
				text,
			}) => {
				stepNo += 1;
				if (toolCalls.length > 0) {
					const names = toolCalls.map((c) => c.toolName).join(", ");
					console.log(`[LixAgent] Step ${stepNo}: tool call → ${names}`);
				}
				if (toolResults.length > 0) {
					const names = toolResults.map((r) => r.toolName).join(", ");
					console.log(`[LixAgent] Step ${stepNo}: tool result ← ${names}`);
				}
				if (text) {
					// Log short preview of generated text for debugging multi-step flow.
					const preview = text.length > 120 ? text.slice(0, 117) + "..." : text;
					console.log(
						`[LixAgent] Step ${stepNo}: finish=${finishReason}, tokens in=${stepUsage.inputTokens ?? 0} out=${stepUsage.outputTokens ?? 0}. Text: ${preview}`
					);
				}
			},
			abortSignal: signal,
		});

		history.push({ id: uuidV7({ lix }), role: "assistant", content: reply });

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

	const read_file = createReadFileTool({ lix });
	return {
		lix,
		model,
		sendMessage,
		getHistory,
		clearHistory,
	};
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
					const id = (m as any).id ?? uuidV7({ lix });
					history.push({ id, role: m.role, content: String(m.content ?? "") });
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

function extractMentionPaths(text: string): string[] {
	const out = new Set<string>();
	const re = /@([A-Za-z0-9_./-]+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		const p = m[1];
		if (p) out.add(p);
	}
	return [...out];
}
