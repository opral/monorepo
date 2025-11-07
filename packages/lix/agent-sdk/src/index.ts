export {
	createLixAgent,
	getChangeProposalSummary,
} from "./create-lix-agent.js";
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
	AgentToolEvent,
	AgentToolStep,
	AgentThinkingStep,
	AgentEvent,
	AgentTurn,
	ChangeProposalSummary,
} from "./types.js";
export { sendMessage, type SendMessageArgs } from "./send-message.js";
export type { AgentChangeProposalEvent } from "./proposal-mode.js";
export { ChangeProposalRejectedError } from "./proposal-mode.js";
