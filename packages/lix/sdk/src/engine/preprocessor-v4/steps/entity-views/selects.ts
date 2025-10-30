import type { LixEngine } from "../../../boot.js";
import { getAllStoredSchemas } from "../../../../stored-schema/get-stored-schema.js";
import { LixStoredSchemaSchema } from "../../../../stored-schema/schema-definition.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";
import {
	buildSqliteJsonPath,
	parseJsonPointer,
} from "../../../../schema-definition/json-pointer.js";

type StoredSchemaDefinition = LixSchemaDefinition;

type CachedSelects = {
	signature: string;
	map: Map<string, string>;
	metadata: Map<string, EntityViewDefinition>;
};

type PrimaryKeyDescriptor = {
	readonly column: string;
	readonly rootColumn: string;
	readonly path: readonly string[];
};

type PointerColumnDescriptor = {
	readonly alias: string;
	readonly expression: string;
	readonly matchers: readonly string[];
};

const cache = new WeakMap<object, CachedSelects>();
const subscriptions = new WeakMap<object, () => void>();
const LOADING_SIGNATURE = "loading";

/**
 * Synthesizes SELECT statements for every stored schema entity view.
 *
 * The statements mirror the historic SQLite views by targeting the internal
 * state vtable directly. Results are cached per-engine and invalidated on any
 * stored schema changes.
 *
 * @example
 * ```ts
 * const { map } = getEntityViewSelects({ engine });
 * const sql = map.get("key_value");
 * // => SELECT ... FROM state_all sa WHERE sa.schema_key = 'key_value' ...
 * ```
 */
