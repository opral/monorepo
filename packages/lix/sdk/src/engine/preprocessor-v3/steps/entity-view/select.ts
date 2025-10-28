import type {
	ExpressionNode,
	RawFragmentNode,
	SelectExpressionNode,
	SelectItemNode,
	SelectStatementNode,
	StatementNode,
	SubqueryNode,
	TableReferenceNode,
} from "../../sql-parser/nodes.js";
import { columnReference, identifier } from "../../sql-parser/nodes.js";
import {
	getColumnName,
	getColumnQualifier,
	getIdentifierValue,
	normalizeIdentifierValue,
} from "../../sql-parser/ast-helpers.js";
import {
	visitSelectStatement,
	type AstVisitor,
} from "../../sql-parser/visitor.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";

type EntityViewVariant = "base" | "all" | "history";

type EntityViewReference = {
	readonly viewName: string;
	readonly variant: EntityViewVariant;
	readonly schemaKey: string;
	readonly alias: string | null;
	readonly binding: string;
	readonly schema: LixSchemaDefinition;
	readonly usedProperties: Set<string> | null;
	readonly usedLixcols: Set<string> | null;
};

const VARIANT_TABLE: Record<EntityViewVariant, string> = {
	base: "state",
	all: "state_all",
	history: "state_history",
};

const BASE_ALIAS: Record<EntityViewVariant, string> = {
	base: "st",
	all: "sa",
	history: "sh",
};

const BASE_META_COLUMNS = [
	{ column: "entity_id", alias: "lixcol_entity_id" },
	{ column: "schema_key", alias: "lixcol_schema_key" },
	{ column: "file_id", alias: "lixcol_file_id" },
	{ column: "plugin_key", alias: "lixcol_plugin_key" },
	{
		column: "inherited_from_version_id",
		alias: "lixcol_inherited_from_version_id",
	},
	{ column: "created_at", alias: "lixcol_created_at" },
	{ column: "updated_at", alias: "lixcol_updated_at" },
	{ column: "change_id", alias: "lixcol_change_id" },
	{ column: "untracked", alias: "lixcol_untracked" },
	{ column: "commit_id", alias: "lixcol_commit_id" },
	{ column: "writer_key", alias: "lixcol_writer_key" },
	{ column: "metadata", alias: "lixcol_metadata" },
] as const;

const ALL_META_EXTRA = [
	{ column: "version_id", alias: "lixcol_version_id" },
] as const;

const HISTORY_META_COLUMNS = [
	{ column: "entity_id", alias: "lixcol_entity_id" },
	{ column: "schema_key", alias: "lixcol_schema_key" },
	{ column: "file_id", alias: "lixcol_file_id" },
	{ column: "plugin_key", alias: "lixcol_plugin_key" },
	{ column: "schema_version", alias: "lixcol_schema_version" },
	{ column: "change_id", alias: "lixcol_change_id" },
	{ column: "commit_id", alias: "lixcol_commit_id" },
	{ column: "root_commit_id", alias: "lixcol_root_commit_id" },
	{ column: "depth", alias: "lixcol_depth" },
	{ column: "metadata", alias: "lixcol_metadata" },
] as const;

/**
 * Rewrites entity view SELECT statements to reference the underlying state
 * tables directly. This mirrors the v2 preprocessor behaviour while operating
 * on the v3 AST.
 */
export const rewriteEntityViewSelect: PreprocessorStep = (context) => {
	const node = context.node as StatementNode;
	if (node.node_kind !== "select_statement") {
		return node;
	}

	const storedSchemas = context.getStoredSchemas?.();
	if (!storedSchemas || storedSchemas.size === 0) {
		return node;
	}

	const references = collectEntityViewReferences(node, storedSchemas);
	if (references.length === 0) {
		return node;
	}

	const referenceMap = new Map<string, EntityViewReference>();
	for (const reference of references) {
		referenceMap.set(reference.binding, reference);
	}

	const tracePayload = references.map((reference) => ({
		view: reference.viewName,
		variant: reference.variant,
		schema_key: reference.schemaKey,
		alias: reference.alias,
		binding: reference.binding,
	}));
	pushTrace(context.trace, {
		step: "rewrite_entity_view_select",
		payload: tracePayload,
	});

	const rewritten = rewriteSelectStatement(node, referenceMap);
	return rewritten;
};

