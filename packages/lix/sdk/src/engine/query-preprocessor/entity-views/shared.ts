import type { IToken } from "chevrotain";
import type { LixEngine } from "../../boot.js";
import { Ident, QIdent } from "../../sql-parser/tokenizer.js";

/**
 * JSON-schema definition as stored in the `internal_state_vtable` for entity views.
 */
export interface StoredSchemaDefinition {
	readonly [key: string]: any;
}

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
	"mock_fn_override",
	"multi_schema",
	"expression_schema",
	"delete_schema",
	"update_schema",
	"immutable_update_schema",
	"json_update_schema",
	"expression_update_schema",
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

/**
 * Loads the latest stored schema definition for a given schema key.
 */
export function loadStoredSchemaDefinition(
	engine: Pick<LixEngine, "executeSync">,
	schemaKey: string
): StoredSchemaDefinition | null {
	for (const candidate of candidateStoredSchemaKeys(schemaKey)) {
		const definition = loadStoredSchemaDefinitionForKey(engine, candidate);
		if (definition) {
			return definition;
		}
	}
	return null;
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

function loadStoredSchemaDefinitionForKey(
	engine: Pick<LixEngine, "executeSync">,
	schemaKey: string
): StoredSchemaDefinition | null {
	const { rows } = engine.executeSync({
		sql: `SELECT json_extract(snapshot_content, '$.value') AS value
			FROM internal_state_vtable
			WHERE schema_key = 'lix_stored_schema'
			AND json_extract(snapshot_content, '$.key') = ?
			AND snapshot_content IS NOT NULL
			ORDER BY json_extract(snapshot_content, '$.version') DESC
			LIMIT 1`,
		parameters: [schemaKey],
	});

	const first = rows?.[0];
	if (!first) return null;
	const raw = first.value;
	if (typeof raw === "string") {
		try {
			return JSON.parse(raw) as StoredSchemaDefinition;
		} catch {
			return null;
		}
	}
	if (typeof raw === "object" && raw !== null) {
		return raw as StoredSchemaDefinition;
	}
	return null;
}

/**
 * Extracts the lower-cased primary key fields from a stored schema.
 */
export function extractPrimaryKeys(
	schema: StoredSchemaDefinition
): string[] | null {
	const pk = schema["x-lix-primary-key"];
	if (Array.isArray(pk) && pk.length > 0) {
		return pk.map((key) => key.toLowerCase());
	}
	return null;
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
