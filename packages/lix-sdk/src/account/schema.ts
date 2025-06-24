import type { Selectable } from "kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import { humanId } from "human-id";
import { nanoid } from "../database/nano-id.js";
import { createEntityViewsIfNotExists } from "../entity-views/entity-view-builder.js";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyAccountDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	// Create account view using the generalized entity view builder
	createEntityViewsIfNotExists({
		lix: { sqlite },
		schema: LixAccountSchema,
		overrideName: "account",
		pluginKey: "lix_own_entity",
		hardcodedFileId: "lix",
		defaultValues: {
			id: () => nanoid(),
		},
	});

	// Create session-specific temp table
	sqlite.exec(`
		-- current account(s)
		-- temp table because current accounts are session
		-- specific and should not be persisted
		CREATE TEMP TABLE IF NOT EXISTS active_account (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
			-- can't use foreign keys in temp tables... :(
		) STRICT;
	`);

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
	sqlite.exec(`
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
		id: { type: "string", "x-lix-generated": true },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
} as const;
LixAccountSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type Account = FromLixSchemaDefinition<typeof LixAccountSchema>;

// Active account table type (temp table)
export type ActiveAccountTable = {
	id: string;
	name: string;
};

export type ActiveAccount = Selectable<ActiveAccountTable>;