function collectEntityViewReferences(
	select: SelectStatementNode,
	storedSchemas: Map<string, unknown>
): EntityViewReference[] {
	const references: EntityViewReference[] = [];

	for (const fromClause of select.from_clauses) {
		references.push(
			...collectReferencesFromRelation(
				fromClause.relation,
				select,
				storedSchemas
			)
		);

		for (const join of fromClause.joins) {
			references.push(
				...collectReferencesFromRelation(join.relation, select, storedSchemas)
			);
		}
	}

	return references;
}

function collectReferencesFromRelation(
	relation: SelectStatementNode["from_clauses"][number]["relation"],
	parentSelect: SelectStatementNode,
	storedSchemas: Map<string, unknown>
): EntityViewReference[] {
	if (relation.node_kind === "table_reference") {
		const reference = resolveEntityViewReference(
			relation,
			parentSelect,
			storedSchemas
		);
		return reference ? [reference] : [];
	}

	if (relation.node_kind === "subquery") {
		return collectEntityViewReferences(relation.statement, storedSchemas);
	}

	return [];
}

function resolveEntityViewReference(
	node: TableReferenceNode,
	select: SelectStatementNode,
	storedSchemas: Map<string, unknown>
): EntityViewReference | null {
	const viewName = extractObjectName(node.name);
	if (!viewName) {
		return null;
	}

	const schema = lookupSchemaForView(viewName, storedSchemas);
	if (!schema) {
		return null;
	}

	const variant = classifyVariant(viewName);
	if (!isVariantEnabled(schema, variant)) {
		const schemaKey = resolveSchemaKey(schema);
		throw new Error(
			`Entity view '${viewName}' (${variant}) is disabled for schema '${schemaKey}'.`
		);
	}

	const schemaKey = resolveSchemaKey(schema);
	const alias = getIdentifierValue(node.alias);
	const binding = alias ?? viewName;
	const columnUsage = collectColumnUsage(select, binding);

	return {
		viewName,
		variant,
		schemaKey,
		alias,
		binding,
		schema,
		usedProperties: columnUsage.properties,
		usedLixcols: columnUsage.lixcols,
	};
}

function rewriteSelectStatement(
	select: SelectStatementNode,
	references: Map<string, EntityViewReference>
): SelectStatementNode {
	const visitor: AstVisitor = {
		subquery(node) {
			const rewritten = rewriteSelectStatement(node.statement, references);
			if (rewritten !== node.statement) {
				return {
					...node,
					statement: rewritten,
				};
			}
			return node;
		},
		table_reference(node) {
			const viewName = extractObjectName(node.name);
			if (!viewName) {
				return;
			}
			const binding = getIdentifierValue(node.alias) ?? viewName;
			const reference = references.get(binding);
			if (!reference) {
				return;
			}
			return buildEntityViewSubquery(reference);
		},
	};

	return visitSelectStatement(select, visitor);
}

function buildEntityViewSubquery(reference: EntityViewReference): SubqueryNode {
	return {
		node_kind: "subquery",
		statement: buildEntityViewSelect(reference),
		alias: identifier(reference.binding),
	};
}

