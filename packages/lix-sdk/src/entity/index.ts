export type { LixEntity, LixEntityCanonical } from "./schema.js";
export type { LixEntityLabel } from "./label/schema.js";
export {
	createEntityLabel,
	deleteEntityLabel,
} from "./label/create-entity-label.js";
export { ebEntity as entityEb } from "./eb-entity.js";
