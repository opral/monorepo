import type { Generated, Selectable } from "kysely";
import type { LixEngine } from "../../engine/boot.js";

export type StateWithTombstonesView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: Record<string, any> | null; // null for tombstones
	schema_version: string;
	version_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
	inherited_from_version_id: string | null;
	change_id: Generated<string>;
	untracked: Generated<boolean>;
	commit_id: Generated<string>;
	writer_key: string | null;
	metadata: Generated<Record<string, any> | null>;
};

export type StateWithTombstonesRow = Selectable<StateWithTombstonesView>;

/**
 * Creates a read-only view that exposes tracked deletions as tombstones.
 *
 * This view reads from the materialized state which includes both live rows
 * and deletion tombstones (NULL snapshot_content). It intentionally does NOT
 * filter out tombstones, unlike the state or state_by_version views.
 */
export function applyStateWithTombstonesView(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_with_tombstones AS
    SELECT 
      entity_id,
      schema_key,
      file_id,
      version_id,
      plugin_key,
      snapshot_content,
      schema_version,
      created_at,
      updated_at,
      inherited_from_version_id,
      change_id,
      untracked,
      commit_id,
      writer_key,
      (
        SELECT json(metadata)
        FROM change
        WHERE change.id = lix_internal_state_vtable.change_id
      ) AS metadata
    FROM lix_internal_state_vtable;
  `);
}
