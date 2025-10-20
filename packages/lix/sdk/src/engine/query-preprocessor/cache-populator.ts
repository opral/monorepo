import { populateStateCache } from "../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../state/cache/create-schema-cache-table.js";
import { getStateCacheTables } from "../../state/cache/schema.js";
import { resolveCacheSchemaDefinition } from "../../state/cache/schema-resolver.js";
import type { LixEngine } from "../boot.js";
import type { Shape } from "./sql-rewriter/microparser/analyze-shape.js";

export interface CachePopulationArgs {
	engine: Pick<
		LixEngine,
		"sqlite" | "hooks" | "runtimeCacheRef" | "executeSync"
	>;
	shape: Shape;
	parameters?: ReadonlyArray<unknown>;
	schemaKeyHints?: readonly string[];
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

		ensureCacheTablesForShape(
			args.engine,
			args.shape,
			args.parameters,
			args.schemaKeyHints
		);

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
		message.includes("no such table: lix_internal_state_vtable") ||
		message.includes("no such module: lix_internal_state_vtable")
	);
}

function ensureCacheTablesForShape(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">,
	shape: Shape,
	parameters?: ReadonlyArray<unknown>,
	schemaKeyHints?: readonly string[]
): void {
	const schemaKeys = new Set<string>();

	for (const entry of shape.schemaKeys) {
		if (entry.kind === "literal") {
			if (entry.value.length > 0) {
				schemaKeys.add(entry.value);
			}
			continue;
		}
		const resolved = resolvePlaceholderValue(entry.token?.image, parameters);
		if (typeof resolved === "string" && resolved.length > 0) {
			schemaKeys.add(resolved);
		}
	}

	if (schemaKeyHints) {
		for (const hint of schemaKeyHints) {
			if (typeof hint === "string" && hint.length > 0) {
				schemaKeys.add(hint);
			}
		}
	}

	if (schemaKeys.size === 0) {
		return;
	}

	const tableCache = getStateCacheTables({ engine });
	for (const schemaKey of schemaKeys) {
		const tableName = schemaKeyToCacheTableName(schemaKey);
		if (tableCache.has(tableName)) {
			continue;
		}
		const schemaDefinition = resolveCacheSchemaDefinition({
			engine,
			schemaKey,
		});
		if (!schemaDefinition) {
			continue;
		}
		const created = createSchemaCacheTable({
			engine,
			schema: schemaDefinition,
		});
		tableCache.add(created);
		if (created !== tableName) {
			tableCache.add(tableName);
		}
	}
}

function resolvePlaceholderValue(
	tokenImage: string | undefined,
	parameters?: ReadonlyArray<unknown>
): unknown {
	if (!tokenImage || !parameters) {
		return undefined;
	}
	if (!tokenImage.startsWith("?")) {
		return undefined;
	}
	const index = Number.parseInt(tokenImage.slice(1), 10);
	if (Number.isNaN(index)) {
		return undefined;
	}
	if (index <= 0 || index > parameters.length) {
		return undefined;
	}
	return parameters[index - 1];
}
