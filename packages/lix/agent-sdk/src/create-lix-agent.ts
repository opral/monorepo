import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createReadFileTool } from "./tools/read-file.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createSqlSelectStateTool } from "./tools/sql-select-state.js";
import { createWriteFileTool } from "./tools/write-file.js";
import { createDeleteFileTool } from "./tools/delete-file.js";
import { createCreateVersionTool } from "./tools/create-version.js";
import { sendMessageCore } from "./send-message.js";
import { createCreateChangeProposalTool } from "./tools/create-change-proposal.js";
import {
	getOrCreateDefaultAgentConversationId,
	loadConversationHistory,
	appendUserMessage,
	appendAssistantMessage,
	setDefaultAgentConversationId,
} from "./conversation-storage.js";
import { ContextStore } from "./context/context-store.js";
import { DEFAULT_SYSTEM_PROMPT } from "./system-prompt.js";

export type ChatMessage = {
	id: string;
	role: "system" | "user" | "assistant";
	content: string;
};

/**
 * Handle returned by {@link createLixAgent}.
 */
export type LixAgent = {
	lix: Lix;
	model: LanguageModelV2;
	// Default conversation API
	sendMessage(args: {
		text: string;
		systemPrompt?: string;
		signal?: AbortSignal;
		onToolEvent?: (event: import("./send-message.js").ToolEvent) => void;
	}): Promise<{
		text: string;
		usage?: {
			inputTokens?: number;
			outputTokens?: number;
			totalTokens?: number;
		};
		/**
		 * Optional id of a newly created change proposal during this send.
		 */
		changeProposalId?: string;
	}>;
	getHistory(): ChatMessage[];
	clearHistory(): void;
	setContext(key: string, value: string): void;
	getContext(key: string): string | undefined;
};

/**
 * Create a Lix agent handle that wraps Lix SDK interactions.
 *
 * Provide `systemPrompt` to override the default instructions. Use
 * {@link appendDefaultSystemPrompt} to extend the default prompt with
 * additional guidance while keeping core behaviors.
 *
 * @example
 * import { createLixAgent, appendDefaultSystemPrompt } from "@lix-js/agent-sdk";
 *
 * const agent = await createLixAgent({
 * 	lix,
 * 	model,
 * 	systemPrompt: appendDefaultSystemPrompt("You are using flashtype..."),
 * });
 */
export async function createLixAgent(args: {
	lix: Lix;
	model: LanguageModelV2;
	systemPrompt?: string;
}): Promise<LixAgent> {
	const { lix, model, systemPrompt: providedSystemPrompt } = args;

	// Default conversation state (in-memory)
	const history: ChatMessage[] = [];
	const contextStore = new ContextStore();
	let systemInstruction = providedSystemPrompt ?? DEFAULT_SYSTEM_PROMPT;

	// Bootstrap default conversation pointer and hydrate from messages
	const conversationId = await getOrCreateDefaultAgentConversationId(lix);
	const initial = await loadConversationHistory(lix, conversationId);
	for (const m of initial) history.push(m);

	let lastChangeProposalId: string | undefined;

	async function sendMessage({
		text,
		systemPrompt,
		signal,
		onToolEvent,
	}: {
		text: string;
		systemPrompt?: string;
		signal?: AbortSignal;
		onToolEvent?: (event: import("./send-message.js").ToolEvent) => void;
	}) {
		if (systemPrompt !== undefined) {
			systemInstruction = systemPrompt;
		}

		// Clear any previous capture before starting
		lastChangeProposalId = undefined;

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.select(["version.id", "version.name"])
			.executeTakeFirstOrThrow();

		contextStore.set(
			"active_version",
			`id=${String(activeVersion.id)}, name=${String(
				activeVersion.name ?? "null"
			)}`
		);

		const contextOverlay = contextStore.toOverlayBlock();
		const mergedSystem = contextOverlay
			? `${systemInstruction}\n\n${contextOverlay}`
			: systemInstruction;

		const { text: reply, usage } = await sendMessageCore({
			lix,
			model,
			history,
			text,
			system: mergedSystem,
			setSystem: (s?: string) => {
				if (s !== undefined) {
					systemInstruction = s;
				}
			},
			signal,
			tools: {
				read_file,
				list_files,
				sql_select_state,
				write_file,
				delete_file,
				create_version,
				create_change_proposal,
			},
			persistUser: (t: string) => appendUserMessage(lix, conversationId, t),
			persistAssistant: ({ text: assistantText, metadata }) =>
				appendAssistantMessage(lix, conversationId, assistantText, metadata),
			onToolEvent,
		});
		const result = {
			text: reply,
			usage,
			changeProposalId: lastChangeProposalId,
		};
		// Reset capture to avoid leaking across calls
		lastChangeProposalId = undefined;
		return result;
	}

	function getHistory() {
		return history.slice();
	}

	async function clearHistory() {
		history.length = 0;
		const { createConversation } = await import("@lix-js/sdk");
		const t = await createConversation({ lix, versionId: "global" });
		await setDefaultAgentConversationId(lix, t.id);
	}

	const read_file = createReadFileTool({ lix });
	const list_files = createListFilesTool({ lix });
	const sql_select_state = createSqlSelectStateTool({ lix });
	const write_file = createWriteFileTool({ lix });
	const delete_file = createDeleteFileTool({ lix });
	const create_version = createCreateVersionTool({ lix });
	const create_change_proposal = createCreateChangeProposalTool({
		lix,
		onCreated: (p) => {
			lastChangeProposalId = p.id;
		},
	});
	return {
		lix,
		model,
		sendMessage,
		getHistory,
		clearHistory,
		setContext: (key: string, value: string) => {
			contextStore.set(key, value);
		},
		getContext: (key: string) => contextStore.get(key),
	};
}

// KV-based hydration removed; using threads instead
