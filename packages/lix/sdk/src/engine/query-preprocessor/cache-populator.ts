import { populateStateCacheV2 } from "../../state/cache-v2/populate-state-cache.js";
import { isStaleStateCacheV2 } from "../../state/cache-v2/is-stale-state-cache.js";
import { markStateCacheAsFreshV2 } from "../../state/cache-v2/mark-state-cache-as-stale.js";
import {
	createSchemaCacheTableV2,
	getSchemaVersion,
	schemaKeyToCacheTableNameV2,
} from "../../state/cache-v2/create-schema-cache-table.js";
import { getStateCacheV2Tables } from "../../state/cache-v2/schema.js";
import { getStoredSchema } from "../../stored-schema/get-stored-schema.js";
import type { LixEngine } from "../boot.js";
import type { Shape } from "./sql-rewriter/microparser/analyze-shape.js";

export interface CachePopulationArgs {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>;
	shape: Shape;
}

// Prevent re-entrancy when the stale-flag probe performs its own state_all read.
// Without this guard, ensureFreshStateCache → isStaleStateCache → SELECT state_all
// would recurse into ensureFreshStateCache again and loop forever.
const guardDepth = new WeakMap<object, number>();

function enterGuard(token: object): boolean {
	const depth = guardDepth.get(token) ?? 0;
	guardDepth.set(token, depth + 1);
	return depth === 0;
}

function exitGuard(token: object): void {
	const depth = guardDepth.get(token);
	if (depth === undefined) {
		return;
	}
	if (depth <= 1) {
		guardDepth.delete(token);
		return;
	}
	guardDepth.set(token, depth - 1);
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
	const token = args.engine.runtimeCacheRef;
	if (!enterGuard(token)) {
		exitGuard(token);
		return;
	}
	try {
		if (!hasInternalStateVtable(args.engine)) {
			return;
		}

		ensureCacheTablesForShape(args.engine, args.shape);

		const needsRefresh = safeIsStaleStateCache(args.engine);
		if (!needsRefresh) {
			return;
		}

		const versionId =
			args.shape.versionId.kind === "literal"
				? args.shape.versionId.value
				: undefined;

		safePopulateStateCache(args.engine, versionId);
	} finally {
		exitGuard(token);
	}
}

function hasInternalStateVtable(
	engine: Pick<LixEngine, "sqlite" | "runtimeCacheRef">
): boolean {
	try {
		const result = engine.sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'lix_internal_state_vtable'`,
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
		return isStaleStateCacheV2({ engine });
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
		populateStateCacheV2({
			engine,
			options: versionId ? { version_id: versionId } : undefined,
		});
		markStateCacheAsFreshV2({ engine });
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
		message.includes("no such table: lix_internal_state_vtable") ||
		message.includes("no such module: lix_internal_state_vtable")
	);
}

function ensureCacheTablesForShape(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">,
	shape: Shape
): void {
	const literalSchemaKeys = Array.from(
		new Set(
			shape.schemaKeys
				.filter((entry) => entry.kind === "literal")
				.map((entry) => entry.value)
		)
	);

	if (literalSchemaKeys.length === 0) {
		return;
	}

	const tableCache = getStateCacheV2Tables({ engine });
	for (const schemaKey of literalSchemaKeys) {
		const schemaDefinition = getStoredSchema({ engine, key: schemaKey });
		if (!schemaDefinition) {
			continue;
		}

		const schemaVersion = getSchemaVersion(schemaDefinition);
		const tableName = schemaKeyToCacheTableNameV2(schemaKey, schemaVersion);
		if (tableCache.has(tableName)) {
			continue;
		}

		createSchemaCacheTableV2({
			engine,
			schema: schemaDefinition,
		});
		tableCache.add(tableName);
	}
}
