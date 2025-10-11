import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import { Ident, QIdent } from "../../sql-parser/tokenizer.js";
import {
	parseJsonPointer,
	buildSqliteJsonPath,
} from "../../../schema-definition/json-pointer.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import type { CelEnvironmentState } from "./cel-environment.js";
import { LixStoredSchemaSchema } from "../../../stored-schema/schema-definition.js";
import { getStoredSchema } from "../../../stored-schema/get-stored-schema.js";

/**
 * JSON-schema definition as stored in the `internal_state_vtable` for entity views.
 */
export type StoredSchemaDefinition = LixSchemaDefinition;

/**
 * Result emitted by entity view rewriters. When null is returned the
 * preprocessor should fall back to executing the original statement.
 */
export interface RewriteResult {
	sql: string;
	parameters: ReadonlyArray<unknown>;
}

const ENTITY_REWRITE_WHITELIST = new Set([
	"key_value",
	"lix_key_value",
	"change_proposal",
	"lix_change_proposal",
	"change_set",
	"lix_change_set",
	"change_set_element",
	"lix_change_set_element",
	"change_set_label",
	"lix_change_set_label",
	"change_author",
	"lix_change_author",
	"mock_composite_schema",
	"insertable_schema",
	"mock_default_schema",
	"mock_fn_schema",
	"mock_cel_schema",
	"mock_fn_override",
	"multi_schema",
	"expression_schema",
	"delete_schema",
	"update_schema",
	"immutable_update_schema",
	"json_update_schema",
	"expression_update_schema",
	"version_override_schema",
	"pointer_entity_schema",
	"active_version",
	"lix_active_version",
	"label",
	"lix_label",
	"entity_label",
	"lix_entity_label",
	"conversation",
	"lix_conversation",
	"conversation_message",
	"lix_conversation_message",
	"entity_conversation",
	"lix_entity_conversation",
	"commit",
	"lix_commit",
	"commit_edge",
	"lix_commit_edge",
	"log",
	"lix_log",
	"account",
	"lix_account",
	"active_account",
	"lix_active_account",
	"stored_schema",
	"lix_stored_schema",
]);

/**
 * Determines whether entity view rewrites are enabled for the given schema key.
 */
export function isEntityRewriteAllowed(schemaKey: string): boolean {
	return ENTITY_REWRITE_WHITELIST.has(schemaKey.toLowerCase());
}

/**
 * Finds the index of a keyword in a token stream, starting at a given offset.
 */
export function findKeyword(
	tokens: IToken[],
	start: number,
	keyword: string
): number {
	const target = keyword.toUpperCase();
	for (let i = start; i < tokens.length; i++) {
		const image = tokens[i]?.image;
		if (!image) continue;
		if (image.toUpperCase() === target) {
			return i;
		}
	}
	return -1;
}

/**
 * Extracts the SQL identifier name from either a quoted or unquoted token.
 */
export function extractIdentifier(token: IToken | undefined): string | null {
	if (!token?.image) return null;
	if (token.tokenType === QIdent) {
		return token.image.slice(1, -1).replace(/""/g, '"');
	}
	if (token.tokenType === Ident) {
		return token.image;
	}
	return null;
}

/**
 * Categorises an entity view by its suffix (base, _all, or _history).
 */
export function classifyViewVariant(name: string): "base" | "all" | "history" {
	const lower = name.toLowerCase();
	if (lower.endsWith("_all")) return "all";
	if (lower.endsWith("_history")) return "history";
	return "base";
}

/**
 * Removes variant suffixes from a view name to recover the stored schema key.
 */
export function baseSchemaKey(name: string): string | null {
	const lower = name.toLowerCase();
	if (lower.endsWith("_all")) return name.slice(0, -4);
	if (lower.endsWith("_history")) return name.slice(0, -8);
	return name;
}

const VIEW_VARIANT_TO_KEY: Record<"base" | "all" | "history", string> = {
	base: "state",
	all: "state_all",
	history: "state_history",
};

/**
 * Returns true if a specific view variant is enabled for the schema.
 */
