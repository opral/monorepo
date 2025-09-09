export type { LixEntity, LixEntityCanonical } from "./schema.js";
export type { LixEntityLabel } from "./label/schema.js";
export type { LixEntityConversation } from "./conversation/schema.js";
export { attachLabel, detachLabel } from "./label/attach-label.js";
export {
	attachConversation,
	detachConversation,
} from "./conversation/attach-conversation.js";
export { ebEntity } from "./eb-entity.js";
