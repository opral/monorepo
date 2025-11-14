import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import {
	identifier,
	columnReference,
	type SegmentedStatementNode,
	type SelectStatementNode,
	type CompoundSelectNode,
	type SelectItemNode,
	type SelectExpressionNode,
	type ExpressionNode,
	type RawFragmentNode,
	type FromClauseNode,
	type RelationNode,
	type TableReferenceNode,
	type JoinClauseNode,
	type IdentifierNode,
	type ObjectNameNode,
	type OrderByItemNode,
	type SubqueryNode,
	type ColumnReferenceNode,
	type SubqueryExpressionNode,
	type FunctionCallArgumentNode,
	type CaseWhenNode,
	type BinaryExpressionNode,
	type BinaryOperator,
	type LiteralNode,
	type WithClauseNode,
	type WindowSpecificationNode,
	type WindowReferenceNode,
	type WindowFrameNode,
} from "../sql-parser/nodes.js";
import type { PreprocessorStep, PreprocessorStepContext } from "../types.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";
import { buildSqliteJsonPath } from "../../../schema-definition/json-pointer.js";
import {
	collectPointerColumnDescriptors,
	isEntityViewVariantEnabled,
	classifyViewVariant,
	baseSchemaKey,
	resolveSchemaDefinition,
	resolveStoredSchemaKey,
	combineWithAnd,
} from "./shared.js";

export const rewriteEntityViewSelect: PreprocessorStep = (context) => {
	const storedSchemas = context.getStoredSchemas?.() as
		| Map<string, LixSchemaDefinition>
		| undefined;
	if (!storedSchemas || storedSchemas.size === 0) {
		return context.statements;
	}

	let anyChanges = false;
	const rewritten = context.statements.map((statement) => {
		const result = rewriteSegmentedStatement(statement, context, storedSchemas);
		if (result !== statement) {
			anyChanges = true;
		}
		return result;
	});

	return anyChanges ? rewritten : context.statements;
};

