import type { LixEngine } from "../engine/boot.js";
import { applyMaterializeStateSchema } from "./materialize-state.js";
import { applyResolvedStateView } from "./resolved-state-view.js";
import { applyUntrackedStateSchema } from "./untracked/schema.js";
import { applyStateCacheV2Schema } from "./cache/schema.js";
import { applyStateAllView } from "./views/state-all.js";
import { applyStateWithTombstonesView } from "./views/state-with-tombstones.js";
import { applyStateView } from "./views/state.js";
import { applyStateVTable } from "./vtable/index.js";

export function applyStateDatabaseSchema(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
}): void {
	const { engine } = args;
	applyMaterializeStateSchema({ engine });
	applyStateCacheV2Schema({ engine });
	applyUntrackedStateSchema({ engine });
	applyResolvedStateView({ engine });

	// Apply the virtual table (binds to the in-process engine)
	applyStateVTable(engine);

	// Public views over the internal vtable
	applyStateView({ engine });
	applyStateAllView({ engine });
	applyStateWithTombstonesView({ engine });
}
