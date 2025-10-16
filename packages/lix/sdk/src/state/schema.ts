import type { LixEngine } from "../engine/boot.js";
import { applyMaterializeStateSchema } from "./materialize-state.js";
import { applyUntrackedStateSchema } from "./untracked/schema.js";
import { applyStateCacheSchema } from "./cache/schema.js";
import { applyStateAllView } from "./views/state-all.js";
import { applyStateWithTombstonesView } from "./views/state-with-tombstones.js";
import { applyStateView } from "./views/state.js";
import { applyStateVTable } from "./vtable/vtable.js";

export function applyStateDatabaseSchema(args: {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "preprocessQuery"
	>;
}): void {
	const { engine } = args;
	applyMaterializeStateSchema({ engine });
	applyStateCacheSchema({ engine });
	applyUntrackedStateSchema({ engine });

	// Writer metadata table: stores last writer per (file, version, entity, schema).
	// No NULL storage policy: absence of row = unknown writer.
	engine.sqlite.exec(`
	  CREATE TABLE IF NOT EXISTS lix_internal_state_writer (
	    file_id    TEXT NOT NULL,
	    version_id TEXT NOT NULL,
	    entity_id  TEXT NOT NULL,
	    schema_key TEXT NOT NULL,
	    writer_key TEXT NULL,
	    PRIMARY KEY (file_id, version_id, entity_id, schema_key)
	  ) WITHOUT ROWID;

	  CREATE INDEX IF NOT EXISTS idx_lix_internal_state_writer_fvw
	    ON lix_internal_state_writer(file_id, version_id, writer_key);
	`);

	// Apply the virtual table (binds to the in-process engine)
	applyStateVTable(engine);

	// Public views over the internal vtable
	applyStateView({ engine });
	applyStateAllView({ engine });
	applyStateWithTombstonesView({ engine });
}