function buildEntityViewSelect(
	reference: EntityViewReference
): SelectStatementNode {
	const tableName = VARIANT_TABLE[reference.variant];
	const alias = BASE_ALIAS[reference.variant];
	const properties = extractPropertyKeys(reference.schema);
	const propertySet =
		reference.usedProperties === null
			? new Set(properties)
			: new Set(
					properties.filter((property) =>
						reference.usedProperties!.has(property)
					)
				);

	const projection: SelectExpressionNode[] = [];
	const lixcolUsage = reference.usedLixcols;
	for (const property of properties) {
		if (!propertySet.has(property)) {
			continue;
		}
		projection.push(propertySelect(alias, property));
	}

	switch (reference.variant) {
		case "base":
			projection.push(
				...filterLixcolColumns(BASE_META_COLUMNS, lixcolUsage).map((column) =>
					columnSelectWithAlias(alias, column.column, column.alias)
				)
			);
			break;
		case "all":
			projection.push(
				...filterLixcolColumns(
					BASE_META_COLUMNS.filter(
						(column) => column.alias !== "lixcol_inherited_from_version_id"
					),
					lixcolUsage
				).map((column) =>
					columnSelectWithAlias(alias, column.column, column.alias)
				)
			);
			projection.push(
				...filterLixcolColumns(ALL_META_EXTRA, lixcolUsage).map((column) =>
					columnSelectWithAlias(alias, column.column, column.alias)
				)
			);
			if (
				shouldIncludeLixcolColumn(
					lixcolUsage,
					"lixcol_inherited_from_version_id"
				)
			) {
				projection.push(coalesceInheritedColumn(alias));
			}
			break;
		case "history":
			projection.push(
				...filterLixcolColumns(HISTORY_META_COLUMNS, lixcolUsage).map(
					(column) => columnSelectWithAlias(alias, column.column, column.alias)
				)
			);
			break;
	}

	if (projection.length === 0) {
		projection.push(
			columnSelectWithAlias(alias, "entity_id", "lixcol_entity_id")
		);
	}

	const whereClause: ExpressionNode = {
		node_kind: "binary_expression",
		left: columnReference([alias, "schema_key"]),
		operator: "=",
		right: {
			node_kind: "literal",
			value: reference.schemaKey,
		},
	};

	return {
		node_kind: "select_statement",
		projection,
		from_clauses: [
			{
				node_kind: "from_clause",
				relation: {
					node_kind: "table_reference",
					name: {
						node_kind: "object_name",
						parts: [identifier(tableName)],
					},
					alias: identifier(alias),
				},
				joins: [],
			},
		],
		where_clause: whereClause,
		order_by: [],
		limit: null,
		offset: null,
	};
}

function propertySelect(alias: string, property: string): SelectExpressionNode {
	const escaped = escapeJsonPathSegment(property);
	return {
		node_kind: "select_expression",
		expression: rawFragment(
			`json_extract("${alias}"."snapshot_content", '$.${escaped}')`
		),
		alias: identifier(property),
	};
}

function columnSelectWithAlias(
	alias: string,
	column: string,
	output: string
): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: columnReference([alias, column]),
		alias: identifier(output),
	};
}

function filterLixcolColumns<T extends { alias: string }>(
	columns: readonly T[],
	usage: Set<string> | null
): readonly T[] {
	if (usage === null) {
		return columns;
	}
	return columns.filter((column) => usage.has(column.alias));
}

function shouldIncludeLixcolColumn(
	usage: Set<string> | null,
	alias: string
): boolean {
	return usage === null || usage.has(alias);
}

function coalesceInheritedColumn(alias: string): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: rawFragment(
			`COALESCE("${alias}"."inherited_from_version_id", "${alias}"."version_id")`
		),
		alias: identifier("lixcol_inherited_from_version_id"),
	};
}

type ColumnUsage = {
	properties: Set<string> | null;
	lixcols: Set<string> | null;
};

function collectColumnUsage(
	select: SelectStatementNode,
	binding: string
): ColumnUsage {
	const normalizedBinding = normalizeIdentifierValue(binding);
	const properties = new Set<string>();
	const lixcols = new Set<string>();
	let selectAll = false;

	for (const item of select.projection) {
		selectAll = processSelectItem(item, normalizedBinding, properties, lixcols);
		if (selectAll) {
			return { properties: null, lixcols: null };
		}
	}

	if (select.where_clause) {
		collectColumnsFromExpression(
			select.where_clause,
			normalizedBinding,
			properties,
			lixcols
		);
	}

	for (const orderItem of select.order_by) {
		collectColumnsFromExpression(
			orderItem.expression,
			normalizedBinding,
			properties,
			lixcols
		);
	}

	return {
		properties,
		lixcols,
	};
}

function processSelectItem(
	item: SelectItemNode,
	binding: string,
	properties: Set<string>,
	lixcols: Set<string>
): boolean {
	switch (item.node_kind) {
		case "select_star":
			return true;
		case "select_qualified_star": {
			const qualifier = item.qualifier.at(-1);
			if (!qualifier) {
				return true;
			}
			return normalizeIdentifierValue(qualifier.value) === binding;
		}
		case "select_expression":
			collectColumnsFromExpression(
				item.expression,
				binding,
				properties,
				lixcols
			);
			return false;
		default:
			return false;
	}
}

