export { createLixAgent } from "./create-lix-agent.js";
export {
	appendDefaultSystemPrompt,
	DEFAULT_SYSTEM_PROMPT,
} from "./system-prompt.js";
export { summarizeWorkingChanges } from "./summarize-working-changes.js";
export type { LixAgent, ChatMessage } from "./create-lix-agent.js";
export {
	getOrCreateDefaultAgentConversationId,
	setDefaultAgentConversationId,
	appendUserMessage,
	appendAssistantMessage,
	loadConversationHistory,
} from "./conversation-storage.js";
