import { LixLogSchema, type LixLog } from "../log/schema.js";
import { uuidV7 } from "../deterministic/uuid-v7.js";
import { timestamp, type Lix } from "../index.js";
import { insertTransactionState } from "./transaction/insert-transaction-state.js";

// Track if logging is in progress per Lix instance to prevent recursion
const loggingInProgressMap = new WeakMap<
	Pick<Lix, "sqlite" | "db" | "hooks">,
	boolean
>();

/**
 * Insert a log entry directly using insertTransactionState to avoid recursion
 * when logging from within the virtual table methods.
 *
 * This is a minimal wrapper that can be mocked in tests to control timestamps.
 */
export function insertVTableLog(args: {
	lix: Pick<Lix, "sqlite" | "db" | "hooks">;
	id?: string;
	key: string;
	message: string;
	level: string;
	timestamp?: string;
}): void {
	if (loggingInProgressMap.get(args.lix)) {
		return;
	}

	loggingInProgressMap.set(args.lix, true);
	try {
		const id = args.id ?? uuidV7({ lix: args.lix });
		// Insert into transaction state (untracked) to preserve previous behavior.
		// Note: If called outside a vtable write, this may require a later commit to flush.
		insertTransactionState({
			lix: {
				sqlite: args.lix.sqlite,
				db: args.lix.db,
				hooks: undefined as any,
			},
			timestamp: args.timestamp ?? timestamp({ lix: args.lix }),
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
		loggingInProgressMap.set(args.lix, false);
	}
}
