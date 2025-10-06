import type { LixEngine } from "../../boot.js";

type CachedSelects = {
	signature: string;
	map: Map<string, string>;
};

const cache = new WeakMap<object, CachedSelects>();
const subscriptions = new WeakMap<object, () => void>();
const loading = new WeakSet<object>();

const STORED_SCHEMA_KEY = "lix_stored_schema";

/**
 * Returns a map of logical entity view names to their SELECT statements derived
 * directly from stored schemas. The statements model the read-only projection
 * that used to be implemented via SQLite views.
 */
export function getEntityViewSelects(args: {
	engine: Pick<LixEngine, "runtimeCacheRef" | "hooks" | "executeSync">;
}): { map: Map<string, string>; signature: string } {
	const { engine } = args;
	ensureSubscription(engine);

	const cached = cache.get(engine.runtimeCacheRef);
	if (cached) {
		return { map: cached.map, signature: cached.signature };
	}
	if (loading.has(engine.runtimeCacheRef)) {
		return {
			map: new Map<string, string>(),
			signature: "loading",
		};
	}

	loading.add(engine.runtimeCacheRef);
	try {
		const { schemas, signature } = loadStoredSchemas(engine);
		const map = new Map<string, string>();
		for (const entry of schemas) {
			const schema = entry.definition;
			const baseName = schema["x-lix-key"];
			if (!baseName || typeof baseName !== "string") continue;
			if (!Array.isArray(schema["x-lix-primary-key"])) continue;
			if ((schema as any).type !== "object") continue;

			const props = extractPropertyKeys(schema);
			const baseSql = createActiveSelect({ schema, properties: props });
			const allSql = createAllSelect({ schema, properties: props });
			const historySql = createHistorySelect({ schema, properties: props });

			const aliasBaseName = dropLixPrefix(baseName);
			registerView(map, {
				primary: baseName,
				alias: aliasBaseName,
				sql: baseSql,
			});
			registerView(map, {
				primary: `${baseName}_all`,
				alias: aliasBaseName ? `${aliasBaseName}_all` : null,
				sql: allSql,
			});
			registerView(map, {
				primary: `${baseName}_history`,
				alias: aliasBaseName ? `${aliasBaseName}_history` : null,
				sql: historySql,
			});
		}

		cache.set(engine.runtimeCacheRef, { signature, map });
		return { map, signature };
	} finally {
		loading.delete(engine.runtimeCacheRef);
	}
}

type StoredSchemaDefinition = {
	readonly [key: string]: any;
};

type LoadedSchema = {
	definition: StoredSchemaDefinition;
	updatedAt: string;
};

function loadStoredSchemas(engine: Pick<LixEngine, "executeSync">): {
	schemas: LoadedSchema[];
	signature: string;
} {
	const result = engine.executeSync({
		sql: `SELECT snapshot_content, updated_at
			FROM internal_state_vtable
			WHERE schema_key = ? AND snapshot_content IS NOT NULL`,
		parameters: [STORED_SCHEMA_KEY],
	});

	const rows = (result.rows ?? []) as Array<Record<string, unknown>>;

	const schemas: LoadedSchema[] = [];
	let maxUpdated = "";

	for (const row of rows) {
		const snapshot = parseJson(row.snapshot_content);
		if (!snapshot || typeof snapshot !== "object") continue;
		const value = extractSchemaValue(snapshot);
		if (value && typeof value === "object") {
			const updatedAt = String(row.updated_at ?? "");
			schemas.push({
				definition: value as StoredSchemaDefinition,
				updatedAt,
			});
			if (updatedAt > maxUpdated) {
				maxUpdated = updatedAt;
			}
		}
	}

	const signature = `${schemas.length}:${maxUpdated}`;
	return { schemas, signature };
}

function ensureSubscription(
	engine: Pick<LixEngine, "hooks" | "runtimeCacheRef">
): void {
	if (!engine.hooks) return;
	if (subscriptions.has(engine.runtimeCacheRef)) return;

	const unsubscribe = engine.hooks.onStateCommit(({ changes }) => {
		if (!changes || changes.length === 0) return;
		for (const change of changes) {
			if (change.schema_key === STORED_SCHEMA_KEY) {
				cache.delete(engine.runtimeCacheRef);
				break;
			}
		}
	});

	subscriptions.set(engine.runtimeCacheRef, unsubscribe);
}