type EntityViewVariant = "base" | "by_version" | "history";
function rewriteSegmentedStatement(
	statement: SegmentedStatementNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): SegmentedStatementNode {
	let changed = false;
	const segments = statement.segments.map((segment) => {
		if (segment.node_kind === "select_statement") {
			const rewritten = rewriteSelectStatementNode(
				segment,
				context,
				storedSchemas
			);
			if (rewritten !== segment) {
				changed = true;
			}
			return rewritten;
		}
		if (segment.node_kind === "compound_select") {
			const rewritten = rewriteCompoundSelectNode(
				segment,
				context,
				storedSchemas
			);
			if (rewritten !== segment) {
				changed = true;
			}
			return rewritten;
		}
		return segment;
	});

	if (!changed) {
		return statement;
	}

	return normalizeSegmentedStatement({
		...statement,
		segments,
	});
}
function rewriteSelectStatementNode(
	statement: SelectStatementNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): SelectStatementNode {
	let changed = false;

	const withClause = rewriteWithClause(
		statement.with_clause,
		context,
		storedSchemas
	);
	if (withClause !== statement.with_clause) {
		changed = true;
	}

	const projection = statement.projection.map((item) =>
		rewriteSelectItem(item, context, storedSchemas)
	);
	if (
		!projection.every((item, index) => item === statement.projection[index])
	) {
		changed = true;
	}

	const columnUsage = collectStatementColumnUsage(statement);
	const fromResult = rewriteFromClauses(
		statement.from_clauses,
		context,
		storedSchemas,
		columnUsage
	);
	if (fromResult.changed) {
		changed = true;
	}

	const whereClause = rewriteExpressionOrFragment(
		statement.where_clause,
		context,
		storedSchemas
	);
	if (whereClause !== statement.where_clause) {
		changed = true;
	}

	const groupBy = rewriteExpressionArray(
		statement.group_by,
		context,
		storedSchemas
	);
	if (!groupBy.every((expr, index) => expr === statement.group_by[index])) {
		changed = true;
	}

	const orderBy = rewriteOrderByArray(
		statement.order_by,
		context,
		storedSchemas
	);
	if (!orderBy.every((item, index) => item === statement.order_by[index])) {
		changed = true;
	}

	const limit = rewriteExpressionOrFragment(
		statement.limit,
		context,
		storedSchemas
	);
	if (limit !== statement.limit) {
		changed = true;
	}

	const offset = rewriteExpressionOrFragment(
		statement.offset,
		context,
		storedSchemas
	);
	if (offset !== statement.offset) {
		changed = true;
	}

	const updatedFromClauses = fromResult.clauses;

	if (!changed) {
		return statement;
	}

	return {
		...statement,
		with_clause: withClause,
		projection,
		from_clauses: updatedFromClauses,
		where_clause: whereClause,
		group_by: groupBy,
		order_by: orderBy,
		limit,
		offset,
	};
}
function rewriteCompoundSelectNode(
	statement: CompoundSelectNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): CompoundSelectNode {
	let changed = false;
	const withClause = rewriteWithClause(
		statement.with_clause,
		context,
		storedSchemas
	);
	if (withClause !== statement.with_clause) {
		changed = true;
	}

	const first = rewriteSelectStatementNode(
		statement.first,
		context,
		storedSchemas
	);
	if (first !== statement.first) {
		changed = true;
	}

	const compounds = statement.compounds.map((branch) => {
		const rewrittenSelect = rewriteSelectStatementNode(
			branch.select,
			context,
			storedSchemas
		);
		if (rewrittenSelect !== branch.select) {
			changed = true;
			return {
				...branch,
				select: rewrittenSelect,
			};
		}
		return branch;
	});

	const orderBy = rewriteOrderByArray(
		statement.order_by,
		context,
		storedSchemas
	);
	if (!orderBy.every((item, index) => item === statement.order_by[index])) {
		changed = true;
	}

	const limit = rewriteExpressionOrFragment(
		statement.limit,
		context,
		storedSchemas
	);
	if (limit !== statement.limit) {
		changed = true;
	}

	const offset = rewriteExpressionOrFragment(
		statement.offset,
		context,
		storedSchemas
	);
	if (offset !== statement.offset) {
		changed = true;
	}

	if (!changed) {
		return statement;
	}

	return {
		...statement,
		with_clause: withClause,
		first,
		compounds,
		order_by: orderBy,
		limit,
		offset,
	};
}
function rewriteWithClause(
	withClause: WithClauseNode | null,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): WithClauseNode | null {
	if (!withClause) {
		return null;
	}

	let changed = false;
	const ctes = withClause.ctes.map((cte) => {
		const rewrittenStatement = rewriteStatementNode(
			cte.statement,
			context,
			storedSchemas
		);
		if (rewrittenStatement !== cte.statement) {
			changed = true;
			return {
				...cte,
				statement: rewrittenStatement,
			};
		}
		return cte;
	});

	if (!changed) {
		return withClause;
	}

	return {
		...withClause,
		ctes,
	};
}
function rewriteStatementNode(
	statement: SelectStatementNode | CompoundSelectNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): SelectStatementNode | CompoundSelectNode {
	if (statement.node_kind === "select_statement") {
		return rewriteSelectStatementNode(statement, context, storedSchemas);
	}
	return rewriteCompoundSelectNode(statement, context, storedSchemas);
}
function rewriteSelectItem(
	item: SelectItemNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): SelectItemNode {
	if (item.node_kind !== "select_expression") {
		return item;
	}
	const rewritten = rewriteExpressionNode(
		item.expression,
		context,
		storedSchemas
	);
	if (rewritten === item.expression) {
		return item;
	}
	return {
		...item,
		expression: rewritten,
	};
}
function rewriteExpressionOrFragment(
	expression: ExpressionNode | RawFragmentNode | null,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): ExpressionNode | RawFragmentNode | null {
	if (!expression) {
		return null;
	}
	if ("sql_text" in expression) {
		return expression;
	}
	const rewritten = rewriteExpressionNode(expression, context, storedSchemas);
	return rewritten;
}
function rewriteExpressionArray(
	expressions: readonly ExpressionNode[],
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): ExpressionNode[] {
	let changed = false;
	const rewritten = expressions.map((expression) => {
		const next = rewriteExpressionNode(expression, context, storedSchemas);
		if (next !== expression) {
			changed = true;
		}
		return next;
	});
	return changed ? rewritten : (expressions as ExpressionNode[]);
}
function rewriteOrderByArray(
	items: readonly OrderByItemNode[],
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): OrderByItemNode[] {
	let changed = false;
	const rewritten = items.map((item) => {
		const expression = rewriteExpressionNode(
			item.expression,
			context,
			storedSchemas
		);
		if (expression !== item.expression) {
			changed = true;
			return {
				...item,
				expression,
			};
		}
		return item;
	});
	return changed ? rewritten : (items as OrderByItemNode[]);
}
function rewriteExpressionNode(
	expression: ExpressionNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): ExpressionNode {
	switch (expression.node_kind) {
		case "binary_expression": {
			const left = rewriteExpressionNode(
				expression.left,
				context,
				storedSchemas
			);
			const right = rewriteExpressionNode(
				expression.right,
				context,
				storedSchemas
			);
			if (left === expression.left && right === expression.right) {
				return expression;
			}
			return {
				...expression,
				left,
				right,
			};
		}
		case "unary_expression": {
			const operand = rewriteExpressionNode(
				expression.operand,
				context,
				storedSchemas
			);
			if (operand === expression.operand) {
				return expression;
			}
			return {
				...expression,
				operand,
			};
		}
		case "grouped_expression": {
			const inner = rewriteExpressionNode(
				expression.expression,
				context,
				storedSchemas
			);
			if (inner === expression.expression) {
				return expression;
			}
			return {
				...expression,
				expression: inner,
			};
		}
		case "function_call": {
			let changed = false;
			const args: FunctionCallArgumentNode[] = expression.arguments.map(
				(arg) => {
					if (arg.node_kind === "all_columns") {
						return arg;
					}
					const rewritten = rewriteExpressionNode(arg, context, storedSchemas);
					if (rewritten !== arg) {
						changed = true;
					}
					return rewritten;
				}
			);
			const over = rewriteWindowSpecificationOrReference(
				expression.over,
				context,
				storedSchemas
			);
			if (!changed && over === expression.over) {
				return expression;
			}
			return {
				...expression,
				arguments: args,
				over,
			};
		}
		case "in_list_expression": {
			const operand = rewriteExpressionNode(
				expression.operand,
				context,
				storedSchemas
			);
			let changed = operand !== expression.operand;
			const items = expression.items.map((item) => {
				const next = rewriteExpressionNode(item, context, storedSchemas);
				if (next !== item) {
					changed = true;
				}
				return next;
			});
			if (!changed) {
				return expression;
			}
			return {
				...expression,
				operand,
				items,
			};
		}
		case "between_expression": {
			const operand = rewriteExpressionNode(
				expression.operand,
				context,
				storedSchemas
			);
			const start = rewriteExpressionNode(
				expression.start,
				context,
				storedSchemas
			);
			const end = rewriteExpressionNode(expression.end, context, storedSchemas);
			if (
				operand === expression.operand &&
				start === expression.start &&
				end === expression.end
			) {
				return expression;
			}
			return {
				...expression,
				operand,
				start,
				end,
			};
		}
		case "case_expression": {
			let changed = false;
			const operand = expression.operand
				? rewriteExpressionNode(expression.operand, context, storedSchemas)
				: null;
			if (operand && expression.operand && operand !== expression.operand) {
				changed = true;
			}
			const branches: CaseWhenNode[] = expression.branches.map((branch) => {
				const condition = rewriteExpressionNode(
					branch.condition,
					context,
					storedSchemas
				);
				const result = rewriteExpressionNode(
					branch.result,
					context,
					storedSchemas
				);
				if (condition !== branch.condition || result !== branch.result) {
					changed = true;
					return {
						condition,
						result,
					};
				}
				return branch;
			});
			const elseResult = expression.else_result
				? rewriteExpressionNode(expression.else_result, context, storedSchemas)
				: null;
			if (
				elseResult &&
				expression.else_result &&
				elseResult !== expression.else_result
			) {
				changed = true;
			}
			if (!changed) {
				return expression;
			}
			return {
				...expression,
				operand,
				branches,
				else_result: elseResult,
			};
		}
		case "subquery_expression": {
			const statement = rewriteStatementNode(
				expression.statement,
				context,
				storedSchemas
			);
			if (statement === expression.statement) {
				return expression;
			}
			return {
				...expression,
				statement,
			};
		}
		case "exists_expression": {
			const statement = rewriteStatementNode(
				expression.statement,
				context,
				storedSchemas
			);
			if (statement === expression.statement) {
				return expression;
			}
			return {
				...expression,
				statement,
			};
		}
		case "raw_fragment":
		case "literal":
		case "parameter":
		case "column_reference":
			return expression;
		default:
			return expression;
	}
}
function rewriteWindowSpecificationOrReference(
	over: WindowSpecificationNode | WindowReferenceNode | null,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): WindowSpecificationNode | WindowReferenceNode | null {
	if (!over) {
		return null;
	}
	if (over.node_kind === "window_reference") {
		return over;
	}
	let changed = false;
	const partitionBy = over.partition_by.map((expression) => {
		const rewritten = rewriteExpressionNode(expression, context, storedSchemas);
		if (rewritten !== expression) {
			changed = true;
		}
		return rewritten;
	});
	const orderBy = over.order_by.map((item) => {
		const rewritten = rewriteExpressionNode(
			item.expression,
			context,
			storedSchemas
		);
		if (rewritten !== item.expression) {
			changed = true;
			return {
				...item,
				expression: rewritten,
			};
		}
		return item;
	});
	const frame = over.frame
		? rewriteWindowFrame(over.frame, context, storedSchemas)
		: null;
	if (frame && over.frame && frame !== over.frame) {
		changed = true;
	}
	if (!changed) {
		return over;
	}
	return {
		...over,
		partition_by: partitionBy,
		order_by: orderBy,
		frame,
	};
}