export function isEntityViewVariantEnabled(
	schema: StoredSchemaDefinition,
	variant: "base" | "all" | "history"
): boolean {
	const selected = schema?.["x-lix-entity-views"];
	if (!Array.isArray(selected)) {
		return true;
	}
	const viewKey = VIEW_VARIANT_TO_KEY[variant];
	return selected.some(
		(entry): boolean =>
			typeof entry === "string" && entry.toLowerCase() === viewKey
	);
}

export function resolveStoredSchemaKey(
	schema: StoredSchemaDefinition,
	fallbackKey: string
): string {
	const key = schema?.["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		return key;
	}
	return fallbackKey;
}

function candidateStoredSchemaKeys(schemaKey: string): string[] {
	if (!schemaKey) {
		return [];
	}
	const candidates = [schemaKey];
	if (!schemaKey.startsWith("lix_")) {
		candidates.push(`lix_${schemaKey}`);
	}
	return candidates;
}

export function loadStoredSchemaDefinition(
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">,
	schemaKey: string
): StoredSchemaDefinition | null {
	for (const candidate of candidateStoredSchemaKeys(schemaKey)) {
		const schema = getStoredSchema({ engine, key: candidate });
		if (schema) {
			return schema;
		}
	}
	return null;
}

/**
 * Extracts the lower-cased primary key fields from a stored schema.
 */
export interface PrimaryKeyDescriptor {
	readonly column: string;
	readonly rootColumn: string;
	readonly path: readonly string[];
}

export function extractPrimaryKeys(
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

export interface PointerColumnDescriptor {
	readonly alias: string;
	readonly expression: string;
	readonly matchers: readonly string[];
}

/**
 * Derives column expressions for JSON pointers referenced by a schema's primary key.
 * These descriptors allow entity view rewrites to match WHERE clauses that target
 * nested structures using either the pointer name (e.g. `/value/x-lix-key`) or
 * friendly aliases such as `key`.
 *
 * @example
 * const columns = collectPointerColumnDescriptors({ schema });
 * // columns[0]?.alias === "key"
 * // columns[0]?.expression === `json_extract(snapshot_content, '$.value."x-lix-key"')`
 */
export function collectPointerColumnDescriptors(args: {
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
		if (!aliasInfo) continue;

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

/**
 * Helper that returns an explicitly provided column value or a fallback default.
 */
export function getColumnOrDefault(
	columnMap: Map<string, unknown>,
	column: string,
	defaultValue: unknown
): unknown {
	const value = columnMap.get(column.toLowerCase());
	if (value !== undefined) {
		return value;
	}
	return defaultValue;
}

/**
 * Evaluates metadata overrides defined via x-lix-override-lixcols. Values that are strings are treated
 * as CEL expressions; other primitive values are passed through unchanged.
 */
export function resolveMetadataDefaults(args: {
	defaults: unknown;
	cel: CelEnvironmentState | null;
	context?: Record<string, unknown>;
}): Map<string, unknown> {
	const { defaults, cel } = args;
	const resolved = new Map<string, unknown>();
	if (!defaults || typeof defaults !== "object") {
		return resolved;
	}

	const context = args.context ?? {};
	for (const [key, raw] of Object.entries(
		defaults as Record<string, unknown>
	)) {
		if (typeof raw === "string") {
			if (!cel) {
				throw new Error(
					`Encountered x-lix-override-lixcols entry "${key}" but CEL evaluation is not initialised.`
				);
			}
			const value = cel.evaluate(raw, { ...context });
			if (value !== undefined) {
				resolved.set(key, value);
				context[key] = value as unknown;
			}
			continue;
		}
		if (raw !== undefined) {
			resolved.set(key, raw);
			context[key] = raw as unknown;
		}
	}

	return resolved;
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
	const sanitizedSegment = segment.replace(/[^A-Za-z0-9_]/g, "_");
	if (sanitizedSegment.length > 0) {
		matchers.add(sanitizedSegment);
		matchers.add(sanitizedSegment.toLowerCase());
	}

	return {
		alias,
		matchers: Array.from(matchers),
	};
}
