import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyChangeSetEdgeDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS change_set_edge (
    parent_id TEXT NOT NULL,
    child_id TEXT NOT NULL,

    PRIMARY KEY (parent_id, child_id),

    FOREIGN KEY(parent_id) REFERENCES change_set(id),
    FOREIGN KEY(child_id) REFERENCES change_set(id),

		-- Prevent self referencing edges
		CHECK (parent_id != child_id)
  ) STRICT;
`;

	return sqlite.exec(sql);
}

export type ChangeSetEdge = Selectable<ChangeSetEdgeTable>;
export type NewChangeSetEdge = Insertable<ChangeSetEdgeTable>;
export type ChangeSetEdgeUpdate = Updateable<ChangeSetEdgeTable>;
export type ChangeSetEdgeTable = {
	parent_id: string;
	child_id: string;
};
