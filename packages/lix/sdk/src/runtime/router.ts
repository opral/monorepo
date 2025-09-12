import type { LixRuntime } from "./boot.js";
import { uuidV7Sync } from "./deterministic/index.js";

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
	const routes = new Map<string, (payload?: unknown) => unknown>([
		["lix_uuid_v7", () => uuidV7Sync({ runtime: args.runtime })],
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
