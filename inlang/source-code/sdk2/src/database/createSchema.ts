import { sql, type Kysely } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export async function createSchema(args: {
	db: Kysely<any>;
	sqlite: SqliteDatabase;
}) {
	return sql`
CREATE TABLE bundle (
  id TEXT PRIMARY KEY DEFAULT (bundle_id()),
  alias TEXT NOT NULL
);

CREATE TABLE message (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  bundle_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  declarations TEXT NOT NULL,
  selectors TEXT NOT NULL
);

CREATE TABLE variant (
  id TEXT PRIMARY KEY DEFAULT (uuid_v4()), 
  message_id TEXT NOT NULL,
  match TEXT NOT NULL,
  pattern TEXT NOT NULL
);
  
CREATE INDEX idx_message_bundle_id ON message (bundle_id);
CREATE INDEX idx_variant_message_id ON variant (message_id);

`.execute(args.db);
}
