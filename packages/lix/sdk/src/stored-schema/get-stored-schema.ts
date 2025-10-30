import { sql } from "kysely";
import type { LixEngine } from "../engine/boot.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { LixStoredSchemaSchema } from "./schema-definition.js";
import { internalQueryBuilder } from "../engine/internal-query-builder.js";

type StoredSchemaCache = {
	byKey: Map<string, LixSchemaDefinition | null>;
	all?: { definitions: Map<string, LixSchemaDefinition>; signature: string };
};

const cache = new WeakMap<object, StoredSchemaCache>();
const subscriptions = new WeakMap<object, () => void>();

/**
 * Loads the most recent stored schema definition for the exact key provided.
 *
 * The lookup targets the `global` version only and does not apply any prefixing
 * or aliasing to `key`. Results are cached per-engine and invalidated on state
 * commits that modify stored schemas. Returns `null` if the schema cannot be
 * found.
 *
 * @example
 * ```ts
 * const schema = getStoredSchema({ engine, key: "lix_change_set" });
 * console.log(schema?.["x-lix-version"]);
 * ```
 */
export function getStoredSchema(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	key: string;
}): LixSchemaDefinition | null {
	const { engine, key } = args;
	if (!key) return null;

	ensureSubscription(engine);
	const cacheEntry = ensureCache(engine.runtimeCacheRef);
	if (cacheEntry.byKey.has(key)) {
		return cacheEntry.byKey.get(key) ?? null;
	}

	const schema = loadSchema(engine, key);
	cacheEntry.byKey.set(key, schema);
	return schema;
}

export function getAllStoredSchemas(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
}): { definitions: Map<string, LixSchemaDefinition>; signature: string } {
	const { engine } = args;
	ensureSubscription(engine);
	const cacheEntry = ensureCache(engine.runtimeCacheRef);
	if (cacheEntry.all) {
		return cacheEntry.all;
	}

	const compiledQuery = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.select(["snapshot_content", "updated_at"])
		.where("schema_key", "=", LixStoredSchemaSchema["x-lix-key"])
		.where("snapshot_content", "is not", null)
		.where("version_id", "=", "global")
		.compile();

	const { rows } = engine.executeSync({
		...compiledQuery,
		skipPreprocessing: true,
	});

	const definitions = new Map<string, LixSchemaDefinition>();
	let maxUpdated = "";

	for (const row of rows as Array<Record<string, unknown>>) {
		const parsed = JSON.parse(String(row.snapshot_content));
		const updatedAt = String(row.updated_at ?? "");
		const definition = parsed.value as LixSchemaDefinition;
		if (!definition || typeof definition !== "object") {
			continue;
		}
		registerDefinition(cacheEntry, definition);
		const key = definition["x-lix-key"];
		if (typeof key !== "string" || key.length === 0) {
			continue;
		}
		definitions.set(key, definition);
		if (updatedAt > maxUpdated) {
			maxUpdated = updatedAt;
		}
	}

	const signature = `${definitions.size}:${maxUpdated}`;
	cacheEntry.all = { definitions, signature };
	return cacheEntry.all;
}

function loadSchema(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">,
	key: string
): LixSchemaDefinition | null {
	const compiledQuery = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
		.where("schema_key", "=", LixStoredSchemaSchema["x-lix-key"])
		.where(sql`json_extract(snapshot_content, '$.value."x-lix-key"')`, "=", key)
		.where("version_id", "=", "global")
		.where("snapshot_content", "is not", null)
		.orderBy(
			sql`json_extract(snapshot_content, '$.value."x-lix-version"')`,
			"desc"
		)
		.limit(1)
		.compile();

	const { rows } = engine.executeSync({
		...compiledQuery,
		skipPreprocessing: true,
	});
	const raw = rows[0]?.value;
	if (typeof raw !== "string") return null;
	const definition = JSON.parse(raw) as LixSchemaDefinition;
	if (definition) {
		registerDefinition(ensureCache(engine.runtimeCacheRef), definition);
	}
	return definition;
}

function ensureCache(ref: object): StoredSchemaCache {
	let entry = cache.get(ref);
	if (!entry) {
		entry = { byKey: new Map(), all: undefined };
		cache.set(ref, entry);
	}
	return entry;
}

function registerDefinition(
	cacheEntry: StoredSchemaCache,
	definition: LixSchemaDefinition
): void {
	const key = definition["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		cacheEntry.byKey.set(key, definition);
	}
}

function ensureSubscription(
	engine: Pick<LixEngine, "runtimeCacheRef" | "hooks">
): void {
	if (!engine.hooks) return;
	if (subscriptions.has(engine.runtimeCacheRef)) return;

	const unsubscribe = engine.hooks.onStateCommit(({ changes }) => {
		if (!changes || changes.length === 0) return;
		for (const change of changes) {
			if (change.schema_key === LixStoredSchemaSchema["x-lix-key"]) {
				cache.delete(engine.runtimeCacheRef);
				break;
			}
		}
	});

	subscriptions.set(engine.runtimeCacheRef, unsubscribe);
}
