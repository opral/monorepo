import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import {
	Declaration,
	Pattern,
	VariableReference,
} from "../json-schema/pattern.js";

export function applySchema(args: { sqlite: SqliteWasmDatabase }) {
	const foreignKeyActivated: any = args.sqlite.exec("PRAGMA foreign_keys", {
		returnValue: "resultRows",
	});
	if (
		// first row that is returned
		// first column of the first row
		// is equal to 0, then foreign keys are disabled
		foreignKeyActivated[0][0] === 0
	) {
		args.sqlite.exec("PRAGMA foreign_keys = ON", {
			returnValue: "resultRows",
		});
	}

	args.sqlite.exec(`
CREATE TABLE IF NOT EXISTS bundle (
  id TEXT PRIMARY KEY DEFAULT (human_id()),
	declarations BLOB NOT NULL DEFAULT (jsonb('[]'))
) strict;

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY DEFAULT (uuid_v7()), 
  bundle_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  selectors BLOB NOT NULL DEFAULT (jsonb('[]')),
  FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE
) strict;


CREATE TABLE IF NOT EXISTS variant (
  id TEXT PRIMARY KEY DEFAULT (uuid_v7()), 
  message_id TEXT NOT NULL,
  matches BLOB NOT NULL DEFAULT (jsonb('[]')),
  pattern BLOB NOT NULL DEFAULT (jsonb('[]')),
  FOREIGN KEY (message_id) REFERENCES message(id) ON DELETE CASCADE
) strict;
  
CREATE INDEX IF NOT EXISTS idx_message_bundle_id ON message (bundle_id);
CREATE INDEX IF NOT EXISTS idx_variant_message_id ON variant (message_id);
		`);
}

export type InlangDatabaseSchema = {
	bundle: BundleTable;
	message: MessageTable;
	variant: VariantTable;
};

type BundleTable = {
	id: Generated<string>;
	declarations: Generated<Array<Declaration>>;
};

type MessageTable = {
	id: Generated<string>;
	bundleId: string;
	locale: string;
	selectors: Generated<Array<VariableReference>>;
};

type VariantTable = {
	id: Generated<string>;
	messageId: string;
	matches: Generated<Array<Match>>;
	pattern: Generated<Pattern>;
};

/**
 * A match is a variable reference that is either a literal or a catch-all.
 *
 * https://github.com/opral/inlang-sdk/issues/205
 *
 * @example
 *   match = { type: "match", name: "gender", value: { type: "literal", value: "male"  }}
 */
export type Match = LiteralMatch | CatchAllMatch;

export type LiteralMatch = {
	type: "literal-match";
	key: VariableReference["name"];
	value: string;
};
export type CatchAllMatch = {
	type: "catchall-match";
	key: VariableReference["name"];
};

export type Bundle = Selectable<BundleTable>;
export type NewBundle = Insertable<BundleTable>;
export type BundleUpdate = Updateable<BundleTable>;

export type Message = Selectable<MessageTable>;
export type NewMessage = Insertable<MessageTable>;
export type MessageUpdate = Updateable<MessageTable>;

export type Variant = Selectable<VariantTable>;
export type NewVariant = Insertable<VariantTable>;
export type VariantUpdate = Updateable<VariantTable>;

export type MessageNested = Message & {
	variants: Variant[];
};
export type NewMessageNested = NewMessage & {
	variants: NewVariant[];
};
export type MessageNestedUpdate = Updateable<MessageTable> & {
	variants: VariantUpdate[];
};

export type BundleNested = Bundle & {
	messages: MessageNested[];
};
export type NewBundleNested = NewBundle & {
	messages: NewMessageNested[];
};
export type BundleNestedUpdate = BundleUpdate & {
	messages: MessageNestedUpdate[];
};
