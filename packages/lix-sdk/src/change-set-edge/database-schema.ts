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

      FOREIGN KEY(parent_id) REFERENCES change_set(id) ON DELETE CASCADE,
      FOREIGN KEY(child_id) REFERENCES change_set(id) ON DELETE CASCADE,

      -- Prevent self referencing edges
      CHECK (parent_id != child_id)
    ) STRICT;

    -- Trigger to enforce that edges can only connect immutable change sets
    CREATE TRIGGER IF NOT EXISTS enforce_immutable_edge_creation
    BEFORE INSERT ON change_set_edge
    FOR EACH ROW
    WHEN
      (SELECT immutable_elements FROM change_set WHERE id = NEW.parent_id) = 0 OR
      (SELECT immutable_elements FROM change_set WHERE id = NEW.child_id) = 0
    BEGIN
      SELECT RAISE(ABORT, 'Change set edges can only be created between change sets with immutable elements.');
    END;
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
