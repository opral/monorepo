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
	if (!hasInternalStateVtable(args.engine)) {
		return;
	}

	const needsRefresh = safeIsStaleStateCache(args.engine);
	if (!needsRefresh) {
		return;
	}

	const versionId =
		args.shape.versionId.kind === "literal"
			? args.shape.versionId.value
			: undefined;

	safePopulateStateCache(args.engine, versionId);
}

function hasInternalStateVtable(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): boolean {
	try {
		const result = engine.sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'internal_state_vtable'`,
			returnValue: "resultRows",
			rowMode: "array",
		});
		return Array.isArray(result) && result.length > 0;
	} catch (error) {
		return false;
	}
}

function safeIsStaleStateCache(
	engine: Pick<LixEngine, "executeSync" | "hooks">
): boolean {
	try {
		return isStaleStateCache({ engine });
	} catch (error) {
		if (isMissingInternalStateVtableError(error)) {
			return false;
		}
		throw error;
	}
}

function safePopulateStateCache(
	engine: Pick<
		LixEngine,
		"sqlite" | "runtimeCacheRef" | "executeSync" | "hooks"
	>,
	versionId: string | undefined
): void {
	try {
		populateStateCache({
			engine,
			options: versionId ? { version_id: versionId } : undefined,
		});
		markStateCacheAsFresh({ engine });
	} catch (error) {
		if (isMissingInternalStateVtableError(error)) {
			return;
		}
		throw error;
	}
}

function isMissingInternalStateVtableError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	const message = String((error as any).message ?? "");
	return (
		message.includes("no such table: internal_state_vtable") ||
		message.includes("no such module: internal_state_vtable")
	);
}
