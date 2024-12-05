import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyAccountDatabaseSchema(
	sqlite: SqliteDatabase
): SqliteDatabase {
	return sqlite.exec`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT NOT NULL
  ) STRICT;

  -- default anonymous account
  -- INSERT OR IGNORE INTO account (id, name) 
  -- VALUES ('anonymous', 'anonymous');

  -- current account(s)
  -- temp table because current accounts are session
  -- specific and should not be persisted
  CREATE TEMP TABLE IF NOT EXISTS active_account (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
    -- can't use foreign keys in temp tables... :(
  ) STRICT;

  -- default to the anonymous account
  INSERT INTO active_account (id, name) values ('anonymous_' || uuid_v7(), 'anonymous');
  
`;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;
export type AccountTable = {
	id: Generated<string>;
	name: string;
};

export type ActiveAccount = Selectable<ActiveAccountTable>;
export type NewActiveAccount = Insertable<ActiveAccountTable>;
export type ActiveAccountUpdate = Updateable<ActiveAccountTable>;
export type ActiveAccountTable = {
	id: string;
	name: string;
};
