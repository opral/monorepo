import type { LixDatabaseSchema } from "../database/schema.js";

export const TO_BE_SYNCED_TABLES: Array<keyof LixDatabaseSchema> = [
	"account",
	"change",
	"change_author",
	"change_conflict",
	"change_conflict_resolution",
	"change_edge",
	"change_set",
	"change_set_element",
	"change_set_label",
	"change_set_label_author",
	"comment",
	"discussion",
	"key_value",
	"label",
	"snapshot",
	"version",
	"version_change_conflict",
];