function collectColumnsFromExpression(
	expression: ExpressionNode,
	binding: string,
	properties: Set<string>,
	lixcols: Set<string>
) {
	switch (expression.node_kind) {
		case "column_reference": {
			const qualifier = getColumnQualifier(expression);
			if (
				qualifier === null ||
				normalizeIdentifierValue(qualifier) === binding
			) {
				const column = getColumnName(expression);
				if (column.startsWith("lixcol_")) {
					lixcols.add(column);
				} else {
					properties.add(column);
				}
			}
			break;
		}
		case "grouped_expression":
			collectColumnsFromExpression(
				expression.expression,
				binding,
				properties,
				lixcols
			);
			break;
		case "binary_expression":
			collectColumnsFromExpression(
				expression.left,
				binding,
				properties,
				lixcols
			);
			collectColumnsFromExpression(
				expression.right,
				binding,
				properties,
				lixcols
			);
			break;
		case "unary_expression":
			collectColumnsFromExpression(
				expression.operand,
				binding,
				properties,
				lixcols
			);
			break;
		case "in_list_expression":
			collectColumnsFromExpression(
				expression.operand,
				binding,
				properties,
				lixcols
			);
			for (const item of expression.items) {
				collectColumnsFromExpression(item, binding, properties, lixcols);
			}
			break;
		case "between_expression":
			collectColumnsFromExpression(
				expression.operand,
				binding,
				properties,
				lixcols
			);
			collectColumnsFromExpression(
				expression.start,
				binding,
				properties,
				lixcols
			);
			collectColumnsFromExpression(
				expression.end,
				binding,
				properties,
				lixcols
			);
			break;
		default:
			break;
	}
}

function classifyVariant(viewName: string): EntityViewVariant {
	const normalized = viewName.toLowerCase();
	if (normalized.endsWith("_history")) {
		return "history";
	}
	if (normalized.endsWith("_all")) {
		return "all";
	}
	return "base";
}

function lookupSchemaForView(
	viewName: string,
	storedSchemas: Map<string, unknown>
): LixSchemaDefinition | undefined {
	const baseKey = stripVariantSuffix(viewName);
	return (
		(storedSchemas.get(viewName) as LixSchemaDefinition | undefined) ??
		(storedSchemas.get(baseKey) as LixSchemaDefinition | undefined)
	);
}

function stripVariantSuffix(viewName: string): string {
	return viewName.replace(/_(all|history)$/i, "");
}

function resolveSchemaKey(schema: LixSchemaDefinition): string {
	const key = schema["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		return key;
	}
	throw new Error("Stored schema is missing x-lix-key.");
}

function isVariantEnabled(
	schema: LixSchemaDefinition,
	variant: EntityViewVariant
): boolean {
	const views = schema["x-lix-entity-views"];
	if (!Array.isArray(views)) {
		return true;
	}
	const target = VARIANT_TABLE[variant];
	return views.some(
		(entry) => typeof entry === "string" && entry.toLowerCase() === target
	);
}

function extractPropertyKeys(schema: LixSchemaDefinition): string[] {
	const properties = schema.properties;
	if (!properties || typeof properties !== "object") {
		return [];
	}
	return Object.keys(properties as Record<string, unknown>).sort();
}

function escapeJsonPathSegment(segment: string): string {
	return segment.replace(/'/g, "''");
}

function extractObjectName(name: TableReferenceNode["name"]): string | null {
	const parts = name.parts;
	if (parts.length === 0) {
		return null;
	}
	return parts[parts.length - 1]?.value ?? null;
}

function rawFragment(sql: string): RawFragmentNode {
	return {
		node_kind: "raw_fragment",
		sql_text: sql,
	};
}

function pushTrace(
	trace: PreprocessorTraceEntry[] | undefined,
	entry: PreprocessorTraceEntry
) {
	if (!trace) {
		return;
	}
	trace.push(entry);
}
