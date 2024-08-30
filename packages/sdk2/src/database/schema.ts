import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";
import { Declaration, Expression, Pattern } from "../json-schema/pattern.js";

export async function createSchema(args: { sqlite: SqliteDatabase }) {
	args.sqlite.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE bundle (
  id TEXT PRIMARY KEY DEFAULT (human_id()),
  alias TEXT NOT NULL DEFAULT '{}'
) strict;

CREATE TABLE message (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  bundle_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  declarations TEXT NOT NULL DEFAULT '[]',
  selectors TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (bundle_id) REFERENCES bundle(id) ON DELETE CASCADE
) strict;

CREATE TABLE variant (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  message_id TEXT NOT NULL,
  match TEXT NOT NULL DEFAULT '{}',
  pattern TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (message_id) REFERENCES message(id) ON DELETE CASCADE
) strict;
  
CREATE INDEX idx_message_bundle_id ON message (bundle_id);
CREATE INDEX idx_variant_message_id ON variant (message_id);
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
	bundleId: string;
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
export type NewVariant = Selectable<VariantTable>;
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
