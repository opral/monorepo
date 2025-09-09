import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createReadFileTool } from "./tools/read-file.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createSqlSelectStateTool } from "./tools/sql-select-state.js";
import { createWriteFileTool } from "./tools/write-file.js";
import { createDeleteFileTool } from "./tools/delete-file.js";
import dedent from "dedent";
import { sendMessageCore } from "./send-message.js";
import {
	getOrCreateDefaultAgentConversationId,
	loadConversationHistory,
	appendUserMessage,
	appendAssistantMessage,
	upsertConversationPointer,
} from "./conversation-storage.js";

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
	const LIX_BASE_SYSTEM = dedent`
		You are the Lix Agent.

		Your job is to assist users in managing their lix, modifying files, etc. 

		Lix is a change control system. A change control system is like a version 
    control system but tracks individual changes, runs in the browser, 
    can store and track any file format, and is designed to be used by apps.

    Oftentimes you are embedded into apps that use Lix to expose change control 
    functionality to end users. You may be asked questions about the lix, its 
    changes, or to help the user make changes. 


		Key concepts

    - Changes: Everything in Lix is a change. State is materialized from changes. 

    - Versions: A version is like a git branch but called version to align more with
      non-developer users. Versions can be created, switched, and merged.

    - A repository is called just "lix" e.g. a user might say "what is in my lix?". 

		- State views: state (active version) and state_all (all versions).
		  Columns: entity_id, schema_key, file_id, plugin_key, snapshot_content
		  (JSON), schema_version, created_at, updated_at, inherited_from_version_id,
		  change_id, untracked, commit_id; plus version_id on state_all.
		
    - Dynamic schemas: entity shapes are stored by schema_key in
		  snapshot_content; stored schemas live under lix_stored_schema.
		
	  - Files: the file table stores file descriptors and binary content.
			  Never query binary content; use the read_file tool when you truly need
			  to inspect a file.

		Checkpoints (user-facing commits)
    
		- Lix auto-commits changes; raw commits are an internal detail.
		- A checkpoint is a commit labeled with the lix_label named "checkpoint".
		- When users ask about checkpoints, list recent commits that carry the
		  "checkpoint" label.

		Language and style

		- Say “change control” (never “version control”).
    - Use “the lix” to refer to the repository/workspace.
	`;

	let systemInstruction: string | undefined = args.system
		? `${LIX_BASE_SYSTEM}\n\n${args.system}`
		: LIX_BASE_SYSTEM;

	// Bootstrap default conversation pointer and hydrate from messages
	const conversationId = await getOrCreateDefaultAgentConversationId(lix);
	const initial = await loadConversationHistory(lix, conversationId);
	for (const m of initial) history.push(m);

	async function sendMessage({
		text,
		system,
		signal,
	}: {
		text: string;
		system?: string;
		signal?: AbortSignal;
	}) {
		if (system) {
			// Prepend base system to any provided system override.
			systemInstruction = `${LIX_BASE_SYSTEM}\n\n${system}`;
		}

		const { text: reply, usage } = await sendMessageCore({
			lix,
			model,
			history,
			text,
			system: systemInstruction,
			setSystem: (s?: string) => {
				systemInstruction = s;
			},
			signal,
			tools: {
				read_file,
				list_files,
				sql_select_state,
				write_file,
				delete_file,
			},
			persistUser: (t: string) => appendUserMessage(lix, conversationId, t),
			persistAssistant: (t: string) =>
				appendAssistantMessage(lix, conversationId, t),
		});

		return { text: reply, usage };
	}

	function getHistory() {
		return history.slice();
	}

	async function clearHistory() {
		history.length = 0;
		const { createConversation } = await import("@lix-js/sdk");
		const t = await createConversation({ lix, versionId: "global" });
		await upsertConversationPointer(lix, t.id);
	}

	const read_file = createReadFileTool({ lix });
	const list_files = createListFilesTool({ lix });
	const sql_select_state = createSqlSelectStateTool({ lix });
	const write_file = createWriteFileTool({ lix });
	const delete_file = createDeleteFileTool({ lix });
	return {
		lix,
		model,
		sendMessage,
		getHistory,
		clearHistory,
	};
}

// KV-based hydration removed; using threads instead