function extractSchemaValue(snapshot: unknown): unknown {
	if (!snapshot || typeof snapshot !== "object") return undefined;
	const raw = (snapshot as Record<string, unknown>).value;
	if (!raw) return undefined;
	if (typeof raw === "string") return parseJson(raw);
	return raw;
}

function parseJson(input: unknown): unknown {
	if (typeof input !== "string") return input ?? undefined;
	try {
		return JSON.parse(input);
	} catch {
		return undefined;
	}
}

function extractPropertyKeys(schema: StoredSchemaDefinition): string[] {
	const props = schema.properties;
	if (!props || typeof props !== "object") return [];
	return Object.keys(props).sort();
}

function createActiveSelect(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
}): string {
	const { schema, properties } = args;
	const expressions = [
		...buildPropertyExpressions(properties),
		"entity_id AS lixcol_entity_id",
		"schema_key AS lixcol_schema_key",
		"file_id AS lixcol_file_id",
		"plugin_key AS lixcol_plugin_key",
		"inherited_from_version_id AS lixcol_inherited_from_version_id",
		"created_at AS lixcol_created_at",
		"updated_at AS lixcol_updated_at",
		"change_id AS lixcol_change_id",
		"untracked AS lixcol_untracked",
		"commit_id AS lixcol_commit_id",
		"metadata AS lixcol_metadata",
	];

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state\nWHERE schema_key = '${schema["x-lix-key"]}'`;
}

function createAllSelect(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
}): string {
	const { schema, properties } = args;
	const expressions = [
		...buildPropertyExpressions(properties),
		"entity_id AS lixcol_entity_id",
		"schema_key AS lixcol_schema_key",
		"file_id AS lixcol_file_id",
		"plugin_key AS lixcol_plugin_key",
		"version_id AS lixcol_version_id",
		"inherited_from_version_id AS lixcol_inherited_from_version_id",
		"created_at AS lixcol_created_at",
		"updated_at AS lixcol_updated_at",
		"change_id AS lixcol_change_id",
		"untracked AS lixcol_untracked",
		"commit_id AS lixcol_commit_id",
		"metadata AS lixcol_metadata",
	];

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state_all\nWHERE schema_key = '${schema["x-lix-key"]}'`;
}

function createHistorySelect(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
}): string {
	const { schema, properties } = args;
	const expressions = [
		...buildPropertyExpressions(properties),
		"entity_id AS lixcol_entity_id",
		"schema_key AS lixcol_schema_key",
		"file_id AS lixcol_file_id",
		"plugin_key AS lixcol_plugin_key",
		"schema_version AS lixcol_schema_version",
		"change_id AS lixcol_change_id",
		"commit_id AS lixcol_commit_id",
		"root_commit_id AS lixcol_root_commit_id",
		"depth AS lixcol_depth",
		"metadata AS lixcol_metadata",
	];

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state_history\nWHERE schema_key = '${schema["x-lix-key"]}'`;
}

function buildPropertyExpressions(properties: string[]): string[] {
	return properties.map(
		(prop) =>
			`json_extract(snapshot_content, '$.${prop}') AS ${escapeIdentifier(prop)}`
	);
}

function escapeIdentifier(identifier: string): string {
	if (/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
		return identifier;
	}
	const escaped = identifier.replace(/"/g, '""');
	return `"${escaped}"`;
}

function dropLixPrefix(name: string): string | null {
	if (!name.startsWith("lix_")) {
		return null;
	}
	const alias = name.slice(4);
	return alias.length > 0 ? alias : null;
}

function registerView(
	map: Map<string, string>,
	args: { primary: string; alias: string | null; sql: string }
): void {
	map.set(args.primary, args.sql);
	if (!args.alias || args.alias === args.primary) {
		return;
	}
	if (!map.has(args.alias)) {
		map.set(args.alias, args.sql);
	}
}
