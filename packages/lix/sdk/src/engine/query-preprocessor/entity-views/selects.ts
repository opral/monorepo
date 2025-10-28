import type { LixEngine } from "../../boot.js";
import { getAllStoredSchemas } from "../../../stored-schema/get-stored-schema.js";
import { LixStoredSchemaSchema } from "../../../stored-schema/schema-definition.js";
import {
	collectPointerColumnDescriptors,
	isEntityViewVariantEnabled,
	type StoredSchemaDefinition,
} from "./shared.js";

type CachedSelects = {
	signature: string;
	map: Map<string, string>;
};

const cache = new WeakMap<object, CachedSelects>();
const subscriptions = new WeakMap<object, () => void>();
const LOADING_SIGNATURE = "loading";

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
	const loadingEntry: CachedSelects = {
		signature: LOADING_SIGNATURE,
		map: new Map(),
	};
	cache.set(engine.runtimeCacheRef, loadingEntry);
	queueMicrotask(() => {
		const current = cache.get(engine.runtimeCacheRef);
		if (current === loadingEntry) {
			cache.delete(engine.runtimeCacheRef);
		}
	});
	const { definitions, signature } = getAllStoredSchemas({ engine });
	const map = new Map<string, string>();
	for (const schema of definitions.values()) {
		const baseName = schema["x-lix-key"];
		if (!baseName || typeof baseName !== "string") continue;
		if (!Array.isArray(schema["x-lix-primary-key"])) continue;
		if ((schema as any).type !== "object") continue;

		const props = extractPropertyKeys(schema);
		const baseSql = isEntityViewVariantEnabled(schema, "base")
			? createActiveSelect({ schema, properties: props })
			: null;
		const allSql = isEntityViewVariantEnabled(schema, "all")
			? createAllSelect({ schema, properties: props })
			: null;
		const historySql = isEntityViewVariantEnabled(schema, "history")
			? createHistorySelect({ schema, properties: props })
			: null;

		const aliasBaseName = dropLixPrefix(baseName);
		if (baseSql) {
			registerView(map, {
				primary: baseName,
				alias: aliasBaseName,
				sql: baseSql,
			});
		}
		if (allSql) {
			registerView(map, {
				primary: `${baseName}_all`,
				alias: aliasBaseName ? `${aliasBaseName}_all` : null,
				sql: allSql,
			});
		}
		if (historySql) {
			registerView(map, {
				primary: `${baseName}_history`,
				alias: aliasBaseName ? `${aliasBaseName}_history` : null,
				sql: historySql,
			});
		}
	}

	const result = { signature, map } satisfies CachedSelects;
	cache.set(engine.runtimeCacheRef, result);
	return result;
}

function ensureSubscription(
	engine: Pick<LixEngine, "hooks" | "runtimeCacheRef">
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
	const alias = "sa";

	const inheritedExpr = buildInheritedFromVersionExpression(schema, alias);
	const expressions = [
		...buildPropertyExpressions({
			schema,
			properties,
			jsonSourceAlias: alias,
		}),
		`${alias}.entity_id AS lixcol_entity_id`,
		`${alias}.schema_key AS lixcol_schema_key`,
		`${alias}.file_id AS lixcol_file_id`,
		`${alias}.plugin_key AS lixcol_plugin_key`,
		`${inheritedExpr} AS lixcol_inherited_from_version_id`,
		`${alias}.created_at AS lixcol_created_at`,
		`${alias}.updated_at AS lixcol_updated_at`,
		`${alias}.change_id AS lixcol_change_id`,
		`${alias}.untracked AS lixcol_untracked`,
		`${alias}.commit_id AS lixcol_commit_id`,
		`${alias}.metadata AS lixcol_metadata`,
	];

	const versionFilter = buildActiveVersionFilter(schema, alias);

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state_all ${alias}\nWHERE ${alias}.schema_key = '${schema["x-lix-key"]}'\n  AND ${versionFilter}`;
}

function createAllSelect(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
}): string {
	const { schema, properties } = args;
	const alias = "sa";
	const inheritedExpr = buildInheritedFromVersionExpression(schema, alias);
	const expressions = [
		...buildPropertyExpressions({
			schema,
			properties,
			jsonSourceAlias: alias,
		}),
		`${alias}.entity_id AS lixcol_entity_id`,
		`${alias}.schema_key AS lixcol_schema_key`,
		`${alias}.file_id AS lixcol_file_id`,
		`${alias}.plugin_key AS lixcol_plugin_key`,
		`${alias}.version_id AS lixcol_version_id`,
		`${inheritedExpr} AS lixcol_inherited_from_version_id`,
		`${alias}.created_at AS lixcol_created_at`,
		`${alias}.updated_at AS lixcol_updated_at`,
		`${alias}.change_id AS lixcol_change_id`,
		`${alias}.untracked AS lixcol_untracked`,
		`${alias}.commit_id AS lixcol_commit_id`,
		`${alias}.metadata AS lixcol_metadata`,
	];

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state_all ${alias}\nWHERE ${alias}.schema_key = '${schema["x-lix-key"]}'`;
}