function rewriteWindowFrame(
	frame: WindowFrameNode,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>
): WindowFrameNode {
	let changed = false;
	const startOffset = frame.start.offset
		? rewriteExpressionNode(frame.start.offset, context, storedSchemas)
		: null;
	let startBound = frame.start;
	if (frame.start.offset && startOffset && startOffset !== frame.start.offset) {
		changed = true;
		startBound = {
			...frame.start,
			offset: startOffset,
		};
	}

	let endBound = frame.end ?? null;
	if (frame.end?.offset) {
		const endOffset = rewriteExpressionNode(
			frame.end.offset,
			context,
			storedSchemas
		);
		if (endOffset !== frame.end.offset) {
			changed = true;
			endBound = {
				...frame.end,
				offset: endOffset,
			};
		}
	}

	if (!changed) {
		return frame;
	}

	return {
		...frame,
		start: startBound,
		end: endBound,
	};
}
function rewriteFromClauses(
	clauses: readonly FromClauseNode[],
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>,
	columnUsage: StatementColumnUsage
): { clauses: FromClauseNode[]; changed: boolean } {
	let changed = false;
	const rewritten = clauses.map((clause, clauseIndex) => {
		const result = rewriteFromClause(
			clause,
			clauseIndex,
			context,
			storedSchemas,
			columnUsage
		);
		if (result.changed) {
			changed = true;
		}
		return result.changed ? result.clause : clause;
	});
	return {
		clauses: changed ? rewritten : (clauses as FromClauseNode[]),
		changed,
	};
}

function rewriteFromClause(
	clause: FromClauseNode,
	clauseIndex: number,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>,
	columnUsage: StatementColumnUsage
): { clause: FromClauseNode; changed: boolean } {
	let changed = false;

	const relationResult = rewriteRelation(clause.relation, {
		context,
		storedSchemas,
		columnUsage,
	});
	let relation: RelationNode = clause.relation;
	if (relationResult.changed) {
		changed = true;
		relation = relationResult.relation;
	}

	const joins = clause.joins.map((join, joinIndex) => {
		const result = rewriteJoinClause(
			join,
			clauseIndex,
			joinIndex,
			context,
			storedSchemas,
			columnUsage
		);
		if (result.changed) {
			changed = true;
		}
		return result.changed ? result.join : join;
	});

	if (!changed) {
		return { clause, changed: false };
	}

	return {
		clause: {
			...clause,
			relation,
			joins,
		},
		changed: true,
	};
}

