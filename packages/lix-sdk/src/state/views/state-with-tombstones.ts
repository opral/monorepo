import type { Lix } from "../../lix/open-lix.js";

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
export function applyStateWithTombstonesView(lix: Pick<Lix, "sqlite">): void {
  lix.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_with_tombstones AS
    SELECT * FROM internal_state_vtable;
  `);
}
