import type { LixRuntime } from "./boot.js";
import {
	uuidV7Sync,
	nanoIdSync,
	getTimestampSync,
	humanIdSync,
	randomSync,
	nextSequenceNumberSync,
} from "./deterministic/index.js";
import { transitionSync } from "../state/transition.js";
import { commitDeterministicRngState } from "./deterministic/random.js";
import { commitSequenceNumberSync } from "./deterministic/sequence.js";
import { updateStateCache } from "../state/cache/update-state-cache.js";
import { markStateCacheAsFresh } from "../state/cache/mark-state-cache-as-stale.js";
import { createCheckpointSync } from "../state/create-checkpoint.js";

/**
 * Creates a runtime function router bound to a specific Lix context.
 *
 * The router provides a single `call(name, payload?)` entrypoint that invokes
 * built‑in runtime functions next to the database engine, regardless of whether
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

export function createRuntimeRouter(args: { runtime: LixRuntime }): {
	call: Call;
} {
	// Local table of built‑ins. Handlers may be synchronous; results are wrapped
	// in a Promise by `callFn` for a unified async surface.
	const routes = new Map<
		string,
		(payload?: unknown) => unknown | Promise<unknown>
	>([
		["lix_uuid_v7", () => uuidV7Sync({ runtime: args.runtime })],
		[
			"lix_nano_id",
			(payload) => nanoIdSync({ runtime: args.runtime, ...(payload ?? {}) }),
		],
		["lix_timestamp", () => getTimestampSync({ runtime: args.runtime })],
		[
			"lix_human_id",
			(payload) => humanIdSync({ runtime: args.runtime, ...(payload ?? {}) }),
		],
		["lix_random", () => randomSync({ runtime: args.runtime })],
		[
			"lix_next_sequence_number",
			() => nextSequenceNumberSync({ runtime: args.runtime }),
		],
		[
			"lix_transition",
			async (payload) => {
				const p = (payload ?? {}) as {
					to: { id: string };
					version?: { id: string };
				};
				return transitionSync({
					runtime: args.runtime,
					to: p.to,
					version: p.version,
				});
			},
		],
		[
			"lix_commit_deterministic_rng_state",
			(payload) =>
				commitDeterministicRngState({
					runtime: args.runtime,
					...(payload as any),
				}),
		],
		[
			"lix_commit_sequence_number",
			(payload) =>
				commitSequenceNumberSync({
					runtime: args.runtime,
					...(payload as any),
				}),
		],
		[
			"lix_update_state_cache",
			(payload) =>
				updateStateCache({
					runtime: args.runtime,
					...(payload as any),
				}),
		],
		[
			"lix_mark_state_cache_as_fresh",
			() => markStateCacheAsFresh({ runtime: args.runtime }),
		],
		[
			"lix_create_checkpoint",
			async () => createCheckpointSync({ runtime: args.runtime }),
		],
	]);

	return {
		call: async (name, payload) => {
			const handler = routes.get(name);
			if (!handler) {
				const err: any = new Error(`Unknown runtime function: ${name}`);
				err.code = "LIX_RPC_UNKNOWN_ROUTE";
				throw err;
			}
			try {
				return Promise.resolve(handler(payload));
			} catch (e) {
				throw e;
			}
		},
	};
}
