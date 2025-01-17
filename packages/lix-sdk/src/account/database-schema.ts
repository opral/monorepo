import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { humanId } from "human-id";

export function applyAccountDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const anonymousAccountName = `Anonymous ${humanId({
		capitalize: true,
		adjectiveCount: 0,
		separator: "_",
	})
		// Human ID has two words, remove the last one
		.split("_")[0]!
		// Human ID uses plural, remove the last character to make it singular
		.slice(0, -1)}`;

	const sql = `
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    name TEXT NOT NULL
  ) STRICT;

  -- current account(s)
  -- temp table because current accounts are session
  -- specific and should not be persisted
  CREATE TEMP TABLE IF NOT EXISTS active_account (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
    -- can't use foreign keys in temp tables... :(
  ) STRICT;

  -- default to a new account
  INSERT INTO active_account (id, name) values (uuid_v7(), '${anonymousAccountName}');
`;

	return sqlite.exec(sql);
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
