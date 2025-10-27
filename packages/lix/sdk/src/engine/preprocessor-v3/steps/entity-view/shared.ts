import { buildSqliteJsonPath, parseJsonPointer } from "../../../../schema-definition/json-pointer.js";
import { isJsonType } from "../../../../schema-definition/json-type.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";
import type { CelEnvironment } from "./cel-environment.js";

export type ExpressionValue = { kind: "expression"; sql: string };

export const isExpressionValue = (value: unknown): value is ExpressionValue =>
	typeof value === "object" &&
	value !== null &&
	(value as Partial<ExpressionValue>).kind === "expression" &&
	typeof (value as Partial<ExpressionValue>).sql === "string";

export const escapeSqlString = (input: string): string => input.replace(/'/g, "''");

export const literal = (value: unknown): string => {
	if (value === undefined || value === null) {
		return "NULL";
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			return "NULL";
		}
		return String(value);
	}
	if (typeof value === "bigint") {
		return value.toString();
	}
	if (typeof value === "boolean") {
		return value ? "1" : "0";
	}
	if (typeof value === "string") {
		return `'${escapeSqlString(value)}'`;
	}
	if (value instanceof Uint8Array) {
		let hex = "";
		for (const byte of value) {
			hex += byte.toString(16).padStart(2, "0");
		}
		return `X'${hex}'`;
	}
	if (value instanceof Date) {
		return `'${escapeSqlString(value.toISOString())}'`;
	}
	const serialized = JSON.stringify(value);
	if (serialized === undefined) {
		return "NULL";
	}
	return `'${escapeSqlString(serialized)}'`;
};

export function deserializeJsonParameter(value: unknown): unknown {
	if (value == null) return null;
	if (typeof value !== "string") {
		return value;
	}
	return JSON.parse(value);
}

export function buildColumnValueMap(
	columns: string[],
	values: unknown[]
): Map<string, unknown> | null {
	if (columns.length !== values.length) return null;
	const map = new Map<string, unknown>();
	for (let i = 0; i < columns.length; i++) {
		const columnName = columns[i];
		if (columnName === undefined) return null;
		map.set(columnName, values[i]);
	}
	return map;
}

export function buildColumnExpressionMap(
	columns: string[],
	expressions: string[]
): Map<string, string> | null {
	if (columns.length !== expressions.length) return null;
	const map = new Map<string, string>();
	for (let i = 0; i < columns.length; i++) {
		const columnName = columns[i];
		if (columnName === undefined) return null;
		const expr = expressions[i];
		if (expr === undefined) return null;
		map.set(columnName, expr);
	}
	return map;
}

export interface PrimaryKeyDescriptor {
	readonly column: string;
	readonly rootColumn: string;
	readonly path: readonly string[];
}

export function extractPrimaryKeys(
	schema: LixSchemaDefinition
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
		const pointer = parseJsonPointer(entry);
		if (!pointer || pointer.length === 0) {
			return null;
		}
		const column = pointer[pointer.length - 1] ?? "";
		if (!column) {
			return null;
		}
		descriptors.push({
			column: column.toLowerCase(),
			rootColumn: pointer[0]!.toLowerCase(),
			path: pointer,
		});
	}
	return descriptors;
}

export function renderPointerExpression(args: {
	descriptor: PrimaryKeyDescriptor;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
}): string | null {
	const path = args.descriptor.path;
	if (path.length === 0) {
		return null;
	}
	const root = path[0]!.toLowerCase();
	const baseValue = args.columnMap.get(root);
	const baseExpr = (() => {
		const expr = args.columnExpressions.get(root);
		if (expr) return expr;
		if (baseValue === undefined) return null;
		if (isExpressionValue(baseValue)) {
			return baseValue.sql;
		}
		return literal(baseValue);
	})();
	if (!baseExpr) {
		return null;
	}
	if (path.length === 1) {
		return baseExpr;
	}
	const jsonPath = buildSqliteJsonPath(path.slice(1));
	return `json_extract(${baseExpr}, '${jsonPath}')`;
}

export function renderSnapshotValue(args: {
	definition: unknown;
	value: unknown;
	expression: string | null;
}): string {
	const { definition, value, expression } = args;
	if (expression && expression !== "NULL") {
		if (definition && typeof definition === "object" && isJsonType(definition)) {
			const trimmed = expression.trim().toLowerCase();
			if (trimmed.startsWith("json(") || trimmed.startsWith("json_quote(") || trimmed.startsWith("json_extract(") || trimmed.startsWith("json_set(") || trimmed.startsWith("case")) {
				return expression;
			}
			return `CASE WHEN json_valid(${expression}) THEN json(${expression}) ELSE json_quote(${expression}) END`;
		}
		return expression;
	}
	if (value === undefined || value === null) {
		return "NULL";
	}
	if (definition && typeof definition === "object" && isJsonType(definition)) {
		const literalExpr = literal(value);
		return `CASE WHEN json_valid(${literalExpr}) THEN json(${literalExpr}) ELSE json_quote(${literalExpr}) END`;
	}
	if (isExpressionValue(value)) {
		return value.sql;
	}
	return literal(value);
}

