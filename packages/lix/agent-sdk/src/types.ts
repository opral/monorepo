import type { LixConversation, LixConversationMessage } from "@lix-js/sdk";
import type { ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";

/**
 * A single tool call recorded for an agent turn.
 */
export type AgentStep = {
	id: string;
	kind: "tool_call";
	label?: string;
	status: "running" | "succeeded" | "failed";
	tool_name: string;
	tool_input?: unknown;
	tool_output?: unknown;
	error_text?: string;
	started_at: string;
	finished_at?: string;
};

/**
 * Metadata we store alongside conversation messages persisted via the Lix SDK.
 *
 * Keys are prefixed with `lix_agent_sdk_` to avoid collisions with host apps.
 *
 * @example
 * const metadata: AgentConversationMessageMetadata = {
 * 	lix_agent_sdk_role: "assistant",
 * 	lix_agent_sdk_steps: [{ id: "tool-1", kind: "tool_call", status: "succeeded", tool_name: "read_file", started_at: iso }],
 * };
 */
export type AgentConversationMessageMetadata = {
	lix_agent_sdk_role?: "user" | "assistant";
	lix_agent_sdk_steps?: AgentStep[];
} & Record<string, unknown>;

/**
 * Streaming notification for tool execution progress.
 */
export type AgentToolEvent = {
	type: "tool";
	phase: "start" | "finish" | "error";
	call: AgentStep;
};

/**
 * Conversation message row compatible with {@link LixConversationMessage}
 * but with a typed metadata envelope.
 *
 * @example
 * const message: AgentConversationMessage = {
 * 	id: "user-1",
 * 	parent_id: null,
 * 	body: fromPlainText("Hello"),
 * 	lixcol_metadata: { lix_agent_sdk_role: "user" },
 * };
 */
export type AgentConversationMessage = LixConversationMessage & {
	lixcol_metadata: AgentConversationMessageMetadata | null;
};

/**
 * In-memory representation of a conversation exchanged with the agent.
 *
 * Provide `id` when the messages map to a persisted Lix conversation. Omit it
 * to keep the thread transient and in-memory.
 */
export type AgentConversation = {
	id?: LixConversation["id"];
	messages: AgentConversationMessage[];
};

/**
 * @internal Lightweight chat turn used within the agent SDK while composing a message.
 */
export type AgentTurnMessage = {
	id: string;
	role: "system" | "user" | "assistant";
	content: string;
	body?: ZettelDoc;
	metadata?: AgentConversationMessageMetadata;
};

/**
 * A compact summary of a change proposal produced during tool review.
 */
export type ChangeProposalSummary = {
	id: string;
	source_version_id: string;
	target_version_id: string;
	title?: string;
	summary?: string;
	filePath?: string;
	fileId?: string;
	diff?: string;
};

/**
 * Streamed events emitted while handling an agent turn.
 */
export type AgentEvent =
	| { type: "text"; delta: string }
	| { type: "message"; message: AgentConversationMessage }
	| AgentToolEvent
	| { type: "step"; step: AgentStep }
	| {
			type: "proposal:open";
			proposal: { id: string; summary?: string };
			accept: () => Promise<void>;
			reject: (reason?: string) => Promise<void>;
	  }
	| {
			type: "proposal:closed";
			proposalId: string;
			status: "accepted" | "rejected" | "cancelled";
	  }
	| {
			type: "usage";
			inputTokens: number;
			outputTokens: number;
			totalTokens: number;
	  }
	| { type: "error"; error: unknown }
	| { type: "done" };

/**
 * Stream handle returned by {@link sendMessage}.
 *
 * @example
 * const turn = sendMessage({ agent, prompt: "Hello" });
 * for await (const event of turn) {
 * 	if (event.type === "text") console.log(event.delta);
 * }
 * const final = await turn.complete();
 */
export interface AgentTurn extends AsyncIterable<AgentEvent> {
	/**
	 * Await stream completion, optionally auto-accepting proposals.
	 *
	 * Rejects with the first stream error (including rejected proposals).
	 */
	complete(opts?: {
		autoAcceptProposals?: boolean;
		onError?: (err: unknown) => void;
	}): Promise<AgentConversationMessage>;
}
