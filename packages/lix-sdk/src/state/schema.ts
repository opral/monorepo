import type { Lix } from "../lix/open-lix.js";
import { applyMaterializeStateSchema } from "./materialize-state.js";
import { applyResolvedStateView } from "./resolved-state-view.js";
import { applyUntrackedStateSchema } from "./untracked/schema.js";
import { applyStateCacheV2Schema } from "./cache/schema.js";
import { applyStateAllView } from "./views/state-all.js";
import { applyStateWithTombstonesView } from "./views/state-with-tombstones.js";
import { applyStateView } from "./views/state.js";
import { applyStateVTable } from "./vtable.js";

export function applyStateDatabaseSchema(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	applyMaterializeStateSchema(lix);
	applyStateCacheV2Schema(lix);
	applyUntrackedStateSchema(lix);
	applyResolvedStateView(lix);

	// Apply the virtual table
	applyStateVTable(lix);

	// Public views over the internal vtable
	applyStateView(lix);
	applyStateAllView(lix);
	applyStateWithTombstonesView(lix);
}