function createHistorySelect(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
}): string {
	const { schema, properties } = args;
	const alias = "sh";
	const expressions = [
		...buildPropertyExpressions({
			schema,
			properties,
			jsonSourceAlias: alias,
		}),
		`${alias}.entity_id AS lixcol_entity_id`,
		`${alias}.schema_key AS lixcol_schema_key`,
		`${alias}.file_id AS lixcol_file_id`,
		`${alias}.plugin_key AS lixcol_plugin_key`,
		`${alias}.schema_version AS lixcol_schema_version`,
		`${alias}.change_id AS lixcol_change_id`,
		`${alias}.commit_id AS lixcol_commit_id`,
		`${alias}.root_commit_id AS lixcol_root_commit_id`,
		`${alias}.depth AS lixcol_depth`,
		`${alias}.metadata AS lixcol_metadata`,
	];

	return `SELECT\n  ${expressions.join(",\n  ")}\nFROM state_history ${alias}\nWHERE ${alias}.schema_key = '${schema["x-lix-key"]}'`;
}

function buildActiveVersionFilter(
	schema: StoredSchemaDefinition,
	alias: string
): string {
	const versionOverride = extractLiteralOverride(schema, "lixcol_version_id");
	if (versionOverride) {
		return `${alias}.version_id = '${escapeSqlLiteral(versionOverride)}'`;
	}
	return `${alias}.version_id = (SELECT version_id FROM active_version)`;
}

function extractLiteralOverride(
	schema: StoredSchemaDefinition,
	key: string
): string | null {
	const overrides = schema["x-lix-override-lixcols"];
	if (!overrides || typeof overrides !== "object") {
		return null;
	}
	const raw = (overrides as Record<string, unknown>)[key];
	if (typeof raw !== "string") {
		return null;
	}
	const trimmed = raw.trim();
	const match = /^"([^"]*)"$/u.exec(trimmed);
	if (match) {
		return match[1] ?? null;
	}
	return null;
}

function escapeSqlLiteral(value: string): string {
	return value.replace(/'/g, "''");
}

function buildInheritedFromVersionExpression(
	schema: StoredSchemaDefinition,
	alias: string
): string {
	const inheritedOverride = extractLiteralOverride(
		schema,
		"lixcol_inherited_from_version_id"
	);
	if (inheritedOverride !== null) {
		return `'${escapeSqlLiteral(inheritedOverride)}'`;
	}
	const versionOverride = extractLiteralOverride(schema, "lixcol_version_id");
	if (versionOverride !== null) {
		return `COALESCE(${alias}.inherited_from_version_id, '${escapeSqlLiteral(versionOverride)}')`;
	}
	return `${alias}.inherited_from_version_id`;
}

function buildPropertyExpressions(args: {
	schema: StoredSchemaDefinition;
	properties: string[];
	jsonSourceAlias?: string;
}): string[] {
	const expressions: string[] = [];
	const propertyLower = new Set(
		args.properties.map((prop) => prop.toLowerCase())
	);
	const pointerColumns = collectPointerColumnDescriptors({
		schema: args.schema,
	});
	const jsonSource = args.jsonSourceAlias
		? `${args.jsonSourceAlias}.snapshot_content`
		: "snapshot_content";
	for (const pointer of pointerColumns) {
		if (propertyLower.has(pointer.alias.toLowerCase())) {
			continue;
		}
		expressions.push(
			`${pointer.expression.replace("snapshot_content", jsonSource)} AS ${escapeIdentifier(pointer.alias)}`
		);
	}
	for (const prop of args.properties) {
		const source = jsonSource;
		expressions.push(
			`json_extract(${source}, '$.${prop}') AS ${escapeIdentifier(prop)}`
		);
	}
	return expressions;
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
