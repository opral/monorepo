import type { Lix } from "../lix/open-lix.js";
import { applyMaterializeStateSchema } from "./materialize-state.js";
import { applyResolvedStateView } from "./resolved-state-view.js";
import { applyUntrackedStateSchema } from "./untracked/schema.js";
import { applyStateCacheV2Schema } from "./cache/schema.js";
import { applyStateAllView } from "./views/state-all.js";
import { applyStateWithTombstonesView } from "./views/state-with-tombstones.js";
import { applyStateView } from "./views/state.js";
import { applyStateVTable } from "./vtable/index.js";

export function applyStateDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	applyMaterializeStateSchema(lix);
	applyStateCacheV2Schema(lix);
	applyUntrackedStateSchema(lix);
	applyResolvedStateView(lix);

	// Writer metadata table: stores last writer per (file, version, entity, schema).
	// No NULL storage policy: absence of row = unknown writer.
	lix.sqlite.exec(`
	  CREATE TABLE IF NOT EXISTS internal_state_writer (
	    file_id    TEXT NOT NULL,
	    version_id TEXT NOT NULL,
	    entity_id  TEXT NOT NULL,
	    schema_key TEXT NOT NULL,
	    writer_key TEXT NULL,
	    PRIMARY KEY (file_id, version_id, entity_id, schema_key)
	  ) WITHOUT ROWID;

	  CREATE INDEX IF NOT EXISTS idx_internal_state_writer_fvw
	    ON internal_state_writer(file_id, version_id, writer_key);
	`);

	// Apply the virtual table
	applyStateVTable(lix);

	// Public views over the internal vtable
	applyStateView(lix);
	applyStateAllView(lix);
	applyStateWithTombstonesView(lix);
}
