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
