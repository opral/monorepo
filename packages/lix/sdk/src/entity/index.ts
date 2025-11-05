export type { LixEntity, LixEntityCanonical } from "./types.js";
export type { LixEntityLabel } from "./label/schema-definition.js";
export type { LixEntityConversation } from "./conversation/schema-definition.js";
export { attachLabel, detachLabel } from "./label/attach-label.js";
export {
	attachConversation,
	detachConversation,
} from "./conversation/attach-conversation.js";
export { ebEntity } from "./eb-entity.js";