function rewriteJoinClause(
	join: JoinClauseNode,
	clauseIndex: number,
	joinIndex: number,
	context: PreprocessorStepContext,
	storedSchemas: Map<string, LixSchemaDefinition>,
	columnUsage: StatementColumnUsage
): { join: JoinClauseNode; changed: boolean } {
	let changed = false;
	const relationResult = rewriteRelation(join.relation, {
		context,
		storedSchemas,
		columnUsage,
	});
	let relation = join.relation;
	if (relationResult.changed) {
		changed = true;
		relation = relationResult.relation;
	}

	const onExpression = rewriteExpressionOrFragment(
		join.on_expression,
		context,
		storedSchemas
	);
	if (onExpression !== join.on_expression) {
		changed = true;
	}

	if (!changed) {
		return { join, changed: false };
	}

	return {
		join: {
			...join,
			relation,
			on_expression: onExpression,
		},
		changed: true,
	};
}
type RelationRewriteArgs = {
	readonly context: PreprocessorStepContext;
	readonly storedSchemas: Map<string, LixSchemaDefinition>;
	readonly columnUsage: StatementColumnUsage;
};

type RelationRewriteResult = {
	readonly relation: RelationNode;
	readonly changed: boolean;
};

function rewriteRelation(
	relation: RelationNode,
	args: RelationRewriteArgs
): RelationRewriteResult {
	if (relation.node_kind === "table_reference") {
		return rewriteTableReference(relation, args);
	}
	if (relation.node_kind === "subquery") {
		const statement = rewriteStatementNode(
			relation.statement,
			args.context,
			args.storedSchemas
		);
		if (statement === relation.statement) {
			return { relation, changed: false };
		}
		return {
			relation: {
				...relation,
				statement,
			},
			changed: true,
		};
	}
	return { relation, changed: false };
}

function rewriteTableReference(
	table: TableReferenceNode,
	args: RelationRewriteArgs
): RelationRewriteResult {
	const viewName = extractTableName(table.name);
	if (!viewName) {
		return { relation: table, changed: false };
	}

	const resolved = resolveSelectSchema(args.storedSchemas, viewName);
	if (!resolved) {
		return { relation: table, changed: false };
	}

	const alias = table.alias ?? identifier(viewName);
	const aliasLower = alias.value.toLowerCase();
	const requiredColumns = args.columnUsage.requireAll
		? null
		: extractRequiredColumnsForAlias(args.columnUsage.entries, aliasLower);

	const selectAst = buildEntityViewSelectAst({
		schema: resolved.schema,
		storedSchemaKey: resolved.storedSchemaKey,
		variant: resolved.variant,
		requiredColumns,
	});

	args.context.trace?.push({
		step: "rewrite_entity_view_select",
		payload: {
			view: viewName,
			schema: resolved.schema["x-lix-key"],
			variant: resolved.variant,
		},
	});

	const subquery: SubqueryNode = {
		node_kind: "subquery",
		statement: selectAst.statement,
		alias,
	};

	return {
		relation: subquery,
		changed: true,
	};
}
function resolveSelectSchema(
	storedSchemas: Map<string, LixSchemaDefinition>,
	viewName: string
): {
	schema: LixSchemaDefinition;
	variant: EntityViewVariant;
	storedSchemaKey: string;
} | null {
	const variant = classifyViewVariant(viewName);
	const schema = resolveSchemaDefinition(storedSchemas, viewName);
	if (!schema) {
		return null;
	}
	if (!isEntityViewVariantEnabled(schema, variant)) {
		return null;
	}
	const baseKey = baseSchemaKey(viewName) ?? viewName;
	const storedSchemaKey = resolveStoredSchemaKey(schema, baseKey);
	return {
		schema,
		variant,
		storedSchemaKey,
	};
}
function extractTableName(name: ObjectNameNode): string | null {
	const parts = name.parts;
	if (parts.length === 0) {
		return null;
	}
	return parts[parts.length - 1]?.value ?? null;
}

type EntityViewSelectAst = {
	statement: SelectStatementNode;
};

function buildEntityViewSelectAst(args: {
	schema: LixSchemaDefinition;
	storedSchemaKey: string;
	variant: EntityViewVariant;
	requiredColumns: ReadonlySet<string> | null;
}): EntityViewSelectAst {
	const properties = extractPropertyKeys(args.schema);
	const stateAlias = args.variant === "history" ? "sh" : "sa";
	const tableName =
		args.variant === "history" ? "state_history" : "state_by_version";
	const pointerDescriptors = collectPointerColumnDescriptors({
		schema: args.schema,
	});
	const requiredColumns =
		args.requiredColumns && args.requiredColumns.size > 0
			? new Set(Array.from(args.requiredColumns, (name) => name.toLowerCase()))
			: null;
	const projection = buildProjectionItems({
		schema: args.schema,
		properties,
		stateAlias,
		variant: args.variant,
		pointerDescriptors,
		requiredColumns,
	});
	const predicates: ExpressionNode[] = [
		createBinaryExpression(
			columnReference([stateAlias, "schema_key"]),
			"=",
			createLiteralExpression(args.storedSchemaKey)
		),
	];
	if (args.variant === "base") {
		predicates.push(
			buildActiveVersionPredicate({
				schema: args.schema,
				stateAlias,
			})
		);
	}

	const statement: SelectStatementNode = {
		node_kind: "select_statement",
		distinct: false,
		projection,
		from_clauses: [
			{
				node_kind: "from_clause",
				relation: buildTableReferenceNode(tableName, stateAlias),
				joins: [],
			},
		],
		where_clause: buildConjunction(predicates),
		group_by: [],
		order_by: [],
		limit: null,
		offset: null,
		with_clause: null,
	};

	return {
		statement,
	};
}

