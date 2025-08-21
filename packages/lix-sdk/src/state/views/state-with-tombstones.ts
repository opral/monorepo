import type { Lix } from "../../lix/open-lix.js";

/**
 * Creates a read-only view that exposes tracked tombstones (snapshot_content = null).
 *
 * Note: Initially, this selects from state_all. After the vtable is renamed to
 * internal_state_vtable and full-fidelity rows are exposed there, this view
 * should be updated to select from that vtable (and state_all will continue to
 * filter out tombstones).
 */
export function applyStateWithTombstonesView(lix: Pick<Lix, "sqlite">): void {
  lix.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS state_with_tombstones AS
    SELECT * FROM internal_state_vtable
  `);
}
