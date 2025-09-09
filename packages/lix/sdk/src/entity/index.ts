export type { LixEntity, LixEntityCanonical } from "./schema.js";
export type { LixEntityLabel } from "./label/schema.js";
export type { LixEntityConversation } from "./conversation/schema.js";
export {
	createEntityLabel,
	deleteEntityLabel,
} from "./label/create-entity-label.js";
export {
	attachConversation,
	removeConversation,
} from "./conversation/attach-conversation.js";
export { ebEntity } from "./eb-entity.js";
