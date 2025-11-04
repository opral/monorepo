import {
	AliasNode,
	IdentifierNode,
	JoinNode,
	SelectQueryNode,
	TableNode,
	FromNode,
	type OperationNode,
	type RootOperationNode,
	type SchemableIdentifierNode,
} from "kysely";
import { sql } from "kysely";
import type { PreprocessorStep } from "../../types.js";
import { internalQueryBuilder } from "../../../internal-query-builder.js";
import type { LixSchemaDefinition } from "../../../../schema-definition/definition.js";

type EntityViewVariant = "base" | "by_version" | "history";

interface EntityViewReference {
	readonly viewName: string;
	readonly variant: EntityViewVariant;
	readonly schemaKey: string;
	readonly alias: string | null;
	readonly binding: string;
	readonly schema: LixSchemaDefinition;
}

/**
 * Placeholder transformer for entity-view SELECT queries.
 *
 * Future implementations will analyse the select node, prune projections,
 * and hoist the internal state rewrite CTE. Until then we return the input
 * unchanged to keep the pipeline behaviour stable.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityViewSelect({
 *   node: operationNode,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteEntityViewSelect: PreprocessorStep = (context) => {
	const select = SelectQueryNode.is(context.node)
		? context.node
		: extractSelectQuery(context.node);

	const references = select
		? collectEntityViewReferences(select, context.storedSchemas)
		: [];
	const referenceMap = new Map<string, EntityViewReference>();
	for (const reference of references) {
		referenceMap.set(reference.binding, reference);
	}

	context.trace?.push({
		step: "rewrite_entity_view_select",
		payload:
			references.length > 0
				? references.map((ref) => ({
						view: ref.viewName,
						variant: ref.variant,
						schema_key: ref.schemaKey,
						alias: ref.alias,
						binding: ref.binding,
					}))
				: null,
	});

	if (!select || referenceMap.size === 0) {
		return context.node;
	}

	const rewritten = rewriteSelectQuery(select, referenceMap);
	return rewritten;
};

function extractSelectQuery(node: RootOperationNode): SelectQueryNode | null {
	if (SelectQueryNode.is(node)) {
		return node;
	}
	return null;
}

function collectEntityViewReferences(
	select: SelectQueryNode,
	storedSchemas: Map<string, unknown>
): EntityViewReference[] {
	const references: EntityViewReference[] = [];
	if (select.from?.froms) {
		for (const candidate of select.from.froms) {
			if (AliasNode.is(candidate) && SelectQueryNode.is(candidate.node)) {
				references.push(
					...collectEntityViewReferences(candidate.node, storedSchemas)
				);
				continue;
			}
			const reference = resolveEntityViewReference(candidate, storedSchemas);
			if (reference) {
				references.push(reference);
			}
		}
	}
	if (select.joins) {
		for (const join of select.joins) {
			if (AliasNode.is(join.table) && SelectQueryNode.is(join.table.node)) {
				references.push(
					...collectEntityViewReferences(join.table.node, storedSchemas)
				);
				continue;
			}
			const reference = resolveEntityViewReference(join.table, storedSchemas);
			if (reference) {
				references.push(reference);
			}
		}
	}
	if (select.setOperations) {
		for (const operation of select.setOperations) {
			const expression = operation.expression;
			if (SelectQueryNode.is(expression)) {
				references.push(
					...collectEntityViewReferences(expression, storedSchemas)
				);
			} else {
				const nested = resolveEntityViewReference(expression, storedSchemas);
				if (nested) {
					references.push(nested);
				}
			}
		}
	}
	return references;
}

function resolveEntityViewReference(
	node: OperationNode,
	storedSchemas: Map<string, unknown>
): EntityViewReference | null {
	let tableNode: TableNode | null = null;
	let alias: string | null = null;

	if (AliasNode.is(node)) {
		const inner = node.node;
		if (!TableNode.is(inner)) {
			return null;
		}
		tableNode = inner;
		alias = IdentifierNode.is(node.alias) ? node.alias.name : null;
	} else if (TableNode.is(node)) {
		tableNode = node;
	} else {
		return null;
	}

	if (!tableNode) {
		return null;
	}

	const tableId = tableNode.table;
	if (!isPlainIdentifier(tableId)) {
		return null;
	}

	const viewName = tableId.identifier.name;
	const schema = storedSchemas.get(viewName) as LixSchemaDefinition | undefined;
	if (!schema) {
		return null;
	}
	const variant = classifyVariant(viewName);

	if (!isVariantEnabled(schema, variant)) {
		const schemaKey =
			typeof schema["x-lix-key"] === "string" ? schema["x-lix-key"] : "unknown";
		throw new Error(
			`Entity view '${viewName}' (${variant}) is disabled for schema '${schemaKey}'.`
		);
	}

	return {
		viewName,
		variant,
		schemaKey: resolveSchemaKey(schema),
		alias,
		binding: alias ?? viewName,
		schema,
	};
}

function classifyVariant(name: string): EntityViewVariant {
	const lower = name.toLowerCase();
	if (lower.endsWith("_history")) {
		return "history";
	}
	if (lower.endsWith("_by_version")) {
		return "by_version";
	}
	return "base";
}

function resolveSchemaKey(schema: LixSchemaDefinition): string {
	const key = schema["x-lix-key"];
	if (typeof key === "string" && key.length > 0) {
		return key;
	}
	throw new Error("Stored schema is missing x-lix-key.");
}

const VARIANT_KEY: Record<EntityViewVariant, string> = {
	base: "state",
	by_version: "state_by_version",
	history: "state_history",
};

function isVariantEnabled(
	schema: LixSchemaDefinition,
	variant: EntityViewVariant
): boolean {
	const selected = schema["x-lix-entity-views"];
	if (!Array.isArray(selected)) {
		return true;
	}
	const target = VARIANT_KEY[variant];
	return selected.some(
		(entry) => typeof entry === "string" && entry.toLowerCase() === target
	);
}

function isPlainIdentifier(
	node: SchemableIdentifierNode
): node is SchemableIdentifierNode & {
	identifier: { name: string };
} {
	return (
		node.kind === "SchemableIdentifierNode" &&
		node.schema === undefined &&
		IdentifierNode.is(node.identifier)
	);
}

function rewriteSelectQuery(
	select: SelectQueryNode,
	references: Map<string, EntityViewReference>
): SelectQueryNode {
	let mutated = false;

	let fromNode = select.from;
	if (fromNode?.froms) {
		const rewrittenFroms = fromNode.froms.map((candidate) => {
			const rewritten = rewriteRelation(candidate, references);
			if (rewritten !== candidate) {
				mutated = true;
			}
			return rewritten;
		});
		if (mutated) {
			fromNode = FromNode.create(rewrittenFroms);
		}
	}

	let joins = select.joins;
	if (joins && joins.length > 0) {
		const rewrittenJoins = joins.map((join) => {
			const rewrittenTable = rewriteRelation(join.table, references);
			if (rewrittenTable !== join.table) {
				mutated = true;
				return Object.freeze({
					...join,
					table: rewrittenTable,
				}) as JoinNode;
			}
			return join;
		});
		if (mutated) {
			joins = Object.freeze(rewrittenJoins);
		}
	}

	let setOperations = select.setOperations;
	if (setOperations && setOperations.length > 0) {
		const rewrittenOperations = setOperations.map((operation) => {
			const rewrittenExpression = rewriteSetOperationExpression(
				operation.expression,
				references
			);
			if (rewrittenExpression !== operation.expression) {
				mutated = true;
				return Object.freeze({
					...operation,
					expression: rewrittenExpression,
				}) as typeof operation;
			}
			return operation;
		});
		if (mutated) {
			setOperations = Object.freeze(rewrittenOperations);
		}
	}

	if (!mutated) {
		return select;
	}

	return Object.freeze({
		...select,
		from: fromNode,
		joins,
		setOperations,
	});
}

function rewriteSetOperationExpression(
	expression: OperationNode,
	references: Map<string, EntityViewReference>
): OperationNode {
	if (AliasNode.is(expression)) {
		const rewrittenInner = rewriteSetOperationExpression(
			expression.node,
			references
		);
		if (rewrittenInner !== expression.node) {
			return AliasNode.create(rewrittenInner, expression.alias);
		}
		return expression;
	}
	if (SelectQueryNode.is(expression)) {
		return rewriteSelectQuery(expression, references);
	}
	return rewriteRelation(expression, references);
}

function rewriteRelation(
	node: OperationNode,
	references: Map<string, EntityViewReference>
): OperationNode {
	if (AliasNode.is(node)) {
		if (SelectQueryNode.is(node.node)) {
			const rewrittenSubquery = rewriteSelectQuery(node.node, references);
			if (rewrittenSubquery !== node.node) {
				return AliasNode.create(rewrittenSubquery, node.alias);
			}
			return node;
		}
		if (!TableNode.is(node.node) || !isPlainIdentifier(node.node.table)) {
			return node;
		}
		const aliasName = IdentifierNode.is(node.alias) ? node.alias.name : null;
		const binding = aliasName ?? node.node.table.identifier.name;
		const reference = references.get(binding);
		if (!reference) {
			return node;
		}
		return createEntityViewAlias(reference);
	}

	if (TableNode.is(node) && isPlainIdentifier(node.table)) {
		const binding = node.table.identifier.name;
		const reference = references.get(binding);
		if (!reference) {
			return node;
		}
		return createEntityViewAlias(reference);
	}

	return node;
}

function createEntityViewAlias(reference: EntityViewReference): AliasNode {
	const aliasName = reference.binding;
	const subquery = buildEntityViewSubquery(reference);
	return AliasNode.create(subquery, IdentifierNode.create(aliasName));
}

function buildEntityViewSubquery(
	reference: EntityViewReference
): SelectQueryNode {
	switch (reference.variant) {
		case "base":
			return buildBaseEntityView(reference);
		case "by_version":
			return buildAllEntityView(reference);
		case "history":
			return buildHistoryEntityView(reference);
		default:
			return buildBaseEntityView(reference);
	}
}

function buildBaseEntityView(reference: EntityViewReference): SelectQueryNode {
	const alias = "st";
	const qb = internalQueryBuilder as any;
	const properties = extractPropertyKeys(reference.schema);

	const builder = qb
		.selectFrom(`state as ${alias}`)
		.select((eb: any) => {
			const selections = buildPropertySelections(eb, alias, properties);
			selections.push(eb.ref(`${alias}.entity_id`).as("lixcol_entity_id"));
			selections.push(eb.ref(`${alias}.schema_key`).as("lixcol_schema_key"));
			selections.push(eb.ref(`${alias}.file_id`).as("lixcol_file_id"));
			selections.push(eb.ref(`${alias}.plugin_key`).as("lixcol_plugin_key"));
			selections.push(
				eb
					.ref(`${alias}.inherited_from_version_id`)
					.as("lixcol_inherited_from_version_id")
			);
			selections.push(eb.ref(`${alias}.created_at`).as("lixcol_created_at"));
			selections.push(eb.ref(`${alias}.updated_at`).as("lixcol_updated_at"));
			selections.push(eb.ref(`${alias}.change_id`).as("lixcol_change_id"));
			selections.push(eb.ref(`${alias}.untracked`).as("lixcol_untracked"));
			selections.push(eb.ref(`${alias}.commit_id`).as("lixcol_commit_id"));
			selections.push(eb.ref(`${alias}.writer_key`).as("lixcol_writer_key"));
			selections.push(eb.ref(`${alias}.metadata`).as("lixcol_metadata"));
			return selections;
		})
		.where(literalEquals(alias, "schema_key", reference.schemaKey));

	return builder.toOperationNode() as SelectQueryNode;
}

function buildAllEntityView(reference: EntityViewReference): SelectQueryNode {
	const alias = "sa";
	const qb = internalQueryBuilder as any;
	const properties = extractPropertyKeys(reference.schema);

	const builder = qb
		.selectFrom(`state_by_version as ${alias}`)
		.select((eb: any) => {
			const selections = buildPropertySelections(eb, alias, properties);
			selections.push(eb.ref(`${alias}.entity_id`).as("lixcol_entity_id"));
			selections.push(eb.ref(`${alias}.schema_key`).as("lixcol_schema_key"));
			selections.push(eb.ref(`${alias}.file_id`).as("lixcol_file_id"));
			selections.push(eb.ref(`${alias}.plugin_key`).as("lixcol_plugin_key"));
			selections.push(eb.ref(`${alias}.version_id`).as("lixcol_version_id"));
			selections.push(
				sql`COALESCE(${eb.ref(`${alias}.inherited_from_version_id`)}, ${eb.ref(`${alias}.version_id`)})`.as(
					"lixcol_inherited_from_version_id"
				)
			);
			selections.push(eb.ref(`${alias}.created_at`).as("lixcol_created_at"));
			selections.push(eb.ref(`${alias}.updated_at`).as("lixcol_updated_at"));
			selections.push(eb.ref(`${alias}.change_id`).as("lixcol_change_id"));
			selections.push(eb.ref(`${alias}.untracked`).as("lixcol_untracked"));
			selections.push(eb.ref(`${alias}.commit_id`).as("lixcol_commit_id"));
			selections.push(eb.ref(`${alias}.metadata`).as("lixcol_metadata"));
			return selections;
		})
		.where(literalEquals(alias, "schema_key", reference.schemaKey));

	return builder.toOperationNode() as SelectQueryNode;
}

function buildHistoryEntityView(
	reference: EntityViewReference
): SelectQueryNode {
	const alias = "sh";
	const qb = internalQueryBuilder as any;
	const properties = extractPropertyKeys(reference.schema);

	const builder = qb
		.selectFrom(`state_history as ${alias}`)
		.select((eb: any) => {
			const selections = buildPropertySelections(eb, alias, properties);
			selections.push(eb.ref(`${alias}.entity_id`).as("lixcol_entity_id"));
			selections.push(eb.ref(`${alias}.schema_key`).as("lixcol_schema_key"));
			selections.push(eb.ref(`${alias}.file_id`).as("lixcol_file_id"));
			selections.push(eb.ref(`${alias}.plugin_key`).as("lixcol_plugin_key"));
			selections.push(
				eb.ref(`${alias}.schema_version`).as("lixcol_schema_version")
			);
			selections.push(eb.ref(`${alias}.change_id`).as("lixcol_change_id"));
			selections.push(eb.ref(`${alias}.commit_id`).as("lixcol_commit_id"));
			selections.push(
				eb.ref(`${alias}.root_commit_id`).as("lixcol_root_commit_id")
			);
			selections.push(eb.ref(`${alias}.depth`).as("lixcol_depth"));
			selections.push(eb.ref(`${alias}.metadata`).as("lixcol_metadata"));
			return selections;
		})
		.where(literalEquals(alias, "schema_key", reference.schemaKey));

	return builder.toOperationNode() as SelectQueryNode;
}

function buildPropertySelections(
	eb: any,
	alias: string,
	properties: readonly string[]
) {
	return properties.map((prop) =>
		sql`json_extract(${eb.ref(`${alias}.snapshot_content`)}, ${sql.raw(`'$.${escapeJsonPathSegment(prop)}'`)})`.as(
			prop
		)
	);
}

function extractPropertyKeys(schema: LixSchemaDefinition): string[] {
	const source = schema.properties;
	if (!source || typeof source !== "object") {
		return [];
	}
	return Object.keys(source as Record<string, unknown>).sort();
}

function escapeJsonPathSegment(segment: string): string {
	return segment.replace(/'/g, "''");
}

function literalEquals(alias: string, column: string, value: string) {
	return sql`${sql.raw(`${alias}.${column}`)} = ${sql.raw(
		`'${escapeSqlLiteral(value)}'`
	)}`;
}

function escapeSqlLiteral(value: string): string {
	return value.replace(/'/g, "''");
}
