import { LixLogSchema, type LixLog } from "../../log/schema.js";
import { uuidV7Sync } from "../../engine/deterministic/uuid-v7.js";
import { getTimestampSync } from "../../engine/deterministic/timestamp.js";
import type { JSONType } from "../../schema-definition/json-type.js";
import type { LixEngine } from "../../engine/boot.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";

// Track if logging is in progress per Lix instance to prevent recursion
const loggingInProgressMap = new WeakMap<
	Pick<LixEngine, "sqlite" | "db" | "hooks">,
	boolean
>();

/**
 * Insert a log entry directly using insertTransactionState to avoid recursion
 * when logging from within the virtual table methods.
 *
 * This is a minimal wrapper that can be mocked in tests to control timestamps.
 */
export function insertVTableLog(args: {
	engine: Pick<LixEngine, "sqlite" | "db" | "hooks">;
	id?: string;
	key: string;
	message?: string | null;
	payload?: JSONType;
	level: string;
	timestamp?: string;
}): void {
	if (loggingInProgressMap.get(args.engine)) {
		return;
	}

	loggingInProgressMap.set(args.engine, true);
	try {
		const id = args.id ?? uuidV7Sync({ engine: args.engine as any });
		// Insert into transaction state (untracked) to preserve previous behavior.
		// Note: If called outside a vtable write, this may require a later commit to flush.
		insertTransactionState({
			engine: args.engine as any,
			timestamp:
				args.timestamp ?? getTimestampSync({ engine: args.engine as any }),
			data: [
				{
					entity_id: id,
					schema_key: LixLogSchema["x-lix-key"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						id,
						key: args.key,
						message: args.message ?? null,
						payload: args.payload ?? null,
						level: args.level,
					} satisfies LixLog),
					schema_version: LixLogSchema["x-lix-version"],
					version_id: "global",
					untracked: true,
				},
			],
		});
	} finally {
		loggingInProgressMap.set(args.engine, false);
	}
}