function buildProjectionItems(args: {
	schema: LixSchemaDefinition;
	properties: string[];
	stateAlias: string;
	variant: EntityViewVariant;
	pointerDescriptors: ReturnType<typeof collectPointerColumnDescriptors>;
	requiredColumns: ReadonlySet<string> | null;
}): SelectItemNode[] {
	const items: SelectExpressionNode[] = [];
	const included = new Set<string>();
	const required = args.requiredColumns;
	const shouldInclude = (alias: string): boolean => {
		const aliasLower = alias.toLowerCase();
		if (required && !required.has(aliasLower)) {
			return false;
		}
		if (included.has(aliasLower)) {
			return false;
		}
		included.add(aliasLower);
		return true;
	};

	const propertyLower = new Set(
		args.properties.map((prop) => prop.toLowerCase())
	);

	for (const pointer of args.pointerDescriptors) {
		const aliasLower = pointer.alias.toLowerCase();
		if (propertyLower.has(aliasLower)) {
			continue;
		}
		if (required && !required.has(aliasLower)) {
			continue;
		}
		if (!shouldInclude(pointer.alias)) {
			continue;
		}
		const pathExpr = buildSqliteJsonPath(pointer.path);
		items.push(
			createSelectExpression(
				buildJsonExtractExpression({
					stateAlias: args.stateAlias,
					jsonPath: pathExpr,
				}),
				pointer.alias
			)
		);
	}

	for (const property of args.properties) {
		const aliasLower = property.toLowerCase();
		if (required && !required.has(aliasLower)) {
			continue;
		}
		if (!shouldInclude(property)) {
			continue;
		}
		const pathExpr = buildSqliteJsonPath([property]);
		items.push(
			createSelectExpression(
				buildJsonExtractExpression({
					stateAlias: args.stateAlias,
					jsonPath: pathExpr,
				}),
				property
			)
		);
	}

	const inheritedExpression =
		args.variant === "history"
			? null
			: buildInheritedFromVersionExpression({
					schema: args.schema,
					stateAlias: args.stateAlias,
				});

	const includeMetadataColumn = (column: string, alias: string): void => {
		if (!shouldInclude(alias)) {
			return;
		}
		items.push(buildColumnSelect(args.stateAlias, column, alias));
	};

	if (args.variant === "history") {
		includeMetadataColumn("entity_id", "lixcol_entity_id");
		includeMetadataColumn("schema_key", "lixcol_schema_key");
		includeMetadataColumn("file_id", "lixcol_file_id");
		includeMetadataColumn("plugin_key", "lixcol_plugin_key");
		includeMetadataColumn("schema_version", "lixcol_schema_version");
		includeMetadataColumn("change_id", "lixcol_change_id");
		includeMetadataColumn("commit_id", "lixcol_commit_id");
		includeMetadataColumn("root_commit_id", "lixcol_root_commit_id");
		includeMetadataColumn("depth", "lixcol_depth");
		includeMetadataColumn("metadata", "lixcol_metadata");
	} else {
		includeMetadataColumn("entity_id", "lixcol_entity_id");
		includeMetadataColumn("schema_key", "lixcol_schema_key");
		includeMetadataColumn("file_id", "lixcol_file_id");
		includeMetadataColumn("plugin_key", "lixcol_plugin_key");
		if (
			inheritedExpression &&
			shouldInclude("lixcol_inherited_from_version_id")
		) {
			items.push(
				createSelectExpression(
					inheritedExpression,
					"lixcol_inherited_from_version_id"
				)
			);
		}
		includeMetadataColumn("created_at", "lixcol_created_at");
		includeMetadataColumn("updated_at", "lixcol_updated_at");
		includeMetadataColumn("change_id", "lixcol_change_id");
		includeMetadataColumn("untracked", "lixcol_untracked");
		includeMetadataColumn("commit_id", "lixcol_commit_id");
		includeMetadataColumn("metadata", "lixcol_metadata");
		if (args.variant === "by_version") {
			includeMetadataColumn("version_id", "lixcol_version_id");
		}
	}

	if (items.length === 0) {
		items.push(
			buildColumnSelect(args.stateAlias, "entity_id", "lixcol_entity_id")
		);
	}

	return items;
}
function buildColumnSelect(
	stateAlias: string,
	column: string,
	outputName: string
): SelectExpressionNode {
	return createSelectExpression(
		columnReference([stateAlias, column]),
		outputName
	);
}

function createSelectExpression(
	expression: ExpressionNode,
	aliasName: string | null
): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression,
		alias: aliasName ? createIdentifier(aliasName) : null,
	};
}

function buildJsonExtractExpression(args: {
	stateAlias: string;
	jsonPath: string;
}): ExpressionNode {
	return {
		node_kind: "function_call",
		name: identifier("json_extract"),
		arguments: [
			columnReference([args.stateAlias, "snapshot_content"]),
			createLiteralExpression(args.jsonPath),
		],
		over: null,
	};
}

function buildInheritedFromVersionExpression(args: {
	schema: LixSchemaDefinition;
	stateAlias: string;
}): ExpressionNode {
	const override = extractLiteralOverride(
		args.schema,
		"lixcol_inherited_from_version_id"
	);
	if (override !== null) {
		return createLiteralExpression(override);
	}
	const versionOverride = extractLiteralOverride(
		args.schema,
		"lixcol_version_id"
	);
	const column = columnReference([
		args.stateAlias,
		"inherited_from_version_id",
	]);
	if (versionOverride !== null) {
		return {
			node_kind: "function_call",
			name: identifier("coalesce"),
			arguments: [column, createLiteralExpression(versionOverride)],
			over: null,
		};
	}
	return column;
}

