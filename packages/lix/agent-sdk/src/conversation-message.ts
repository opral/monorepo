import type { LixConversationMessage, State } from "@lix-js/sdk";

/**
 * A single tool call recorded for an agent turn.
 */
export type LixAgentStep = {
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

type BaseConversationMessage = State<LixConversationMessage>;
type BaseMetadata = NonNullable<BaseConversationMessage["lixcol_metadata"]>;

/**
 * Metadata we store alongside conversation messages persisted via the Lix SDK.
 *
 * Keys are prefixed with `lix_agent_sdk_` to avoid collisions with host apps.
 *
 * @example
 * const metadata: LixAgentConversationMessageMetadata = {
 * 	lix_agent_sdk_role: "assistant",
 * 	lix_agent_sdk_steps: [{ id: "tool-1", kind: "tool_call", status: "succeeded", tool_name: "read_file", started_at: iso }],
 * };
 */
export type LixAgentConversationMessageMetadata = {
	lix_agent_sdk_role?: "user" | "assistant";
	lix_agent_sdk_steps?: LixAgentStep[];
} & Record<string, unknown>;

/**
 * Conversation message row compatible with {@link State<LixConversationMessage>}
 * but with a typed metadata envelope.
 */
export type LixAgentConversationMessage = Omit<
	BaseConversationMessage,
	"lixcol_metadata"
> & {
	lixcol_metadata: (BaseMetadata & LixAgentConversationMessageMetadata) | null;
};

/**
 * Lightweight chat message used for in-memory agent history.
 */
export type ChatMessage = {
	id: string;
	role: "system" | "user" | "assistant";
	content: string;
	metadata?: LixAgentConversationMessageMetadata;
};
