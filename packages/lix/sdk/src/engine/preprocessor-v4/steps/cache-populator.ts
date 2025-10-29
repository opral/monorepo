import { populateStateCache } from "../../../state/cache/populate-state-cache.js";
import { isStaleStateCache } from "../../../state/cache/is-stale-state-cache.js";
import { markStateCacheAsFresh } from "../../../state/cache/mark-state-cache-as-stale.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "../../../state/cache/create-schema-cache-table.js";
import { getStateCacheTables } from "../../../state/cache/schema.js";
import { resolveCacheSchemaDefinition } from "../../../state/cache/schema-resolver.js";
import type { PreprocessorStep } from "../types.js";

const guardDepth = new WeakMap<object, number>();

const VERSION_DESCRIPTOR_SCHEMA_KEY = "lix_version_descriptor";

const enterGuard = (token: object): boolean => {
	const depth = guardDepth.get(token) ?? 0;
	guardDepth.set(token, depth + 1);
	return depth === 0;
};

const exitGuard = (token: object): void => {
	const depth = guardDepth.get(token);
	if (depth === undefined) {
		return;
	}
	if (depth <= 1) {
		guardDepth.delete(token);
		return;
	}
	guardDepth.set(token, depth - 1);
};

const hasInternalStateVtable = (
	engine: Pick<
		Parameters<typeof populateStateCache>[0]["engine"],
		"sqlite" | "runtimeCacheRef"
	>
): boolean => {
	try {
		const result = engine.sqlite.exec({
			sql: `SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = 'lix_internal_state_vtable'`,
			returnValue: "resultRows",
			rowMode: "array",
		});
		return Array.isArray(result) && result.length > 0;
	} catch {
		return false;
	}
};

const safeIsStaleStateCache = (
	engine: Pick<Parameters<typeof isStaleStateCache>[0]["engine"], "executeSync" | "hooks">
): boolean => {
	try {
		return isStaleStateCache({ engine });
	} catch (error) {
		if (isMissingInternalStateVtableError(error)) {
			return false;
		}
		throw error;
	}
};

const safePopulateStateCache = (
	engine: Parameters<typeof populateStateCache>[0]["engine"],
	versionId: string | undefined
): void => {
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
};

const ensureCacheTables = (
	engine: Pick<Parameters<typeof populateStateCache>[0]["engine"], "executeSync" | "runtimeCacheRef" | "hooks"> & {
		sqlite: Parameters<typeof populateStateCache>[0]["engine"]["sqlite"];
	},
	schemaKeys: Iterable<string>
): void => {
	const tableCache = getStateCacheTables({ engine });

	for (const schemaKey of schemaKeys) {
		if (schemaKey === VERSION_DESCRIPTOR_SCHEMA_KEY) {
			continue;
		}
		if (!schemaKey || schemaKey.length === 0) {
			continue;
		}
		const cacheTableName = schemaKeyToCacheTableName(schemaKey);
		if (tableCache.has(cacheTableName)) {
			continue;
		}
		const schemaDefinition = resolveCacheSchemaDefinition({
			engine,
			schemaKey,
		});
		if (!schemaDefinition) {
			continue;
		}
		const created = createSchemaCacheTable({ engine, schema: schemaDefinition });
		if (!tableCache.has(created)) {
			tableCache.add(created);
		}
		if (!tableCache.has(cacheTableName)) {
			tableCache.add(cacheTableName);
		}
	}
};

const isMissingInternalStateVtableError = (error: unknown): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}
	const message = String((error as any).message ?? "");
	return (
		message.includes("no such table: lix_internal_state_vtable") ||
		message.includes("no such module: lix_internal_state_vtable")
	);
};

/**
 * Populates state cache tables using schema/version hints gathered during preprocessing.
 *
 * @example
 * ```ts
 * const { statements } = cachePopulator({ cachePreflight, getEngine, statements });
 * ```
 */
export const cachePopulator: PreprocessorStep = ({
	statements,
	cachePreflight,
	getEngine,
}) => {
	const engine = getEngine?.();
	if (!engine || !cachePreflight) {
		return { statements };
	}

	const schemaKeys = Array.from(cachePreflight.schemaKeys).filter((key) => {
		return typeof key === "string" && key.length > 0;
	});
	const versionHints = Array.from(cachePreflight.versionIds).filter(
		(value): value is string => typeof value === "string" && value.length > 0
	);

	if (schemaKeys.length === 0) {
		return { statements };
	}

	const guardToken = engine.runtimeCacheRef ?? engine;
	if (!guardToken) {
		return { statements };
	}

	if (!enterGuard(guardToken)) {
		exitGuard(guardToken);
		return { statements };
	}

	try {
		if (!hasInternalStateVtable(engine)) {
			return { statements };
		}

		ensureCacheTables(engine, schemaKeys);

		const needsRefresh = safeIsStaleStateCache(engine);
		if (!needsRefresh) {
			return { statements };
		}

		const versionId = versionHints[0];

		safePopulateStateCache(engine, versionId);
	} finally {
		exitGuard(guardToken);
	}

	return { statements };
};
