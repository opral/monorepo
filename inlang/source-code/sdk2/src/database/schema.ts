import type { Bundle, Message, Variant } from "../schema/schemaV2.js";

export type InlangDatabaseSchema = {
	bundle: Bundle;
	message: Message;
	variant: Variant;
};
