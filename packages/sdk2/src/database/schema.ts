import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";
import { Declaration, Expression, Pattern } from "../json-schema/pattern.js";

export function applySchema(args: { sqlite: SqliteDatabase }) {
	const foreignKeys: any = args.sqlite.exec("PRAGMA foreign_keys");
	if (foreignKeys["foreign_keys"] === 0) {
		args.sqlite.exec("PRAGMA foreign_keys = ON");
	}

	args.sqlite.exec(`
CREATE TABLE IF NOT EXISTS bundle (
  id TEXT PRIMARY KEY DEFAULT (human_id()),
  alias BLOB NOT NULL DEFAULT (jsonb('{}'))
) strict;

CREATE TABLE IF NOT EXISTS message (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  bundle_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  declarations BLOB NOT NULL DEFAULT (jsonb('[]')),
  selectors BLOB NOT NULL DEFAULT (jsonb('[]')),
  FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE
) strict;

CREATE TABLE IF NOT EXISTS variant (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  message_id TEXT NOT NULL,
  match BLOB NOT NULL DEFAULT (jsonb('{}')),
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
	alias: Generated<Record<string, string>>;
};

type MessageTable = {
	id: Generated<string>;
	bundleId: Generated<string>;
	locale: string;
	declarations: Generated<Array<Declaration>>;
	selectors: Generated<Array<Expression>>;
};

type VariantTable = {
	id: Generated<string>;
	messageId: string;
	
	match: Generated<Record<string, string>>;
	pattern: Generated<Pattern>;
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