export function renderDefaultSnapshotValue(args: {
	propertyName: string;
	definition: unknown;
	literal: (value: unknown) => string;
	cel: CelEnvironment | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const { propertyName, definition, literal: literalFn, cel, context, resolvedDefaults } = args;

	if (resolvedDefaults.has(propertyName)) {
		const cached = resolvedDefaults.get(propertyName);
		return renderSnapshotValue({ definition, value: cached, expression: null });
	}

	if (!definition || typeof definition !== "object") {
		return "NULL";
	}

	const record = definition as Record<string, unknown>;
	const celExpression = record["x-lix-default"];
	if (typeof celExpression === "string") {
		if (!cel) {
			throw new Error(
				`Encountered x-lix-default on ${propertyName} but CEL evaluation is not initialised.`
			);
		}
		const value = cel.evaluate(celExpression, { ...context });
		resolvedDefaults.set(propertyName, value);
		return renderSnapshotValue({
			definition,
			value,
			expression: null,
		});
	}

	if (record.default !== undefined) {
		resolvedDefaults.set(propertyName, record.default);
		return literalFn(record.default);
	}

	return "NULL";
}

export function buildSnapshotObjectExpression(args: {
	schema: LixSchemaDefinition;
	columnMap: Map<string, unknown>;
	columnExpressions: Map<string, string>;
	literal: (value: unknown) => string;
	cel: CelEnvironment | null;
	context: Record<string, unknown>;
	resolvedDefaults: Map<string, unknown>;
}): string {
	const properties = Object.keys(args.schema.properties ?? {});
	if (properties.length === 0) {
		return "json_object()";
	}
	const entries: string[] = [];
	for (const prop of properties) {
		const def = (args.schema.properties ?? {})[prop];
		const lower = prop.toLowerCase();
		if (!args.columnMap.has(lower)) {
			const defaultExpr = renderDefaultSnapshotValue({
				propertyName: prop,
				definition: def,
				literal: args.literal,
				cel: args.cel,
				context: args.context,
				resolvedDefaults: args.resolvedDefaults,
			});
			entries.push(`'${escapeSqlString(prop)}', ${defaultExpr}`);
			continue;
		}
		const rawValue = args.columnMap.get(lower);
		const expression = args.columnExpressions.get(lower) ?? null;
		const snapshotExpr = renderSnapshotValue({
			definition: def,
			value: rawValue,
			expression,
		});
		entries.push(`'${escapeSqlString(prop)}', ${snapshotExpr}`);
	}
	return `json_object(${entries.join(", ")})`;
}

export function buildCelContext(args: {
	columnMap: Map<string, unknown>;
	propertyLowerToActual: Map<string, string>;
}): Record<string, unknown> {
	const context: Record<string, unknown> = {};
	for (const [lowerName, actualName] of args.propertyLowerToActual.entries()) {
		if (!args.columnMap.has(lowerName)) continue;
		const raw = args.columnMap.get(lowerName);
		if (raw === undefined || isExpressionValue(raw)) continue;
		context[actualName] = raw;
	}
	return context;
}

export function getColumnOrDefault(
	columnMap: Map<string, unknown>,
	column: string,
	fallback: unknown
): unknown {
	if (columnMap.has(column)) {
		return columnMap.get(column);
	}
	if (columnMap.has(column.toLowerCase())) {
		return columnMap.get(column.toLowerCase());
	}
	return fallback;
}

export function resolveMetadataDefaults(args: {
	defaults: unknown;
	cel: CelEnvironment | null;
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
			const normalized = normalizeOverrideValue(raw);
			resolved.set(key, normalized);
			context[key] = normalized as unknown;
		}
	}

	return resolved;
}

export function normalizeOverrideValue(value: unknown): unknown {
	if (typeof value !== "string") {
		return value;
	}
	const trimmed = value.trim();
	if (trimmed.length >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
		try {
			return JSON.parse(trimmed);
		} catch (error) {
			void error;
		}
	}
	return value;
}
export type EntityViewVariant = "base" | "all" | "history";

export function classifyViewVariant(name: string): EntityViewVariant {
	const lower = name.toLowerCase();
	if (lower.endsWith("_all")) return "all";
	if (lower.endsWith("_history")) return "history";
	return "base";
}

export function baseSchemaKey(name: string): string | null {
	const lower = name.toLowerCase();
	if (lower.endsWith("_all")) return name.slice(0, -4);
	if (lower.endsWith("_history")) return name.slice(0, -8);
	return name;
}

const VARIANT_TABLE: Record<EntityViewVariant, string> = {
	base: "state",
	all: "state_all",
	history: "state_history",
};

export function isEntityViewVariantEnabled(
	schema: LixSchemaDefinition,
	variant: EntityViewVariant
): boolean {
	const selected = schema?.["x-lix-entity-views"];
	if (!Array.isArray(selected)) {
		return true;
	}
	const viewKey = VARIANT_TABLE[variant];
	return selected.some(
		(entry): boolean =>
			typeof entry === "string" && entry.toLowerCase() === viewKey
	);
}

export function resolveStoredSchemaKey(
	schema: LixSchemaDefinition,
	fallbackKey: string
): string {
	const key = schema?.["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		return key;
	}
	return fallbackKey;
}
