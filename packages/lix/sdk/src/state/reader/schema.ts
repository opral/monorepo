import type { LixEngine } from "../../engine/boot.js";

export function applyInternalStateReaderSchema(args: {
	engine: Pick<LixEngine, "executeSync">;
}): void {
	args.engine.executeSync({
		sql: `CREATE VIEW IF NOT EXISTS lix_internal_state_reader AS SELECT * FROM lix_internal_state_vtable;`,
	});
}
