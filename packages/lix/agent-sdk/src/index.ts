export { createLixAgent } from "./create-lix-agent.js";
export {
	appendDefaultSystemPrompt,
	DEFAULT_SYSTEM_PROMPT,
} from "./system-prompt.js";
export { summarizeWorkingChanges } from "./summarize-working-changes.js";
export type { Agent } from "./create-lix-agent.js";
export type { Agent as LixAgent } from "./create-lix-agent.js";
export type {
	AgentConversation,
	AgentConversationMessage,
	AgentConversationMessageMetadata,
	AgentStep,
} from "./types.js";
export {
	sendMessage,
	type SendMessageArgs,
	type SendMessageResult,
} from "./send-message.js";
export {
	appendUserMessage,
	appendAssistantMessage,
	loadConversation,
	persistConversation,
} from "./conversation-storage.js";
