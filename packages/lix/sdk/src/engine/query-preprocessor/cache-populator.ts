import { populateStateCache } from "../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";
import type { LixEngine } from "../boot.js";
import type { Shape } from "./sql-rewriter/microparser/analyze-shape.js";

export interface CachePopulationArgs {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>;
	shape: Shape;
}

/**
 * Ensures the state cache remains fresh before executing a rewritten query.
 *
 * The cache is repopulated only when marked stale to avoid redundant work. When
 * a literal `versionId` is known we scope the refresh to that ancestry to speed
 * up materialisation for targeted lookups.
 *
 * @example
 * ensureStateCacheFresh({ engine, hints: { versionId: "global" } });
 */
export function ensureFreshStateCache(args: CachePopulationArgs): void {
	if (!isStaleStateCache({ engine: args.engine })) {
		return;
	}

	const versionId =
		args.shape.versionId.kind === "literal"
			? args.shape.versionId.value
			: undefined;

	populateStateCache({
		engine: args.engine,
		options: versionId ? { version_id: versionId } : undefined,
	});

	markStateCacheAsFresh({ engine: args.engine });
}
