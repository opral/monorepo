import type { LixEngine } from "../../engine/boot.js";

export function applyInternalStateReaderSchema(args: {
	engine: Pick<LixEngine, "executeSync">;
}): void {
	args.engine.executeSync({
		sql: `CREATE VIEW IF NOT EXISTS internal_state_reader AS SELECT * FROM internal_state_vtable;`,
	});
}
