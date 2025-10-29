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
 * filter out tombstones, unlike the resolved-state or public state_all views.
 *
 * We restrict to non-inherited rows (inherited_from_version_id IS NULL) so that
 * each version only reports its own direct state or tombstones.
 */
export function applyStateWithTombstonesView(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_with_tombstones AS
    SELECT 
      v.entity_id,
      v.schema_key,
      v.file_id,
      v.version_id,
      v.plugin_key,
      v.snapshot_content,
      v.schema_version,
      v.created_at,
      v.updated_at,
      v.inherited_from_version_id,
      v.change_id,
      v.untracked,
      v.commit_id,
      v.writer_key,
      (
        SELECT json(metadata)
        FROM change
        WHERE change.id = v.change_id
      ) AS metadata
    FROM lix_internal_state_vtable AS v;
  `);
}
