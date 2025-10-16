import type { Lix } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createReadFileTool } from "./tools/read-file.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createSqlSelectStateTool } from "./tools/sql-select-state.js";
import { createWriteFileTool } from "./tools/write-file.js";
import { createDeleteFileTool } from "./tools/delete-file.js";
import { createCreateVersionTool } from "./tools/create-version.js";
import dedent from "dedent";
import { sendMessageCore } from "./send-message.js";
import { createCreateChangeProposalTool } from "./tools/create-change-proposal.js";
import {
	getOrCreateDefaultAgentConversationId,
	loadConversationHistory,
	appendUserMessage,
	appendAssistantMessage,
	setDefaultAgentConversationId,
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
 * import { createLixAgent } from "@lix-js/agent-sdk";
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

		Lix is a change control system. Unlike traditional version control, it 
		tracks individual changes, runs in the browser, can manage any file format, 
		and is designed to power apps.

		Oftentimes you are embedded into apps that expose change control functionality to end users. 
		You may be asked about the lix, its changes, or to help make updates.

		## Key concepts

		- Changes: Everything in Lix is a change. State is materialized from changes.

		- Versions: A version is like a git branch but called version to align more with non-developer users. Versions can be created, switched, and merged.

		- A lix is the environment you operate within (e.g., a user might ask “what is in my lix?”).

		- State views: state (active version) and state_all (all versions). Columns: entity_id, schema_key, file_id, plugin_key, snapshot_content (JSON), schema_version, created_at, updated_at, inherited_from_version_id, change_id, untracked, commit_id; plus version_id on state_all.

		- Dynamic schemas: entity shapes are stored by schema_key in snapshot_content; stored schemas live under lix_stored_schema.

		- Files: the file table stores file descriptors and binary content. Never query binary content; use the read_file tool when you truly need to inspect a file.

		## Tooling references

		- Always supply the versionId parameter when calling read_file, write_file, delete_file, or list_files so that you inspect or modify the intended version.

		- Use the create_version tool to branch when needed. It supports optional fromVersionId (defaults to the active version) and inheritsFromVersionId (pass null to break inheritance).

		- When creating change proposals, provide both sourceVersionId (holding your edits) and targetVersionId (the destination version).

		## AGENTS.md spec

		- AGENTS.md files can appear anywhere within a lix.

		- Instructions in AGENTS.md files:

		  - The scope of an AGENTS.md file is the entire directory tree rooted at the folder that contains it.

		  - For every file you change, you must obey instructions in any AGENTS.md file whose scope includes that file.

		  - Instructions about style, structure, naming, etc. apply only to code within the AGENTS.md file's scope, unless the file states otherwise.

		  - More-deeply-nested AGENTS.md files take precedence in the case of conflicting instructions.

		  - Direct system/developer/user instructions (as part of a prompt) take precedence over AGENTS.md instructions.

		Your job is to assist users in managing their lix, modifying files, and answering questions about the lix.

		## Checkpoints (user-facing commits)

		- Lix auto-commits changes; raw commits are an internal detail.

		- A checkpoint is a commit labeled with the lix_label named "checkpoint".

		- When users ask about checkpoints, list recent commits that carry the "checkpoint" label.

		## Language and style

		- Say “change control” (never “version control”).

		- Use “the lix” to refer to the shared project state.

		## Change proposals

		- Proposals are version-based review units available to help users evaluate work. Create a change proposal when it will help the user review a coherent unit of work, but you are not required to create one for every interaction.
	`;

	let systemInstruction: string | undefined = args.system
		? `${LIX_BASE_SYSTEM}\n\n${args.system}`
		: LIX_BASE_SYSTEM;

	// Bootstrap default conversation pointer and hydrate from messages
	const conversationId = await getOrCreateDefaultAgentConversationId(lix);
	const initial = await loadConversationHistory(lix, conversationId);
	for (const m of initial) history.push(m);

	let lastChangeProposalId: string | undefined;

	async function sendMessage({
		text,
		system,
		signal,
		onToolEvent,
	}: {
		text: string;
		system?: string;
		signal?: AbortSignal;
		onToolEvent?: (event: import("./send-message.js").ToolEvent) => void;
	}) {
		if (system) {
			// Prepend base system to any provided system override.
			systemInstruction = `${LIX_BASE_SYSTEM}\n\n${system}`;
		}

		// Clear any previous capture before starting
		lastChangeProposalId = undefined;

		// Build Proposal Mode overlay if KV indicates an active proposal
		let systemOverlay: string | undefined;
		try {
			const kv = await lix.db
				.selectFrom("key_value_all")
				.where("lixcol_version_id", "=", "global")
				.where("key", "=", "lix_agent_active_proposal_id")
				.select(["value"])
				.executeTakeFirst();
			const activeId = kv?.value as any as string | undefined;
			if (activeId) {
				const cp = await lix.db
					.selectFrom("change_proposal")
					.where("id", "=", activeId)
					.select(["id", "source_version_id", "status"])
					.executeTakeFirst();
				if (cp && cp.status === "open") {
					systemOverlay = dedent`
                        Proposal Mode (Active Change Proposal)

                        - Active proposal id: ${String(cp.id)}
                        - Source version id: ${String(cp.source_version_id)}

					You MUST:
					1) When calling read_file, write_file, or delete_file pass versionId: ${String(cp.source_version_id)} so edits stay on the source version of this proposal.
					2) NOT call create_change_proposal again. Continue refining the existing proposal until the user accepts or rejects it.

                        Only open a new proposal if the user explicitly requests a new one.
                    `;
				} else {
					// Clean stale KV if proposal is gone or closed
					try {
						await lix.db
							.deleteFrom("key_value_all")
							.where("lixcol_version_id", "=", "global")
							.where("key", "=", "lix_agent_active_proposal_id")
							.execute();
					} catch {}
				}
			}
		} catch {}

		const { text: reply, usage } = await sendMessageCore({
			lix,
			model,
			history,
			text,
			system: systemOverlay
				? `${systemInstruction}\n\n${systemOverlay}`
				: systemInstruction,
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
	};
}

// KV-based hydration removed; using threads instead
