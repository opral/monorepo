import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Lix } from "../lix/open-lix.js";
import { humanId } from "human-id";
import { nanoid } from "../database/nano-id.js";
import {
	createEntityViewsIfNotExists,
	type StateEntityView,
	type StateEntityAllView,
} from "../state/entity-view-builder.js";

export function applyAccountDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "plugin">
): void {
	// Create account view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix,
		schema: LixAccountSchema,
		overrideName: "account",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoid(),
		},
	});

	// Create session-specific temp table
	lix.sqlite.exec(`
		-- current account(s)
		-- temp table because current accounts are session
		-- specific and should not be persisted
		CREATE TEMP TABLE IF NOT EXISTS active_account (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
			-- can't use foreign keys in temp tables... :(
		) STRICT;
	`);
}

export function populateAccountRecords(
	lix: Pick<Lix, "sqlite" | "db" | "plugin">
): void {
	const anonymousAccountName = `Anonymous ${humanId({
		capitalize: true,
		adjectiveCount: 0,
		separator: "_",
	})
		// Human ID has two words, remove the last one
		.split("_")[0]!
		// Human ID uses plural, remove the last character to make it singular
		.slice(0, -1)}`;

	// Insert default account
	lix.sqlite.exec(`
		-- default to a new account
		INSERT INTO active_account (id, name) values (nano_id(), '${anonymousAccountName}');
	`);
}

export const LixAccountSchema = {
	"x-lix-key": "lix_account",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixAccountSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixAccount = FromLixSchemaDefinition<typeof LixAccountSchema>;

// Database view type (includes operational columns) - active version only
export type AccountView = {
	id: Generated<string>;
	name: string;
} & StateEntityView;

// Database view type for cross-version operations
export type AccountAllView = {
	id: Generated<string>;
	name: string;
} & StateEntityAllView;

// Kysely operation types
export type Account = Selectable<AccountView>;
export type NewAccount = Insertable<AccountView>;
export type AccountUpdate = Updateable<AccountView>;

// Active account table type (temp table)
export type ActiveAccountTable = {
	id: string;
	name: string;
};

export type ActiveAccount = Selectable<ActiveAccountTable>;
export type NewActiveAccount = Insertable<ActiveAccountTable>;
export type ActiveAccountUpdate = Updateable<ActiveAccountTable>;