function buildActiveVersionPredicate(args: {
	schema: LixSchemaDefinition;
	stateAlias: string;
}): ExpressionNode {
	const override = extractLiteralOverride(args.schema, "lixcol_version_id");
	const left = columnReference([args.stateAlias, "version_id"]);
	if (override !== null) {
		return createBinaryExpression(left, "=", createLiteralExpression(override));
	}
	return createBinaryExpression(left, "=", buildActiveVersionSubquery());
}

function buildActiveVersionSubquery(): SubqueryExpressionNode {
	const versionColumn = columnReference(["version_id"]);
	return {
		node_kind: "subquery_expression",
		statement: {
			node_kind: "select_statement",
			distinct: false,
			projection: [
				{
					node_kind: "select_expression",
					expression: versionColumn,
					alias: null,
				},
			],
			from_clauses: [
				{
					node_kind: "from_clause",
					relation: {
						node_kind: "table_reference",
						name: buildObjectNameNode("active_version"),
						alias: null,
					},
					joins: [],
				},
			],
			where_clause: null,
			group_by: [],
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		},
	};
}

function buildTableReferenceNode(
	name: string,
	alias: string
): TableReferenceNode {
	return {
		node_kind: "table_reference",
		name: buildObjectNameNode(name),
		alias: identifier(alias),
	};
}

