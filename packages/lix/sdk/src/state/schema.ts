import type { Lix } from "../lix/open-lix.js";
import type { LixRuntime } from "../runtime/boot.js";
import { applyMaterializeStateSchema } from "./materialize-state.js";
import { applyResolvedStateView } from "./resolved-state-view.js";
import { applyUntrackedStateSchema } from "./untracked/schema.js";
import { applyStateCacheV2Schema } from "./cache/schema.js";
import { applyStateAllView } from "./views/state-all.js";
import { applyStateWithTombstonesView } from "./views/state-with-tombstones.js";
import { applyStateView } from "./views/state.js";
import { applyStateVTable } from "./vtable/index.js";

export function applyStateDatabaseSchema(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db" | "hooks">;
}): void {
	const { runtime } = args;
	applyMaterializeStateSchema({ runtime });
	applyStateCacheV2Schema({ runtime });
	applyUntrackedStateSchema({ runtime });
	applyResolvedStateView({ runtime });

	// Apply the virtual table (requires a Lix-like object)
	const lix = {
		sqlite: runtime.sqlite,
		db: runtime.db,
		hooks: runtime.hooks,
	} as unknown as Pick<Lix, "sqlite" | "db" | "hooks">;
	applyStateVTable(lix);

	// Public views over the internal vtable
	applyStateView({ runtime });
	applyStateAllView({ runtime });
	applyStateWithTombstonesView({ runtime });
}
