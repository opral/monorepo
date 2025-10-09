import type { FunctionRegistryPublicApi } from "./function-registry.js";
import { uuidV7Sync } from "./uuid-v7.js";
import { nanoIdSync } from "./nano-id.js";
import { getTimestampSync } from "./timestamp.js";
import { humanIdSync } from "./generate-human-id.js";
import { randomSync, commitDeterministicRngState } from "./random.js";
import {
	commitSequenceNumberSync,
	nextSequenceNumberSync,
} from "./sequence.js";
import { updateStateCache } from "../../state/cache/update-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";
import type { LixEngine } from "../boot.js";
import { createExplainQuery } from "../explain-query.js";

type RegisterBuiltinArgs = {
	registry: FunctionRegistryPublicApi;
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "executeSync" | "runtimeCacheRef" | "call" | "preprocessQuery" | "fn"
	>;
};

export function registerBuiltinFunctions({ registry, engine }: RegisterBuiltinArgs): void {
	const explain = createExplainQuery({ engine });

	registry.register({
		name: "lix_uuid_v7",
		handler: (ctx) => uuidV7Sync({ engine: ctx.engine }),
	});

	registry.register({
		name: "lix_nano_id",
		handler: (ctx, args) => nanoIdSync({ engine: ctx.engine, length: args?.length })

	});


	registry.register({
		name: "lix_timestamp",
		handler: (ctx) => getTimestampSync({ engine: ctx.engine }),
	});

	registry.register({
		name: "lix_human_id",
		handler: (ctx, args) => {

			return humanIdSync({
				engine: ctx.engine as any,
				...args,
			});
		},
	});

	registry.register({
		name: "lix_random",
		handler: (ctx) => randomSync({ engine: ctx.engine }),
	});

	registry.register({
		name: "lix_next_sequence_number",
		handler: (ctx) => nextSequenceNumberSync({ engine: ctx.engine }),
	});

	registry.register({
		name: "lix_commit_deterministic_rng_state",
		handler: (ctx, args) => {
			commitDeterministicRngState({
				engine: ctx.engine,
				...(args as any),
			});
			return null;
		},
	});

	registry.register({
		name: "lix_commit_sequence_number",
		handler: (ctx, args) => {
			commitSequenceNumberSync({
				engine: ctx.engine,
				...(args as any),
			});
			return null;
		},
	});

	registry.register({
		name: "lix_update_state_cache",
		handler: (ctx, args) => {
			updateStateCache({
				engine: ctx.engine,
				...(args as any),
			});
			return null;
		},
	});

	registry.register({
		name: "lix_mark_state_cache_as_fresh",
		handler: (ctx) => {
			markStateCacheAsFresh({ engine: ctx.engine });
			return null;
		},
	});

	registry.register({
		name: "lix_execute_sync",
		handler: (ctx, args) => ctx.engine.executeSync(args as any),
	});

	registry.register({
		name: "lix_explain_query",
		handler: (_ctx, args) => explain({ query: (args ?? {}) as any }),
	});
}
