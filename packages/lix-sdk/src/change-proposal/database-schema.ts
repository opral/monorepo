import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyChangeProposalDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS change_proposal (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),

    change_set_id TEXT NOT NULL,
    source_change_set_id TEXT,
    target_change_set_id  TEXT,

    FOREIGN KEY(change_set_id) REFERENCES change_set(id),
    FOREIGN KEY(source_change_set_id) REFERENCES change_set(id),
    FOREIGN KEY(target_change_set_id) REFERENCES change_set(id)
  ) STRICT;
`;

	return sqlite.exec(sql);
}

export type ChangeProposal = Selectable<ChangeProposalTable>;
export type NewChangeProposal = Insertable<ChangeProposalTable>;
export type ChangeProposalUpdate = Updateable<ChangeProposalTable>;
export type ChangeProposalTable = {
	id: Generated<string>;
	change_set_id: string;
	source_change_set_id: string | null;
	target_change_set_id: string | null;
};
