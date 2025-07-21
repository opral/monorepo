export type { LixEntity } from "./schema.js";
export type { LixEntityLabel } from "./label/schema.js";

export { entityEquals, entityEqualsCanonical } from "./entity-equals.js";

export {
	createEntityLabel,
	deleteEntityLabel,
} from "./label/create-entity-label.js";