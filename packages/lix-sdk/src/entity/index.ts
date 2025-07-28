export type { LixEntity, LixEntityCanonical } from "./schema.js";
export type { LixEntityLabel } from "./label/schema.js";
export type { LixEntityThread } from "./thread/schema.js";
export {
	createEntityLabel,
	deleteEntityLabel,
} from "./label/create-entity-label.js";
export {
	createEntityThread,
	deleteEntityThread,
} from "./thread/create-entity-thread.js";
export { ebEntity } from "./eb-entity.js";
