import type { LixEngine } from "../boot.js";
import { commitDeterministicRngState, randomSync } from "./random.js";
import {
	commitSequenceNumberSync,
	nextSequenceNumberSync,
} from "./sequence.js";
import { updateStateCache } from "../../state/cache/update-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";
import { uuidV7Sync } from "./uuid-v7.js";
import { nanoIdSync } from "./nano-id.js";
import { getTimestampSync } from "./timestamp.js";
import { humanIdSync } from "./generate-human-id.js";
import { createExplainQuery } from "../explain-query.js";

/**
 * Creates an engine function router bound to a specific Lix context.
 *
 * The router provides a single `call(name, payload?)` entrypoint that invokes
 * built‑in engine functions next to the database engine, regardless of whether
 * the engine runs on the main thread or in a Worker.
 *
 * Functions are identified by stable string names (e.g. `"lix_uuid_v7"`).
 * Unknown names reject with an error carrying `code = "LIX_RPC_UNKNOWN_ROUTE"`.
 */
export type Call = (
	name: string,
	payload?: unknown,
	opts?: { signal?: AbortSignal }
) => Promise<unknown>;

export function createCallRouter(args: {
	engine: Pick<
		LixEngine,
		| "hooks"
		| "executeSync"
		| "executeQuerySync"
		| "runtimeCacheRef"
		| "call"
		| "sqlite"
	>;
}): {
	call: Call;
} {
	const explainQuery = createExplainQuery({ engine: args.engine });
	// Local table of built‑ins. Handlers may be synchronous; results are wrapped
	// in a Promise by `callFn` for a unified async surface.
	const routes = new Map<
		string,
		(payload?: unknown) => unknown | Promise<unknown>
	>([
		["lix_uuid_v7", () => uuidV7Sync({ engine: args.engine })],
		[
			"lix_nano_id",
			(payload) => nanoIdSync({ engine: args.engine, ...(payload ?? {}) }),
		],
		["lix_timestamp", () => getTimestampSync({ engine: args.engine })],
		[
			"lix_human_id",
			(payload) => humanIdSync({ engine: args.engine, ...(payload ?? {}) }),
		],
		["lix_random", () => randomSync({ engine: args.engine })],
		[
			"lix_next_sequence_number",
			() => nextSequenceNumberSync({ engine: args.engine }),
		],
		[
			"lix_commit_deterministic_rng_state",
			(payload) =>
				commitDeterministicRngState({
					engine: args.engine,
					...(payload as any),
				}),
		],
		[
			"lix_commit_sequence_number",
			(payload) =>
				commitSequenceNumberSync({
					engine: args.engine,
					...(payload as any),
				}),
		],
		[
			"lix_update_state_cache",
			(payload) =>
				updateStateCache({
					engine: args.engine,
					...(payload as any),
				}),
		],
		[
			"lix_mark_state_cache_as_fresh",
			() => markStateCacheAsFresh({ engine: args.engine }),
		],
		[
			"lix_execute_query_sync",
			(payload) => {
				return args.engine.executeQuerySync(payload as any);
			},
		],
		["lix_explain_query", explainQuery as any],
	]);

	return {
		call: async (name, payload) => {
			const handler = routes.get(name);
			if (!handler) {
				const err: any = new Error(`Unknown engine function: ${name}`);
				err.code = "LIX_RPC_UNKNOWN_ROUTE";
				throw err;
			}
			return Promise.resolve(handler(payload));
		},
	};
}
