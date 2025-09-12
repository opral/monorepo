import { LixLogSchema, type LixLog } from "../../log/schema.js";
import { uuidV7Sync } from "../../runtime/deterministic/uuid-v7.js";
import { getTimestampSync } from "../../runtime/deterministic/timestamp.js";
import type { LixRuntime } from "../../runtime/boot.js";
import { insertTransactionState } from "../transaction/insert-transaction-state.js";

// Track if logging is in progress per Lix instance to prevent recursion
const loggingInProgressMap = new WeakMap<
	Pick<LixRuntime, "sqlite" | "db" | "hooks">,
	boolean
>();

/**
 * Insert a log entry directly using insertTransactionState to avoid recursion
 * when logging from within the virtual table methods.
 *
 * This is a minimal wrapper that can be mocked in tests to control timestamps.
 */
export function insertVTableLog(args: {
	runtime: Pick<LixRuntime, "sqlite" | "db" | "hooks">;
	id?: string;
	key: string;
	message: string;
	level: string;
	timestamp?: string;
}): void {
	if (loggingInProgressMap.get(args.runtime)) {
		return;
	}

	loggingInProgressMap.set(args.runtime, true);
	try {
		const id = args.id ?? uuidV7Sync({ runtime: args.runtime as any });
		// Insert into transaction state (untracked) to preserve previous behavior.
		// Note: If called outside a vtable write, this may require a later commit to flush.
		insertTransactionState({
			runtime: args.runtime as any,
			timestamp:
				args.timestamp ?? getTimestampSync({ runtime: args.runtime as any }),
			data: [
				{
					entity_id: id,
					schema_key: LixLogSchema["x-lix-key"],
					file_id: "lix",
					plugin_key: "lix_own_entity",
					snapshot_content: JSON.stringify({
						id,
						key: args.key,
						message: args.message,
						level: args.level,
					} satisfies LixLog),
					schema_version: LixLogSchema["x-lix-version"],
					version_id: "global",
					untracked: true,
				},
			],
		});
	} finally {
		loggingInProgressMap.set(args.runtime, false);
	}
}
