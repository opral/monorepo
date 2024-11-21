import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyAccountDatabaseSchema(
	sqlite: SqliteDatabase,
): SqliteDatabase {
	return sqlite.exec`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT NOT NULL
  ) STRICT;

  -- default anonymous account
  INSERT OR IGNORE INTO account (id, name) 
  VALUES ('anonymous', 'anonymous');

  -- current account(s)
  -- temp table because current accounts are session
  -- specific and should not be persisted
  CREATE TEMP TABLE IF NOT EXISTS current_account (
    id TEXT PRIMARY KEY
  
    -- can't use foreign keys in temp tables... :(
  ) STRICT;

  -- default to the anonymous account
  INSERT INTO current_account (id)
  SELECT 'anonymous'
  WHERE NOT EXISTS (SELECT 1 FROM current_account);

`;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;
export type AccountTable = {
	id: Generated<string>;
	name: string;
};

export type CurrentAccount = Selectable<CurrentAccountTable>;
export type NewCurrentAccount = Insertable<CurrentAccountTable>;
export type CurrentAccountUpdate = Updateable<CurrentAccountTable>;
export type CurrentAccountTable = {
	id: string;
};
