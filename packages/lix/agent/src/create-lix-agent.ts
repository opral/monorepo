import type { Lix } from "@lix-js/sdk";
import { uuidV7 } from "@lix-js/sdk";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createReadFileTool } from "./tools/read-file.js";
import { createListFilesTool } from "./tools/list-files.js";
import { createSqlSelectStateTool } from "./tools/sql-select-state.js";
import dedent from "dedent";
import { sendMessageCore } from "./send-message.js";

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

		Language and style

		- Say “change control” (never “version control”).
    - Use “the lix” to refer to the repository/workspace.
	`;

	let systemInstruction: string | undefined = args.system
		? `${LIX_BASE_SYSTEM}\n\n${args.system}`
		: LIX_BASE_SYSTEM;

	// Attempt to hydrate from Lix KV (global, untracked)
	await hydrateFromKv(lix, history, (sys) => {
		if (!systemInstruction) systemInstruction = sys;
	});

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
			tools: { read_file, list_files, sql_select_state },
			persist: (data: { system?: string; messages: ChatMessage[] }) =>
				persistToKv(lix, data),
		});

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
	const list_files = createListFilesTool({ lix });
	const sql_select_state = createSqlSelectStateTool({ lix });
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
