import type {
	LixForeignKey,
	LixForeignKeyScopeColumn,
	LixSchemaDefinition,
} from "../../schema-definition/definition.js";
import {
	parsePointerPaths,
	buildSqliteJsonPath,
} from "../../schema-definition/json-pointer.js";

export type SchemaIndexSpec = {
	kind: "pk" | "unique" | "foreign";
	columns: string[];
	unique?: boolean;
	where?: string;
};

export type SchemaIndexStatement = SchemaIndexSpec & {
	name: string;
	sql: string;
};

export function sanitizeIdentifier(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9]/g, "_");
	return sanitized.length === 0 ? "value" : sanitized;
}

export function propertyNameToColumn(property: string): string {
	const base = sanitizeIdentifier(property);
	const normalized = /^[0-9]/.test(base) ? `_${base}` : base;
	return `x_${normalized}`;
}

export function buildSchemaIndexStatements(args: {
	schema: LixSchemaDefinition;
	tableName: string;
}): SchemaIndexStatement[] {
	const specs = buildSchemaIndexSpecs(args.schema);
	return specs.map((spec) => {
		const suffix = spec.columns
			.map((col) => col.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20))
			.join("_");
		const hash = Math.abs(hashString(`${suffix}|${spec.kind}`)).toString(36);
		const name = `idx_${args.tableName}_${spec.kind}_${suffix}_${hash}`;
		const uniqueness = spec.unique ? "UNIQUE " : "";
		const whereClause = spec.where ? ` WHERE ${spec.where}` : "";
		const expressionList = spec.columns.join(", ");
		return {
			...spec,
			name,
			sql: `CREATE ${uniqueness}INDEX IF NOT EXISTS ${name} ON ${args.tableName} (${expressionList})${whereClause}`,
		};
	});
}

const FOREIGN_SCOPE_VALUES: readonly LixForeignKeyScopeColumn[] = [
	"version_id",
	"file_id",
] as const;
const DEFAULT_FOREIGN_SCOPE: readonly LixForeignKeyScopeColumn[] = [
	"version_id",
	"file_id",
] as const;

const normalizeForeignKeyScope = (
	scope?: readonly (string | LixForeignKeyScopeColumn)[]
): LixForeignKeyScopeColumn[] | undefined => {
	if (!Array.isArray(scope)) {
		return undefined;
	}
	const normalized: LixForeignKeyScopeColumn[] = [];
	for (const value of scope) {
		if (
			FOREIGN_SCOPE_VALUES.includes(value as LixForeignKeyScopeColumn) &&
			!normalized.includes(value as LixForeignKeyScopeColumn)
		) {
			normalized.push(value as LixForeignKeyScopeColumn);
		}
	}
	return normalized;
};

export function buildSchemaIndexSpecs(
	schema: LixSchemaDefinition
): SchemaIndexSpec[] {
	const specs: SchemaIndexSpec[] = [];
	const seen = new Set<string>();

	const register = (
		spec: SchemaIndexSpec,
		options: { dedupeKey?: string } = {}
	) => {
		const key =
			options.dedupeKey ??
			`${spec.kind}|${spec.unique ? "u" : "i"}|${spec.columns.join("|")}|${
				spec.where ?? ""
			}`;
		if (seen.has(key)) {
			return;
		}
		seen.add(key);
		specs.push(spec);
	};

	const primaryKeyPaths = parsePointerPaths(schema["x-lix-primary-key"]);
	const primaryKeyColumns = pointerPathsToExpressions(primaryKeyPaths);
	if (primaryKeyColumns && primaryKeyColumns.length > 0) {
		const pkExpressions = [...primaryKeyColumns, "file_id"];
		register({
			kind: "pk",
			columns: ["version_id", ...pkExpressions],
			unique: true,
		});
	}

	const uniqueGroups = Array.isArray(schema["x-lix-unique"])
		? (schema["x-lix-unique"] as readonly (readonly string[])[])
		: [];
	for (const group of uniqueGroups) {
		const uniquePaths = parsePointerPaths(group as readonly string[]);
		const uniqueColumns = pointerPathsToExpressions(uniquePaths);
		if (uniqueColumns && uniqueColumns.length > 0) {
			const uniqueExpressions = [...uniqueColumns, "file_id"];
			register({
				kind: "unique",
				columns: ["version_id", ...uniqueExpressions],
				unique: true,
			});
		}
	}

	const foreignKeys = Array.isArray(schema["x-lix-foreign-keys"])
		? (schema["x-lix-foreign-keys"] as readonly LixForeignKey[])
		: [];
	for (const foreignKey of foreignKeys) {
		if (!foreignKey || foreignKey.mode === "materialized") {
			continue;
		}
		const localPaths = parsePointerPaths(foreignKey.properties);
		const localColumns = pointerPathsToExpressions(localPaths);
		if (localColumns && localColumns.length > 0) {
			const scopeColumns =
				normalizeForeignKeyScope(
					foreignKey.scope as readonly LixForeignKeyScopeColumn[]
				) ?? DEFAULT_FOREIGN_SCOPE;
			const leadingScope: string[] = [];
			if (scopeColumns.includes("version_id")) {
				leadingScope.push("version_id");
			}
			const trailingScope = scopeColumns.filter(
				(column) => column !== "version_id"
			);
			register({
				kind: "foreign",
				columns: [
					...leadingScope,
					"inherited_from_version_id",
					...localColumns,
					...trailingScope,
				],
			});
		}
	}

	return specs;
}

function pointerPathsToExpressions(
	paths: ReturnType<typeof parsePointerPaths>
): string[] | null {
	if (paths.length === 0) {
		return null;
	}
	const columns: string[] = [];
	for (const path of paths) {
		if (!path.segments || path.segments.length === 0) {
			return null;
		}
		const jsonPath = buildSqliteJsonPath(path.segments);
		columns.push(`json_extract(snapshot_content, '${jsonPath}')`);
	}
	return columns;
}

function hashString(input: string): number {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		hash = (hash * 31 + input.charCodeAt(i)) | 0;
	}
	return hash;
}