function buildObjectNameNode(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function createLiteralExpression(
	value: string | number | boolean | null
): LiteralNode {
	return {
		node_kind: "literal",
		value,
	};
}

function createBinaryExpression(
	left: ExpressionNode,
	operator: BinaryOperator,
	right: ExpressionNode
): BinaryExpressionNode {
	return {
		node_kind: "binary_expression",
		left,
		operator,
		right,
	};
}

function createIdentifier(name: string): IdentifierNode {
	const requiresQuoting = !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
	return identifier(name, requiresQuoting);
}

function extractLiteralOverride(
	schema: LixSchemaDefinition,
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

type ColumnUsageEntry = {
	requireAll: boolean;
	columns: Set<string>;
};

type ColumnUsageCollectorState = {
	aliasSet: ReadonlySet<string>;
	entries: Map<string, ColumnUsageEntry>;
};

type StatementColumnUsage = {
	entries: Map<string, ColumnUsageEntry>;
	requireAll: boolean;
};

function collectStatementColumnUsage(
	statement: SelectStatementNode | CompoundSelectNode
): StatementColumnUsage {
	const aliasSet = collectAliasNamesFromStatement(statement);
	const entries = new Map<string, ColumnUsageEntry>();
	if (aliasSet.size === 0) {
		return { entries, requireAll: false };
	}
	const state: ColumnUsageCollectorState = {
		aliasSet,
		entries,
	};
	const ok = visitStatementForUsage(statement, state, new Set<string>(), true);
	return {
		entries,
		requireAll: !ok,
	};
}

function visitStatementForUsage(
	statement: SelectStatementNode | CompoundSelectNode,
	state: ColumnUsageCollectorState,
	shadowed: ReadonlySet<string>,
	allowUnqualified: boolean
): boolean {
	if (statement.node_kind === "select_statement") {
		const localAliases = collectAliasNamesFromSelect(statement);
		const childShadowed = new Set(shadowed);
		for (const name of localAliases) {
			childShadowed.add(name);
		}
		const unqualifiedAlias = allowUnqualified
			? determineUnqualifiedAlias(statement)
			: null;
		return collectUsageFromSelectComponents(
			{
				projection: statement.projection,
				whereClause: statement.where_clause,
				groupBy: statement.group_by,
				orderBy: statement.order_by,
				limit: statement.limit,
				offset: statement.offset,
				fromClauses: statement.from_clauses,
			},
			state,
			unqualifiedAlias,
			true,
			shadowed,
			childShadowed
		);
	}
	const firstShadowed = extendShadowedAliases(
		statement.first,
		state.aliasSet,
		shadowed
	);
	if (!visitStatementForUsage(statement.first, state, firstShadowed, false)) {
		return false;
	}
	for (const branch of statement.compounds) {
		const branchShadowed = extendShadowedAliases(
			branch.select,
			state.aliasSet,
			shadowed
		);
		if (!visitStatementForUsage(branch.select, state, branchShadowed, false)) {
			return false;
		}
	}
	return true;
}

function collectUsageFromSelectComponents(
	components: {
		projection: readonly SelectItemNode[];
		whereClause: ExpressionNode | RawFragmentNode | null;
		groupBy: readonly ExpressionNode[];
		orderBy: readonly OrderByItemNode[];
		limit: ExpressionNode | RawFragmentNode | null;
		offset: ExpressionNode | RawFragmentNode | null;
		fromClauses: readonly FromClauseNode[];
	},
	state: ColumnUsageCollectorState,
	allowUnqualified: string | null,
	treatStarAsRequireAll: boolean,
	shadowed: ReadonlySet<string>,
	childShadowed: ReadonlySet<string> = shadowed
): boolean {
	if (
		!processProjectionItems(
			components.projection,
			state,
			allowUnqualified,
			treatStarAsRequireAll,
			shadowed,
			childShadowed
		)
	) {
		return false;
	}

	if (
		!visitExpressionOrFragmentForUsage(
			components.whereClause,
			state,
			allowUnqualified,
			shadowed,
			childShadowed
		)
	) {
		return false;
	}

	for (const expr of components.groupBy) {
		if (
			!visitExpressionForUsage(
				expr,
				state,
				allowUnqualified,
				shadowed,
				childShadowed
			)
		) {
			return false;
		}
	}

	for (const order of components.orderBy) {
		if (
			!visitExpressionForUsage(
				order.expression,
				state,
				allowUnqualified,
				shadowed,
				childShadowed
			)
		) {
			return false;
		}
	}

	if (
		!visitExpressionOrFragmentForUsage(
			components.limit,
			state,
			null,
			shadowed,
			childShadowed
		)
	) {
		return false;
	}

	if (
		!visitExpressionOrFragmentForUsage(
			components.offset,
			state,
			null,
			shadowed,
			childShadowed
		)
	) {
		return false;
	}

	for (const clause of components.fromClauses) {
		for (const join of clause.joins) {
			if (
				!visitExpressionOrFragmentForUsage(
					join.on_expression,
					state,
					allowUnqualified,
					shadowed,
					childShadowed
				)
			) {
				return false;
			}
		}
	}

	return true;
}

type ProjectionItemVisitor = (
	item: SelectItemNode,
	state: ColumnUsageCollectorState,
	allowUnqualified: string | null,
	shadowed: ReadonlySet<string>
) => boolean;

function processProjectionItems(
	items: readonly SelectItemNode[],
	state: ColumnUsageCollectorState,
	allowUnqualified: string | null,
	treatStarAsRequireAll: boolean,
	shadowed: ReadonlySet<string>,
	childShadowed: ReadonlySet<string> = shadowed
): boolean {
	for (const item of items) {
		if (item.node_kind === "select_star") {
			if (treatStarAsRequireAll) {
				return false;
			}
			continue;
		}
		if (item.node_kind === "select_qualified_star") {
			const qualifier = item.qualifier.at(-1);
			if (!qualifier) {
				continue;
			}
			const aliasLower = qualifier.value.toLowerCase();
			if (state.aliasSet.has(aliasLower) && !shadowed.has(aliasLower)) {
				const entry = ensureColumnUsageEntry(state.entries, aliasLower);
				entry.requireAll = true;
				entry.columns.clear();
			}
			continue;
		}
		if (
			!visitExpressionForUsage(
				item.expression,
				state,
				allowUnqualified,
				shadowed,
				childShadowed
			)
		) {
			return false;
		}
	}
	return true;
}

function visitExpressionOrFragmentForUsage(
	expression: ExpressionNode | RawFragmentNode | null,
	state: ColumnUsageCollectorState,
	allowUnqualified: string | null,
	shadowed: ReadonlySet<string>,
	childShadowed: ReadonlySet<string> = shadowed
): boolean {
	if (!expression) {
		return true;
	}
	if ("sql_text" in expression) {
		return false;
	}
	return visitExpressionForUsage(
		expression,
		state,
		allowUnqualified,
		shadowed,
		childShadowed
	);
}

function visitExpressionForUsage(
	expression: ExpressionNode,
	state: ColumnUsageCollectorState,
	allowUnqualified: string | null,
	shadowed: ReadonlySet<string>,
	childShadowed: ReadonlySet<string> = shadowed
): boolean {
	switch (expression.node_kind) {
		case "column_reference": {
			const info = resolveColumnReferenceUsage(
				expression,
				state.aliasSet,
				allowUnqualified,
				shadowed
			);
			if (!info) {
				return false;
			}
			const entry = ensureColumnUsageEntry(state.entries, info.aliasLower);
			if (!entry.requireAll) {
				entry.columns.add(info.columnLower);
			}
			return true;
		}
		case "binary_expression":
			return (
				visitExpressionForUsage(
					expression.left,
					state,
					allowUnqualified,
					shadowed
				) &&
				visitExpressionForUsage(
					expression.right,
					state,
					allowUnqualified,
					shadowed
				)
			);
		case "unary_expression":
			return visitExpressionForUsage(
				expression.operand,
				state,
				allowUnqualified,
				shadowed,
				childShadowed
			);
		case "grouped_expression":
			return visitExpressionForUsage(
				expression.expression,
				state,
				allowUnqualified,
				shadowed,
				childShadowed
			);
		case "function_call": {
			for (const arg of expression.arguments) {
				if (arg.node_kind === "all_columns") {
					continue;
				}
				if (!visitExpressionForUsage(arg, state, allowUnqualified, shadowed)) {
					return false;
				}
			}
			if (
				expression.over &&
				expression.over.node_kind === "window_specification"
			) {
				for (const partition of expression.over.partition_by) {
					if (
						!visitExpressionForUsage(
							partition,
							state,
							allowUnqualified,
							shadowed
						)
					) {
						return false;
					}
				}
				for (const order of expression.over.order_by) {
					if (
						!visitExpressionForUsage(
							order.expression,
							state,
							allowUnqualified,
							shadowed
						)
					) {
						return false;
					}
				}
			}
			return true;
		}
		case "in_list_expression":
			if (
				!visitExpressionForUsage(
					expression.operand,
					state,
					allowUnqualified,
					shadowed
				)
			) {
				return false;
			}
			for (const item of expression.items) {
				if (!visitExpressionForUsage(item, state, allowUnqualified, shadowed)) {
					return false;
				}
			}
			return true;
		case "between_expression":
			return (
				visitExpressionForUsage(
					expression.operand,
					state,
					allowUnqualified,
					shadowed
				) &&
				visitExpressionForUsage(
					expression.start,
					state,
					allowUnqualified,
					shadowed
				) &&
				visitExpressionForUsage(
					expression.end,
					state,
					allowUnqualified,
					shadowed
				)
			);
		case "case_expression": {
			if (
				expression.operand &&
				!visitExpressionForUsage(
					expression.operand,
					state,
					allowUnqualified,
					shadowed
				)
			) {
				return false;
			}
			for (const branch of expression.branches) {
				if (
					!visitExpressionForUsage(
						branch.condition,
						state,
						allowUnqualified,
						shadowed
					) ||
					!visitExpressionForUsage(
						branch.result,
						state,
						allowUnqualified,
						shadowed
					)
				) {
					return false;
				}
			}
			if (
				expression.else_result &&
				!visitExpressionForUsage(
					expression.else_result,
					state,
					allowUnqualified,
					shadowed
				)
			) {
				return false;
			}
			return true;
		}
		case "subquery_expression":
			return visitStatementForUsage(
				expression.statement,
				state,
				shadowed,
				false
			);
		case "exists_expression":
			return visitStatementForUsage(
				expression.statement,
				state,
				shadowed,
				false
			);
		case "literal":
		case "parameter":
			return true;
		default:
			return true;
	}
}

function determineUnqualifiedAlias(select: SelectStatementNode): string | null {
	if (select.from_clauses.length !== 1) {
		return null;
	}
	const clause = select.from_clauses[0];
	if (!clause || clause.joins.length > 0) {
		return null;
	}
	const relation = clause.relation;
	if (relation.node_kind === "table_reference") {
		const alias = relation.alias?.value ?? extractTableName(relation.name);
		return alias ? alias.toLowerCase() : null;
	}
	if (relation.node_kind === "subquery" && relation.alias) {
		return relation.alias.value.toLowerCase();
	}
	return null;
}

function extendShadowedAliases(
	statement: SelectStatementNode | CompoundSelectNode,
	aliasSet: ReadonlySet<string>,
	current: ReadonlySet<string>
): ReadonlySet<string> {
	const local = collectAliasNamesFromStatement(statement);
	let updated: Set<string> | null = null;
	for (const name of local) {
		if (!aliasSet.has(name) || current.has(name)) {
			continue;
		}
		if (!updated) {
			updated = new Set(current);
		}
		updated.add(name);
	}
	return updated ?? current;
}

function collectAliasNamesFromStatement(
	statement: SelectStatementNode | CompoundSelectNode
): Set<string> {
	if (statement.node_kind === "select_statement") {
		return collectAliasNamesFromSelect(statement);
	}
	const names = collectAliasNamesFromSelect(statement.first);
	for (const branch of statement.compounds) {
		for (const name of collectAliasNamesFromSelect(branch.select)) {
			names.add(name);
		}
	}
	return names;
}

function collectAliasNamesFromSelect(select: SelectStatementNode): Set<string> {
	const names = new Set<string>();
	for (const clause of select.from_clauses) {
		collectAliasFromRelation(clause.relation, names);
		for (const join of clause.joins) {
			collectAliasFromRelation(join.relation, names);
		}
	}
	return names;
}

function collectAliasFromRelation(
	relation: RelationNode,
	names: Set<string>
): void {
	if (relation.node_kind === "table_reference") {
		const alias = relation.alias?.value ?? extractTableName(relation.name);
		if (alias) {
			names.add(alias.toLowerCase());
		}
		return;
	}
	if (relation.node_kind === "subquery") {
		const alias = relation.alias?.value;
		if (alias) {
			names.add(alias.toLowerCase());
		}
	}
}

function resolveColumnReferenceUsage(
	column: ColumnReferenceNode,
	aliasSet: ReadonlySet<string>,
	allowUnqualified: string | null,
	shadowed: ReadonlySet<string>
): { aliasLower: string; columnLower: string } | null {
	const terminal = column.path.at(-1);
	if (!terminal) {
		return null;
	}
	const columnName = terminal.value;
	if (!columnName) {
		return null;
	}
	let qualifierLower: string | null = null;
	if (column.path.length >= 2) {
		const qualifier = column.path[column.path.length - 2];
		qualifierLower = qualifier?.value.toLowerCase() ?? null;
	}
	let aliasLower: string | null = null;
	if (
		qualifierLower &&
		aliasSet.has(qualifierLower) &&
		!shadowed.has(qualifierLower)
	) {
		aliasLower = qualifierLower;
	} else if (
		!qualifierLower &&
		allowUnqualified &&
		aliasSet.has(allowUnqualified) &&
		!shadowed.has(allowUnqualified)
	) {
		aliasLower = allowUnqualified;
	}
	if (!aliasLower) {
		return null;
	}
	return {
		aliasLower,
		columnLower: columnName.toLowerCase(),
	};
}

function ensureColumnUsageEntry(
	entries: Map<string, ColumnUsageEntry>,
	aliasLower: string
): ColumnUsageEntry {
	let entry = entries.get(aliasLower);
	if (!entry) {
		entry = {
			requireAll: false,
			columns: new Set<string>(),
		};
		entries.set(aliasLower, entry);
	}
	return entry;
}

function extractRequiredColumnsForAlias(
	entries: Map<string, ColumnUsageEntry>,
	aliasLower: string
): ReadonlySet<string> | null {
	const entry = entries.get(aliasLower);
	if (!entry || entry.requireAll) {
		return null;
	}
	return entry.columns;
}

function buildConjunction(
	expressions: readonly ExpressionNode[]
): ExpressionNode | null {
	if (expressions.length === 0) {
		return null;
	}
	let result = expressions[0]!;
	for (let i = 1; i < expressions.length; i++) {
		result = combineWithAnd(result, expressions[i]!);
	}
	return result;
}
function extractPropertyKeys(schema: LixSchemaDefinition): string[] {
	const props = schema.properties;
	if (!props || typeof props !== "object") return [];
	return Object.keys(props).sort();
}