export function getEntityViewSelects(args: {
	engine: Pick<LixEngine, "runtimeCacheRef" | "hooks" | "executeSync">;
}): {
	map: Map<string, string>;
	signature: string;
	metadata: Map<string, EntityViewDefinition>;
} {
	const { engine } = args;
	ensureSubscription(engine);

	const cached = cache.get(engine.runtimeCacheRef);
	if (cached) {
		return {
			map: cached.map,
			signature: cached.signature,
			metadata: cached.metadata,
		};
	}

	const loading: CachedSelects = {
		signature: LOADING_SIGNATURE,
		map: new Map(),
		metadata: new Map(),
	};
	cache.set(engine.runtimeCacheRef, loading);
	queueMicrotask(() => {
		if (cache.get(engine.runtimeCacheRef) === loading) {
			cache.delete(engine.runtimeCacheRef);
		}
	});

	const { definitions, signature } = getAllStoredSchemas({ engine });
	const { map, metadata } = synthesiseEntityViewSelects(definitions);
	const result: CachedSelects = { signature, map, metadata };
	cache.set(engine.runtimeCacheRef, result);
	return {
		map: result.map,
		signature: result.signature,
		metadata: result.metadata,
	};
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

function extractPropertyKeys(schema: StoredSchemaDefinition): string[] {
	const props = schema.properties;
	if (!props || typeof props !== "object") {
		return [];
	}
	return Object.keys(props).sort((left, right) => {
		if (left === right) return 0;
		return left < right ? -1 : 1;
	});
}

export function synthesiseEntityViewSelects(
	definitions: Map<string, StoredSchemaDefinition>
): {
	map: Map<string, string>;
	metadata: Map<string, EntityViewDefinition>;
} {
	const map = new Map<string, string>();
	const metadata = new Map<string, EntityViewDefinition>();

	for (const schema of definitions.values()) {
		const baseName = schema["x-lix-key"];
		if (!baseName || typeof baseName !== "string") {
			continue;
		}
		if (!Array.isArray(schema["x-lix-primary-key"])) {
			continue;
		}
		if ((schema as StoredSchemaDefinition).type !== "object") {
			continue;
		}

		const properties = extractPropertyKeys(schema);
		const baseSql = isEntityViewVariantEnabled(schema, "base")
			? createActiveSelect({ schema, properties })
			: null;
		const allSql = isEntityViewVariantEnabled(schema, "all")
			? createAllSelect({ schema, properties })
			: null;
		const historySql = isEntityViewVariantEnabled(schema, "history")
			? createHistorySelect({ schema, properties })
			: null;

		const aliasBase = dropLixPrefix(baseName);

		if (baseSql) {
			registerView(map, metadata, {
				primary: baseName,
				alias: aliasBase,
				sql: baseSql,
				schemaKey: baseName,
				variant: "base",
			});
		}
		if (allSql) {
			registerView(map, metadata, {
				primary: `${baseName}_all`,
				alias: aliasBase ? `${aliasBase}_all` : null,
				sql: allSql,
				schemaKey: baseName,
				variant: "all",
			});
		}
		if (historySql) {
			registerView(map, metadata, {
				primary: `${baseName}_history`,
				alias: aliasBase ? `${aliasBase}_history` : null,
				sql: historySql,
				schemaKey: baseName,
				variant: "history",
			});
		}
	}

	return { map, metadata };
}

function createActiveSelect(args: {
	schema: StoredSchemaDefinition;
	properties: readonly string[];
}): string {
	const { schema, properties } = args;
	const alias = "v";
	const inheritedExpr = buildInheritedFromVersionExpression(schema, alias);
	const expressions = [
		...buildPropertyExpressions({ schema, properties, jsonSourceAlias: alias }),
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

	return `SELECT
  ${expressions.join(",\n  ")}
FROM lix_internal_state_vtable ${alias}
WHERE ${alias}.schema_key = '${schema["x-lix-key"]}'
  AND ${alias}.snapshot_content IS NOT NULL
  AND ${versionFilter}`;
}

function createAllSelect(args: {
	schema: StoredSchemaDefinition;
	properties: readonly string[];
}): string {
	const { schema, properties } = args;
	const alias = "v";
	const inheritedExpr = buildInheritedFromVersionExpression(schema, alias);
	const expressions = [
		...buildPropertyExpressions({ schema, properties, jsonSourceAlias: alias }),
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

	return `SELECT
  ${expressions.join(",\n  ")}
FROM lix_internal_state_vtable ${alias}
WHERE ${alias}.schema_key = '${schema["x-lix-key"]}'
  AND ${alias}.snapshot_content IS NOT NULL`;
}

function createHistorySelect(args: {
	schema: StoredSchemaDefinition;
	properties: readonly string[];
}): string {
	const { schema, properties } = args;
	const alias = "sh";
	const expressions = [
		...buildPropertyExpressions({ schema, properties, jsonSourceAlias: alias }),
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

	return `SELECT
  ${expressions.join(",\n  ")}
FROM state_history ${alias}
WHERE ${alias}.schema_key = '${schema["x-lix-key"]}'`;
}

const VIEW_VARIANT_TO_KEY: Record<"base" | "all" | "history", string> = {
	base: "state",
	all: "state_all",
	history: "state_history",
};

function isEntityViewVariantEnabled(
	schema: StoredSchemaDefinition,
	variant: "base" | "all" | "history"
): boolean {
	const entries = schema["x-lix-entity-views"];
	if (!Array.isArray(entries)) {
		return true;
	}
	const expected = VIEW_VARIANT_TO_KEY[variant];
	return entries.some(
		(entry) =>
			typeof entry === "string" &&
			entry.toLowerCase() === expected.toLowerCase()
	);
}

function buildActiveVersionFilter(schema: StoredSchemaDefinition, alias: string) {
	const override = extractLiteralOverride(schema, "lixcol_version_id");
	if (override) {
		return `${alias}.version_id = '${escapeSqlLiteral(override)}'`;
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
	if (!match) {
		return null;
	}
	return match[1] ?? null;
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
	properties: readonly string[];
	jsonSourceAlias?: string;
}): string[] {
	const aliases = new Set(args.properties.map((prop) => prop.toLowerCase()));
	const pointerColumns = collectPointerColumnDescriptors({ schema: args.schema });
	const jsonSource = args.jsonSourceAlias
		? `${args.jsonSourceAlias}.snapshot_content`
		: "snapshot_content";
	const expressions: string[] = [];

	for (const pointer of pointerColumns) {
		if (aliases.has(pointer.alias.toLowerCase())) {
			continue;
		}
		const expression = pointer.expression.replace(
			"snapshot_content",
			jsonSource
		);
		expressions.push(`${expression} AS ${escapeIdentifier(pointer.alias)}`);
	}

	for (const property of args.properties) {
		expressions.push(
			`json_extract(${jsonSource}, '$.${property}') AS ${escapeIdentifier(property)}`
		);
	}

	return expressions;
}

function collectPointerColumnDescriptors(args: {
	schema: StoredSchemaDefinition;
	primaryKeys?: PrimaryKeyDescriptor[] | null;
}): PointerColumnDescriptor[] {
	const primaryKeys = args.primaryKeys ?? extractPrimaryKeys(args.schema);
	if (!primaryKeys || primaryKeys.length === 0) {
		return [];
	}

	const descriptors = new Map<string, PointerColumnDescriptor>();

	for (const descriptor of primaryKeys) {
		if (!descriptor.path || descriptor.path.length <= 1) {
			continue;
		}
		const lastSegment = descriptor.path.at(-1) ?? "";
		const aliasInfo = buildPointerAliasInfo(lastSegment);
		if (!aliasInfo) {
			continue;
		}
		const aliasLower = aliasInfo.alias.toLowerCase();
		if (descriptors.has(aliasLower)) {
			continue;
		}

		const expression = `json_extract(snapshot_content, '${buildSqliteJsonPath(descriptor.path)}')`;
		const matcherSet = new Set<string>();
		for (const matcher of aliasInfo.matchers) {
			if (matcher.length > 0) {
				matcherSet.add(matcher.toLowerCase());
			}
		}
		if (descriptor.column.length > 0) {
			matcherSet.add(descriptor.column.toLowerCase());
		}

		descriptors.set(aliasLower, {
			alias: aliasInfo.alias,
			expression,
			matchers: Array.from(matcherSet),
		});
	}

	return Array.from(descriptors.values());
}

function extractPrimaryKeys(
	schema: StoredSchemaDefinition
): PrimaryKeyDescriptor[] | null {
	const pk = schema["x-lix-primary-key"];
	if (!Array.isArray(pk) || pk.length === 0) {
		return null;
	}

	const descriptors: PrimaryKeyDescriptor[] = [];
	for (const entry of pk) {
		if (typeof entry !== "string" || entry.length === 0) {
			return null;
		}
		if (!entry.startsWith("/")) {
			return null;
		}
		const segments = parseJsonPointer(entry);
		if (segments.length === 0) {
			return null;
		}
		const root = segments[0]!.toLowerCase();
		const column = segments[segments.length - 1]!.toLowerCase();
		descriptors.push({
			column,
			rootColumn: root,
			path: segments.map((segment) => segment),
		});
	}
	return descriptors;
}

function buildPointerAliasInfo(
	segment: string
): { alias: string; matchers: readonly string[] } | null {
	if (!segment) {
		return null;
	}
	const stripped = segment.replace(/^x-lix-/, "");
	let alias = stripped.replace(/[^A-Za-z0-9_]/g, "_");
	if (alias.length === 0) {
		return null;
	}
	if (/^[0-9]/.test(alias)) {
		alias = `_${alias}`;
	}

	const matchers = new Set<string>();
	matchers.add(alias);
	matchers.add(alias.toLowerCase());
	if (stripped.length > 0) {
		matchers.add(stripped);
		matchers.add(stripped.toLowerCase());
	}
	matchers.add(segment);
	matchers.add(segment.toLowerCase());
	const sanitized = segment.replace(/[^A-Za-z0-9_]/g, "_");
	if (sanitized.length > 0) {
		matchers.add(sanitized);
		matchers.add(sanitized.toLowerCase());
	}

	return {
		alias,
		matchers: Array.from(matchers),
	};
}

function escapeIdentifier(identifier: string): string {
	if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
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

type EntityViewVariant = "base" | "all" | "history";

export type EntityViewDefinition = {
	readonly sql: string;
	readonly schemaKey: string;
	readonly variant: EntityViewVariant;
};

function registerView(
	map: Map<string, string>,
	metadata: Map<string, EntityViewDefinition>,
	args: {
		primary: string;
		alias: string | null;
		sql: string;
		schemaKey: string;
		variant: EntityViewVariant;
	}
): void {
	map.set(args.primary, args.sql);
	metadata.set(args.primary.toLowerCase(), {
		sql: args.sql,
		schemaKey: args.schemaKey,
		variant: args.variant,
	});

	if (!args.alias) {
		return;
	}

	if (!map.has(args.alias)) {
		map.set(args.alias, args.sql);
	}

	const aliasKey = args.alias.toLowerCase();
	if (!metadata.has(aliasKey)) {
		metadata.set(aliasKey, {
			sql: args.sql,
			schemaKey: args.schemaKey,
			variant: args.variant,
		});
	}
}
