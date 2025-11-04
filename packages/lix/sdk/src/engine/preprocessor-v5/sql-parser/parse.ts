import type { CstNode, IToken } from "chevrotain";
import type {
	BinaryExpressionNode,
	BinaryOperator,
	ColumnReferenceNode,
	DeleteStatementNode,
	FunctionCallArgumentNode,
	InsertStatementNode,
	InsertValuesNode,
	OnConflictActionNode,
	OnConflictClauseNode,
	OnConflictTargetNode,
	ExpressionNode,
	FromClauseNode,
	GroupedExpressionNode,
	IdentifierNode,
	JoinClauseNode,
	JoinType,
	OrderByItemNode,
	LiteralNode,
	ObjectNameNode,
	ParameterExpressionNode,
	WindowSpecificationNode,
	WindowFrameNode,
	WindowFrameBoundNode,
	WindowReferenceNode,
	RelationNode,
	SelectItemNode,
	SelectQualifiedStarNode,
	SelectStarNode,
	SelectStatementNode,
	CompoundSelectNode,
	CompoundOperator,
	SegmentedStatementNode,
	SetClauseNode,
	StatementNode,
	StatementSegmentNode,
	SubqueryNode,
	TableReferenceNode,
	UnaryExpressionNode,
	UnaryOperator,
	UpdateStatementNode,
	InListExpressionNode,
	BetweenExpressionNode,
	FunctionCallExpressionNode,
	RawFragmentNode,
	SqlNode,
	WithClauseNode,
	CommonTableExpressionNode,
	SubqueryExpressionNode,
	CaseExpressionNode,
	ExistsExpressionNode,
} from "./nodes.js";
import { identifier } from "./nodes.js";
import { parseCst, parserInstance } from "./cst.js";

const BaseVisitor: new (...args: unknown[]) => {
	visit: (node: CstNode | CstNode[]) => unknown;
	validateVisitor: () => void;
} = parserInstance.getBaseCstVisitorConstructorWithDefaults() as any;

class ToAstVisitor extends BaseVisitor {
	public constructor() {
		super();
		this.validateVisitor();
	}

	public select_statement(ctx: {
		select?: CstNode[];
		insert?: CstNode[];
		update?: CstNode[];
		delete?: CstNode[];
	}): StatementNode {
		const select = ctx.select?.[0];
		if (select) {
			return this.visit(select) as StatementNode;
		}
		const insert = ctx.insert?.[0];
		if (insert) {
			return this.visit(insert) as InsertStatementNode;
		}
		const update = ctx.update?.[0];
		if (update) {
			return this.visit(update) as UpdateStatementNode;
		}
		const del = ctx.delete?.[0];
		if (del) {
			return this.visit(del) as DeleteStatementNode;
		}
		throw new Error("statement missing recognized root");
	}

	public select_compound(ctx: {
		with_clause?: CstNode[];
		cores?: CstNode[];
		operators?: CstNode[];
		order_by?: CstNode[];
		limit?: CstNode[];
		offset?: CstNode[];
	}): SelectStatementNode | CompoundSelectNode {
		const coreNodes = ctx.cores ?? [];
		if (coreNodes.length === 0) {
			throw new Error("compound select requires at least one core");
		}

		const selectNodes = coreNodes.map(
			(core) => this.visit(core) as SelectStatementNode
		);

		const withClause = ctx.with_clause?.[0]
			? (this.visit(ctx.with_clause[0]!) as WithClauseNode)
			: null;

		const orderByItems = ctx.order_by?.[0]
			? (this.visit(ctx.order_by[0]!) as OrderByItemNode[])
			: [];

		const limitNode = ctx.limit?.[0]
			? (this.visit(ctx.limit[0]!) as ExpressionNode)
			: null;
		const offsetNode = ctx.offset?.[0]
			? (this.visit(ctx.offset[0]!) as ExpressionNode)
			: null;

		const operatorNodes = ctx.operators ?? [];
		if (operatorNodes.length === 0) {
			const single = { ...selectNodes[0]! };
			return {
				...single,
				order_by: orderByItems,
				limit: limitNode,
				offset: offsetNode,
				with_clause: withClause,
			};
		}

		if (operatorNodes.length !== selectNodes.length - 1) {
			throw new Error("compound select operator mismatch");
		}

		const compounds = selectNodes.slice(1).map((select, index) => {
			const op = this.visit(operatorNodes[index]!) as CompoundOperator;
			return {
				operator: op,
				select,
			};
		});

		const first = { ...selectNodes[0]! };
		first.order_by = [];
		first.limit = null;
		first.offset = null;

		return {
			node_kind: "compound_select",
			first,
			compounds,
			order_by: orderByItems,
			limit: limitNode,
			offset: offsetNode,
			with_clause: withClause,
		};
	}

	public select_core(ctx: {
		distinct?: IToken[];
		select_list: CstNode[];
		from: CstNode[];
		joins?: CstNode[];
		where_clause?: CstNode[];
		group_by?: CstNode[];
	}): SelectStatementNode {
		const selectList = ctx.select_list?.[0];
		if (!selectList) {
			throw new Error("select list is missing");
		}
		const projection = this.visit(selectList) as SelectItemNode[];
		const fromNode = ctx.from?.[0];
		const fromClauses: FromClauseNode[] = [];
		if (fromNode) {
			const relation = this.visit(fromNode) as RelationNode;
			const joins =
				ctx.joins?.map((join) => this.visit(join) as JoinClauseNode) ?? [];
			fromClauses.push({
				node_kind: "from_clause",
				relation,
				joins,
			});
		}
		const whereNode = ctx.where_clause?.[0];
		const whereClause = whereNode
			? (this.visit(whereNode) as ExpressionNode)
			: null;
		const groupBy =
			ctx.group_by?.map((node) => this.visit(node) as ExpressionNode) ?? [];
		return {
			node_kind: "select_statement",
			distinct: Boolean(ctx.distinct?.length),
			projection,
			from_clauses: fromClauses,
			where_clause: whereClause,
			group_by: groupBy,
			order_by: [],
			limit: null,
			offset: null,
			with_clause: null,
		};
	}

	public with_clause(ctx: {
		recursive?: IToken[];
		ctes?: CstNode[];
	}): WithClauseNode {
		const expressions = ctx.ctes?.map(
			(cte) => this.visit(cte) as CommonTableExpressionNode
		);
		return {
			node_kind: "with_clause",
			recursive: Boolean(ctx.recursive?.length),
			ctes: expressions ?? [],
		};
	}

	public common_table_expression(ctx: {
		name: CstNode[];
		columns?: CstNode[];
		statement: CstNode[];
	}): CommonTableExpressionNode {
		const name = this.visit(ctx.name[0]!) as IdentifierNode;
		const columns = ctx.columns?.map(
			(column) => this.visit(column) as IdentifierNode
		);
		const statement = this.visit(ctx.statement[0]!) as
			| SelectStatementNode
			| CompoundSelectNode;
		return {
			node_kind: "common_table_expression",
			name,
			columns: columns ?? [],
			statement,
		};
	}

	public compound_operator(ctx: {
		Union?: IToken[];
		All?: IToken[];
		Intersect?: IToken[];
		Except?: IToken[];
	}): CompoundOperator {
		if (ctx.Union?.length) {
			return ctx.All?.length ? "union_by_version" : "union";
		}
		if (ctx.Intersect?.length) {
			return "intersect";
		}
		if (ctx.Except?.length) {
			return "except";
		}
		throw new Error("unrecognised compound operator");
	}

	public insert_statement(ctx: {
		table?: CstNode[];
		columns?: CstNode[];
		rows?: CstNode[];
		conflict?: CstNode[];
	}): InsertStatementNode {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("insert statement missing target table");
		}
		const target = this.visit(tableNode) as ObjectNameNode;
		const columnNodes =
			ctx.columns?.map((column) => this.visit(column) as IdentifierNode) ?? [];
		const valuesListNode = ctx.rows?.[0];
		if (!valuesListNode) {
			throw new Error("insert statement missing values list");
		}
		const rowNodes = this.visit(valuesListNode) as ExpressionNode[][];
		const valuesNode: InsertValuesNode = {
			node_kind: "insert_values",
			rows: rowNodes,
		};
		const conflictNode = ctx.conflict?.[0];
		const onConflict = conflictNode
			? (this.visit(conflictNode) as OnConflictClauseNode)
			: null;
		return {
			node_kind: "insert_statement",
			target,
			columns: columnNodes,
			source: valuesNode,
			on_conflict: onConflict,
		};
	}

	public on_conflict_clause(ctx: {
		target_expressions?: CstNode[];
		target_where?: CstNode[];
		do_nothing?: IToken[];
		do_update?: IToken[];
		assignments?: CstNode[];
		action_where?: CstNode[];
	}): OnConflictClauseNode {
		const expressionNodes = ctx.target_expressions ?? [];
		const expressions = expressionNodes.map(
			(node) => this.visit(node) as ExpressionNode
		);
		const targetWhereNode = ctx.target_where?.[0];
		const targetWhere = targetWhereNode
			? (this.visit(targetWhereNode) as ExpressionNode)
			: null;
		const target: OnConflictTargetNode | null =
			expressions.length > 0 || targetWhere
				? {
						node_kind: "on_conflict_target",
						expressions,
						where: targetWhere,
					}
				: null;

		let action: OnConflictActionNode;
		if (ctx.do_nothing?.length) {
			action = { node_kind: "on_conflict_do_nothing" };
		} else {
			const assignmentNodes = ctx.assignments ?? [];
			const assignments = assignmentNodes.map(
				(node) => this.visit(node) as SetClauseNode
			);
			if (assignments.length === 0) {
				throw new Error("ON CONFLICT DO UPDATE requires assignments");
			}
			const actionWhereNode = ctx.action_where?.[0];
			const actionWhere = actionWhereNode
				? (this.visit(actionWhereNode) as ExpressionNode)
				: null;
			action = {
				node_kind: "on_conflict_do_update",
				assignments,
				where: actionWhere,
			};
		}

		return {
			node_kind: "on_conflict_clause",
			target,
			action,
		};
	}

	public limit_clause(ctx: { value: CstNode[] }): ExpressionNode {
		const expressionNode = ctx.value?.[0];
		if (!expressionNode) {
			throw new Error("limit clause missing value");
		}
		return this.visit(expressionNode) as ExpressionNode;
	}

	public offset_clause(ctx: { value: CstNode[] }): ExpressionNode {
		const expressionNode = ctx.value?.[0];
		if (!expressionNode) {
			throw new Error("offset clause missing value");
		}
		return this.visit(expressionNode) as ExpressionNode;
	}

	public select_list(ctx: { items?: CstNode[] }): SelectItemNode[] {
		const items = ctx.items ?? [];
		if (items.length === 0) {
			throw new Error("select list is missing");
		}
		return items.map((item) => this.visit(item) as SelectItemNode);
	}

	public select_item(ctx: {
		expression?: CstNode[];
		alias?: CstNode[];
		star?: IToken[];
		qualifier?: CstNode[];
		qualifiedStar?: IToken[];
	}): SelectItemNode {
		if (ctx.star?.[0]) {
			const star: SelectStarNode = { node_kind: "select_star" };
			return star;
		}

		if (ctx.qualifiedStar?.[0]) {
			const qualifiers =
				ctx.qualifier?.map((node) => this.visit(node) as IdentifierNode) ?? [];
			const qualified: SelectQualifiedStarNode = {
				node_kind: "select_qualified_star",
				qualifier: qualifiers,
			};
			return qualified;
		}

		const expressionNode = ctx.expression?.[0];
		if (!expressionNode) {
			throw new Error("select item missing expression");
		}
		const expression = this.visit(expressionNode) as ExpressionNode;
		const aliasNode = ctx.alias?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as IdentifierNode) : null;
		return {
			node_kind: "select_expression",
			expression,
			alias,
		};
	}

	public table_reference(ctx: {
		table?: CstNode[];
		alias?: CstNode[];
		nested?: CstNode[];
		select?: CstNode[];
	}): RelationNode {
		const nestedNode = ctx.nested?.[0];
		if (nestedNode) {
			const relation = this.visit(nestedNode) as RelationNode;
			const aliasToken = ctx.alias?.[0] ?? null;
			if (!aliasToken) {
				return relation;
			}
			const aliasIdentifier = this.visit(aliasToken) as IdentifierNode;
			if (relation.node_kind === "table_reference") {
				return {
					...relation,
					alias: aliasIdentifier,
				};
			}
			if (relation.node_kind === "subquery") {
				return {
					...relation,
					alias: aliasIdentifier,
				};
			}
			return relation;
		}
		const selectNode = ctx.select?.[0];
		if (selectNode) {
			const aliasToken = ctx.alias?.[0] ?? null;
			const alias = aliasToken
				? (this.visit(aliasToken) as IdentifierNode)
				: null;
			const statement = this.visit(selectNode) as
				| SelectStatementNode
				| CompoundSelectNode;
			const subquery: SubqueryNode = {
				node_kind: "subquery",
				statement,
				alias,
			};
			return subquery;
		}
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("table reference is missing");
		}
		const name = this.visit(tableNode) as ObjectNameNode;
		const aliasNode = ctx.alias?.[0];
		const alias = aliasNode ? (this.visit(aliasNode) as IdentifierNode) : null;
		const tableRef: TableReferenceNode = {
			node_kind: "table_reference",
			name,
			alias,
		};
		return tableRef;
	}

	public table_name(ctx: { parts?: CstNode[] }): ObjectNameNode {
		const parts =
			ctx.parts?.map((node) => this.visit(node) as IdentifierNode) ?? [];
		if (parts.length === 0) {
			throw new Error("table name is missing");
		}
		return {
			node_kind: "object_name",
			parts,
		};
	}

	public join_clause(ctx: {
		join_type?: IToken[];
		table?: CstNode[];
		on_expression?: CstNode[];
	}): JoinClauseNode {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("join clause is missing table reference");
		}
		const relation = this.visit(tableNode) as RelationNode;
		const joinTypeToken = ctx.join_type?.[0];
		const joinType = joinTypeToken
			? normalizeJoinType(joinTypeToken.image)
			: "inner";
		const onNode = ctx.on_expression?.[0];
		const onExpression = onNode ? (this.visit(onNode) as ExpressionNode) : null;
		return {
			node_kind: "join_clause",
			join_type: joinType,
			relation,
			on_expression: onExpression,
		};
	}

	public where_clause(ctx: { expression: CstNode[] }): ExpressionNode {
		const expression = ctx.expression?.[0];
		if (!expression) {
			throw new Error("where clause is empty");
		}
		return this.visit(expression) as ExpressionNode;
	}

	public or_expression(ctx: { operands?: CstNode[] }): ExpressionNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as ExpressionNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("logical expression missing operands");
		}
		return foldBinaryExpression("or", operands);
	}

	public and_expression(ctx: { operands?: CstNode[] }): ExpressionNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as ExpressionNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("logical expression missing operands");
		}
		return foldBinaryExpression("and", operands);
	}

	public atomic_predicate(ctx: {
		unary_not?: IToken[];
		negated?: CstNode[];
		left_expression?: CstNode[];
		comparison_operator?: CstNode[];
		comparison_value?: CstNode[];
		is_not?: IToken[];
		is_operator?: IToken[];
		between_start?: CstNode[];
		between_end?: CstNode[];
		in_list?: CstNode[];
		in_subquery?: CstNode[];
		in_not?: IToken[];
		like_pattern?: CstNode[];
		like_not?: IToken[];
		inner?: CstNode[];
		exists?: IToken[];
		exists_subquery?: CstNode[];
	}): ExpressionNode {
		if (ctx.unary_not?.[0]) {
			const inner = ctx.negated?.[0];
			if (!inner) {
				throw new Error("not predicate missing operand");
			}
			const expression = this.visit(inner) as ExpressionNode;
			return createUnaryExpression("not", expression);
		}

		if ((ctx as { exists?: IToken[] }).exists?.[0]) {
			const subqueryNode = (ctx as { exists_subquery?: CstNode[] })
				.exists_subquery?.[0];
			if (!subqueryNode) {
				throw new Error("exists predicate missing subquery");
			}
			const statement = this.visit(subqueryNode) as
				| SelectStatementNode
				| CompoundSelectNode;
			return createExistsExpression(statement);
		}

		const leftExpressionNode = ctx.left_expression?.[0];
		if (leftExpressionNode) {
			const leftOperand = this.visit(leftExpressionNode) as ExpressionNode;
			const comparisonOperatorNode = ctx.comparison_operator?.[0];
			if (comparisonOperatorNode) {
				const comparisonValueNode = ctx.comparison_value?.[0];
				if (!comparisonValueNode) {
					throw new Error("comparison predicate missing right operand");
				}
				const operator = this.visit(comparisonOperatorNode) as BinaryOperator;
				const rightOperand = this.visit(comparisonValueNode) as ExpressionNode;
				return createBinaryExpression(leftOperand, operator, rightOperand);
			}
			const betweenStartNode = ctx.between_start?.[0];
			const betweenEndNode = ctx.between_end?.[0];
			if (betweenStartNode && betweenEndNode) {
				const start = this.visit(betweenStartNode) as ExpressionNode;
				const end = this.visit(betweenEndNode) as ExpressionNode;
				return createBetweenExpression(leftOperand, start, end, false);
			}
			const inListNode = ctx.in_list?.[0];
			if (inListNode) {
				const listItems = this.visit(inListNode) as ExpressionNode[];
				return createInListExpression(
					leftOperand,
					listItems,
					Boolean(ctx.in_not?.length)
				);
			}
			const inSubqueryNode = ctx.in_subquery?.[0];
			if (inSubqueryNode) {
				const statement = this.visit(inSubqueryNode) as
					| SelectStatementNode
					| CompoundSelectNode;
				const subqueryExpression: SubqueryExpressionNode = {
					node_kind: "subquery_expression",
					statement,
				};
				return createInListExpression(
					leftOperand,
					[subqueryExpression],
					Boolean(ctx.in_not?.length)
				);
			}
			const likePatternNode = ctx.like_pattern?.[0];
			if (likePatternNode) {
				const pattern = this.visit(likePatternNode) as ExpressionNode;
				const operator: BinaryOperator = ctx.like_not?.length
					? "not_like"
					: "like";
				return createBinaryExpression(leftOperand, operator, pattern);
			}
			if (ctx.is_operator?.length) {
				const operator: BinaryOperator = ctx.is_not?.length ? "is_not" : "is";
				const nullLiteral = createLiteralNode(null);
				return createBinaryExpression(leftOperand, operator, nullLiteral);
			}
			return leftOperand;
		}
		const inner = ctx.inner?.[0];
		if (!inner) {
			throw new Error("predicate is neither comparison nor grouped expression");
		}
		const expression = this.visit(inner) as ExpressionNode;
		return expression.node_kind === "grouped_expression"
			? expression
			: ({
					node_kind: "grouped_expression",
					expression,
				} satisfies GroupedExpressionNode);
	}

	public additive_expression(ctx: {
		operands?: CstNode[];
		operators?: IToken[];
	}): ExpressionNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as ExpressionNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("additive expression missing operands");
		}
		const operators = ctx.operators ?? [];
		let current = operands[0]!;
		for (let index = 0; index < operators.length; index += 1) {
			const operatorToken = operators[index]!;
			const operator = mapArithmeticOperator(operatorToken.image);
			const right = operands[index + 1]!;
			current = createBinaryExpression(current, operator, right);
		}
		return current;
	}

	public expression(ctx: { expression?: CstNode[] }): ExpressionNode {
		const node = ctx.expression?.[0];
		if (!node) {
			throw new Error("expression node missing");
		}
		return this.visit(node) as ExpressionNode;
	}

	public multiplicative_expression(ctx: {
		operands?: CstNode[];
		operators?: IToken[];
	}): ExpressionNode {
		const operands =
			ctx.operands?.map((operand) => this.visit(operand) as ExpressionNode) ??
			[];
		if (operands.length === 0) {
			throw new Error("multiplicative expression missing operands");
		}
		const operators = ctx.operators ?? [];
		let current = operands[0]!;
		for (let index = 0; index < operators.length; index += 1) {
			const operatorToken = operators[index]!;
			const operator = mapArithmeticOperator(operatorToken.image);
			const right = operands[index + 1]!;
			current = createBinaryExpression(current, operator, right);
		}
		return current;
	}

	public unary_expression(ctx: {
		unaryOperator?: IToken[];
		operand?: CstNode[];
	}): ExpressionNode {
		const operandNode = ctx.operand?.[0];
		if (!operandNode) {
			throw new Error("unary expression missing operand");
		}
		const operand = this.visit(operandNode) as ExpressionNode;
		const operatorToken = ctx.unaryOperator?.[0];
		if (!operatorToken) {
			return operand;
		}
		const image = operatorToken.image.toLowerCase();
		let unaryOperator: UnaryOperator;
		if (image === "-") {
			unaryOperator = "minus";
		} else if (image === "not") {
			unaryOperator = "not";
		} else {
			throw new Error("unsupported unary operator");
		}
		return createUnaryExpression(unaryOperator, operand);
	}

	public primary_expression(ctx: {
		parameter?: IToken[];
		string?: IToken[];
		number?: IToken[];
		nullLiteral?: IToken[];
		reference?: CstNode[];
		callIdentifier?: IToken[];
		callArguments?: CstNode[];
		subselect?: CstNode[];
		inner?: CstNode[];
		caseExpression?: CstNode[];
	}): ExpressionNode {
		const parameter = ctx.parameter?.[0];
		if (parameter) {
			const parameterNode: ParameterExpressionNode = {
				node_kind: "parameter",
				placeholder: parameter.image ?? "?",
				position: -1,
			};
			return parameterNode;
		}
		const stringLiteral = ctx.string?.[0];
		if (stringLiteral?.image) {
			return createLiteralNode(normalizeStringLiteral(stringLiteral.image));
		}
		const numberLiteral = ctx.number?.[0];
		if (numberLiteral?.image) {
			return createLiteralNode(Number(numberLiteral.image));
		}
		const nullLiteral = ctx.nullLiteral?.[0];
		if (nullLiteral) {
			return createLiteralNode(null);
		}
		const caseExpression = ctx.caseExpression?.[0];
		if (caseExpression) {
			return this.visit(caseExpression) as ExpressionNode;
		}
		const callIdentifier = ctx.callIdentifier?.[0];
		if (callIdentifier?.image) {
			let args: FunctionCallArgumentNode[] = [];
			const starToken = (ctx as { callStar?: IToken[] }).callStar?.[0];
			if (starToken) {
				args = [{ node_kind: "all_columns" }];
			} else {
				args =
					ctx.callArguments?.map(
						(argument) => this.visit(argument) as ExpressionNode
					) ?? [];
			}
			const overClause = (ctx as { overClause?: CstNode[] }).overClause?.[0];
			const over = overClause
				? (this.visit(overClause) as
						| WindowSpecificationNode
						| WindowReferenceNode)
				: null;
			const functionCall: FunctionCallExpressionNode = {
				node_kind: "function_call",
				name: identifier(callIdentifier.image),
				arguments: args,
				over,
			};
			return functionCall;
		}
		const reference = ctx.reference?.[0];
		if (reference) {
			return this.visit(reference) as ExpressionNode;
		}
		const subselect = ctx.subselect?.[0];
		if (subselect) {
			const statement = this.visit(subselect) as
				| SelectStatementNode
				| CompoundSelectNode;
			return {
				node_kind: "subquery_expression",
				statement,
			};
		}
		const inner = ctx.inner?.[0];
		if (!inner) {
			throw new Error("primary expression is empty");
		}
		const expression = this.visit(inner) as ExpressionNode;
		if (expression.node_kind === "grouped_expression") {
			return expression;
		}
		const grouped: GroupedExpressionNode = {
			node_kind: "grouped_expression",
			expression,
		};
		return grouped;
	}

	public over_clause(ctx: {
		windowName?: IToken[];
		windowSpec?: CstNode[];
	}): WindowSpecificationNode | WindowReferenceNode {
		const nameToken = ctx.windowName?.[0];
		if (nameToken?.image) {
			return {
				node_kind: "window_reference",
				name: identifier(nameToken.image),
			};
		}
		const specNode = ctx.windowSpec?.[0];
		if (specNode) {
			return this.visit(specNode) as WindowSpecificationNode;
		}
		return {
			node_kind: "window_specification",
			name: null,
			partition_by: [],
			order_by: [],
			frame: null,
		};
	}

	public window_specification(ctx: {
		name?: CstNode[];
		partitionBy?: CstNode[];
		orderBy?: CstNode[];
		frame?: CstNode[];
	}): WindowSpecificationNode {
		const nameNode = ctx.name?.[0];
		const name = nameNode ? (this.visit(nameNode) as IdentifierNode) : null;
		const partitionExpressions =
			ctx.partitionBy?.map((node) => this.visit(node) as ExpressionNode) ?? [];
		const orderNodes = ctx.orderBy?.[0]
			? (this.visit(ctx.orderBy[0]!) as OrderByItemNode[])
			: [];
		const frameNode = ctx.frame?.[0]
			? (this.visit(ctx.frame[0]!) as WindowFrameNode)
			: null;
		return {
			node_kind: "window_specification",
			name,
			partition_by: partitionExpressions,
			order_by: orderNodes,
			frame: frameNode,
		};
	}

	public window_frame(ctx: {
		units: IToken[];
		start?: CstNode[];
		end?: CstNode[];
	}): WindowFrameNode {
		const unitToken = ctx.units[0];
		const unitImage = unitToken?.image?.toLowerCase() ?? "";
		const units: WindowFrameNode["units"] =
			unitImage === "range"
				? "range"
				: unitImage === "groups"
					? "groups"
					: "rows";
		const startNode = ctx.start?.[0];
		if (!startNode) {
			throw new Error("window frame requires a starting bound");
		}
		const start = this.visit(startNode) as WindowFrameBoundNode;
		const endNode = ctx.end?.[0];
		const end = endNode ? (this.visit(endNode) as WindowFrameBoundNode) : null;
		return {
			node_kind: "window_frame",
			units,
			start,
			end,
		};
	}

	public window_frame_bound(ctx: {
		unbounded?: IToken[];
		direction?: IToken[];
		current?: IToken[];
		offset?: CstNode[];
	}): WindowFrameBoundNode {
		const directionToken = ctx.direction?.[0];
		if (ctx.unbounded?.length) {
			if (!directionToken?.image) {
				throw new Error("UNBOUNDED bound requires direction");
			}
			const direction = directionToken.image.toLowerCase();
			return {
				node_kind: "window_frame_bound",
				type:
					direction === "following"
						? "unbounded_following"
						: "unbounded_preceding",
				offset: null,
			};
		}
		if (ctx.current?.length) {
			return {
				node_kind: "window_frame_bound",
				type: "current_row",
				offset: null,
			};
		}
		const offsetNode = ctx.offset?.[0];
		if (!offsetNode || !directionToken?.image) {
			throw new Error("window frame bound requires offset and direction");
		}
		const direction = directionToken.image.toLowerCase();
		const offset = this.visit(offsetNode) as ExpressionNode;
		return {
			node_kind: "window_frame_bound",
			type: direction === "following" ? "following" : "preceding",
			offset,
		};
	}

	public case_expression(ctx: {
		operand?: CstNode[];
		when_condition?: CstNode[];
		when_value?: CstNode[];
		then_expression: CstNode[];
		else_expression?: CstNode[];
	}): CaseExpressionNode {
		const operandNode = ctx.operand?.[0];
		const operand = operandNode
			? (this.visit(operandNode) as ExpressionNode)
			: null;
		const conditions =
			ctx.when_condition?.map((node) => this.visit(node) as ExpressionNode) ??
			ctx.when_value?.map((node) => this.visit(node) as ExpressionNode) ??
			[];
		const results =
			ctx.then_expression?.map((node) => this.visit(node) as ExpressionNode) ??
			[];
		if (conditions.length !== results.length) {
			throw new Error(
				"CASE expression requires matching WHEN and THEN clauses"
			);
		}
		const branches = conditions.map((condition, index) => ({
			condition,
			result: results[index]!,
		}));
		const elseNode = ctx.else_expression?.[0];
		const elseExpression = elseNode
			? (this.visit(elseNode) as ExpressionNode)
			: null;
		return {
			node_kind: "case_expression",
			operand,
			branches,
			else_result: elseExpression,
		};
	}

	public column_reference(ctx: { parts?: CstNode[] }): ColumnReferenceNode {
		const parts =
			ctx.parts?.map((part) => this.visit(part) as IdentifierNode) ?? [];
		if (parts.length === 0) {
			throw new Error("column reference is missing");
		}
		if (parts.length === 1 || parts.length === 2) {
			return {
				node_kind: "column_reference",
				path: parts,
			};
		}
		throw new Error(
			"column references with nested paths are not supported yet"
		);
	}

	public assignment_item(ctx: {
		column?: CstNode[];
		value?: CstNode[];
	}): SetClauseNode {
		const columnNode = ctx.column?.[0];
		if (!columnNode) {
			throw new Error("assignment missing column");
		}
		const valueNode = ctx.value?.[0];
		if (!valueNode) {
			throw new Error("assignment missing value");
		}
		const column = this.visit(columnNode) as ColumnReferenceNode;
		const value = this.visit(valueNode) as ExpressionNode;
		return {
			node_kind: "set_clause",
			column,
			value,
		};
	}

	public update_statement(ctx: {
		table?: CstNode[];
		assignments?: CstNode[];
		where_clause?: CstNode[];
	}): UpdateStatementNode {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("update statement missing table reference");
		}
		const targetRelation = this.visit(tableNode) as RelationNode;
		if (targetRelation.node_kind !== "table_reference") {
			throw new Error("update statement requires a base table reference");
		}
		const assignments =
			ctx.assignments?.map(
				(assignment) => this.visit(assignment) as SetClauseNode
			) ?? [];
		if (assignments.length === 0) {
			throw new Error("update statement missing assignments");
		}
		const whereNode = ctx.where_clause?.[0];
		const whereClause = whereNode
			? (this.visit(whereNode) as ExpressionNode)
			: null;
		return {
			node_kind: "update_statement",
			target: targetRelation,
			assignments,
			where_clause: whereClause,
		};
	}

	public delete_statement(ctx: {
		table?: CstNode[];
		where_clause?: CstNode[];
	}): DeleteStatementNode {
		const tableNode = ctx.table?.[0];
		if (!tableNode) {
			throw new Error("delete statement missing table reference");
		}
		const targetRelation = this.visit(tableNode) as RelationNode;
		if (targetRelation.node_kind !== "table_reference") {
			throw new Error("delete statement requires a base table reference");
		}
		const whereNode = ctx.where_clause?.[0];
		const whereClause = whereNode
			? (this.visit(whereNode) as ExpressionNode)
			: null;
		return {
			node_kind: "delete_statement",
			target: targetRelation,
			where_clause: whereClause,
		};
	}

	public expression_list(ctx: { items?: CstNode[] }): ExpressionNode[] {
		return ctx.items?.map((item) => this.visit(item) as ExpressionNode) ?? [];
	}

	public values_list(ctx: { rows?: CstNode[] }): ExpressionNode[][] {
		const rows = ctx.rows ?? [];
		if (rows.length === 0) {
			throw new Error("values list is empty");
		}
		return rows.map((row) => this.visit(row) as ExpressionNode[]);
	}

	public values_clause(ctx: { values?: CstNode[] }): ExpressionNode[] {
		const valuesNode = ctx.values?.[0];
		if (!valuesNode) {
			throw new Error("values clause missing expressions");
		}
		return this.visit(valuesNode) as ExpressionNode[];
	}

	public order_by_clause(ctx: { items?: CstNode[] }): OrderByItemNode[] {
		return ctx.items?.map((item) => this.visit(item) as OrderByItemNode) ?? [];
	}

	public order_by_item(ctx: {
		expression?: CstNode[];
		direction?: IToken[];
	}): OrderByItemNode {
		const expressionNode = ctx.expression?.[0];
		if (!expressionNode) {
			throw new Error("order by item missing expression");
		}
		const expression = this.visit(expressionNode) as ExpressionNode;
		const directionToken = ctx.direction?.[0];
		const direction = directionToken
			? normalizeOrderDirection(directionToken.image)
			: null;
		return {
			node_kind: "order_by_item",
			expression,
			direction,
		};
	}

	public comparison_operator(ctx: { operator?: IToken[] }): BinaryOperator {
		const token = ctx.operator?.[0];
		if (!token) {
			throw new Error("comparison operator token missing");
		}
		return mapComparisonOperator(token.image);
	}

	public identifier(ctx: {
		Identifier?: IToken[];
		QuotedIdentifier?: IToken[];
	}): IdentifierNode {
		const token = ctx.Identifier?.[0] ?? ctx.QuotedIdentifier?.[0];
		if (!token?.image) {
			throw new Error("identifier token missing");
		}
		const isQuoted = token.tokenType?.name === "QuotedIdentifier";
		const value = isQuoted
			? token.image.slice(1, -1).replace(/""/g, '"')
			: token.image;
		return {
			node_kind: "identifier",
			value,
			quoted: isQuoted,
		};
	}
}

const visitor = new ToAstVisitor();

function createLiteralNode(
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

function foldBinaryExpression(
	operator: BinaryOperator,
	operands: readonly ExpressionNode[]
): ExpressionNode {
	let current = operands[0]!;
	for (let index = 1; index < operands.length; index += 1) {
		current = createBinaryExpression(current, operator, operands[index]!);
	}
	return current;
}

function createInListExpression(
	operand: ExpressionNode,
	items: readonly ExpressionNode[],
	negated: boolean
): InListExpressionNode {
	return {
		node_kind: "in_list_expression",
		operand,
		items,
		negated,
	};
}

function createExistsExpression(
	statement: SelectStatementNode | CompoundSelectNode
): ExistsExpressionNode {
	return {
		node_kind: "exists_expression",
		statement,
	};
}

function createBetweenExpression(
	operand: ExpressionNode,
	start: ExpressionNode,
	end: ExpressionNode,
	negated: boolean
): BetweenExpressionNode {
	return {
		node_kind: "between_expression",
		operand,
		start,
		end,
		negated,
	};
}

function createUnaryExpression(
	operator: UnaryOperator,
	operand: ExpressionNode
): UnaryExpressionNode {
	return {
		node_kind: "unary_expression",
		operator,
		operand,
	};
}

function mapArithmeticOperator(image: string): BinaryOperator {
	switch (image) {
		case "+":
		case "-":
		case "*":
		case "/":
		case "%":
		case "->":
		case "->>":
			return image as BinaryOperator;
		default:
			throw new Error(`unsupported arithmetic operator '${image}'`);
	}
}

function mapComparisonOperator(image: string): BinaryOperator {
	switch (image) {
		case "=":
		case "!=":
		case "<>":
		case ">":
		case ">=":
		case "<":
		case "<=":
			return image as BinaryOperator;
		default:
			throw new Error(`unsupported comparison operator '${image}'`);
	}
}

function normalizeJoinType(value: string): JoinType {
	switch (value.toLowerCase()) {
		case "inner":
			return "inner";
		case "left":
			return "left";
		case "right":
			return "right";
		case "full":
			return "full";
		default:
			return "inner";
	}
}

function normalizeOrderDirection(value: string): "asc" | "desc" {
	const normalized = value.toLowerCase();
	if (normalized === "asc" || normalized === "desc") {
		return normalized;
	}
	throw new Error(`unsupported order by direction '${value}'`);
}

function normalizeStringLiteral(image: string): string {
	const inner = image.slice(1, -1);
	return inner.replace(/''/g, "'");
}

function toStatementNode(root: CstNode): StatementNode {
	return visitor.visit(root) as StatementNode;
}

function assignParameterPositions<T extends StatementNode>(statement: T): T {
	const state = { nextSequential: 0 };
	assignPositionsInStatement(statement, state);
	return statement;
}

function resolveParameterPosition(
	placeholder: string,
	state: { nextSequential: number }
): number {
	if (isSequentialPlaceholder(placeholder)) {
		const position = state.nextSequential;
		state.nextSequential += 1;
		return position;
	}
	const numericMatch = placeholder.match(/^\?(\d+)$/);
	if (numericMatch) {
		const numeric = Number(numericMatch[1]) - 1;
		if (Number.isInteger(numeric) && numeric >= 0) {
			if (numeric + 1 > state.nextSequential) {
				state.nextSequential = numeric + 1;
			}
			return numeric;
		}
	}
	// Fall back to sequential ordering for unsupported placeholder formats.
	const position = state.nextSequential;
	state.nextSequential += 1;
	return position;
}

function isSequentialPlaceholder(placeholder: string): boolean {
	if (placeholder === "" || placeholder === "?") {
		return true;
	}
	if (placeholder.startsWith("?")) {
		const rest = placeholder.slice(1);
		return rest.length === 0 || /\D/.test(rest);
	}
	return true;
}

function countSequentialPlaceholders(sql: string): number {
	let count = 0;
	let index = 0;
	let inSingle = false;
	let inDouble = false;
	let inBracket = false;
	let inLineComment = false;
	let inBlockComment = false;

	const advance = (step = 1): void => {
		index += step;
	};

	while (index < sql.length) {
		const ch = sql[index]!;
		const next = sql[index + 1];

		if (inLineComment) {
			if (ch === "\n") {
				inLineComment = false;
			}
			advance();
			continue;
		}

		if (inBlockComment) {
			if (ch === "*" && next === "/") {
				inBlockComment = false;
				advance(2);
				continue;
			}
			advance();
			continue;
		}

		if (!inSingle && !inDouble && !inBracket) {
			if (ch === "-" && next === "-") {
				inLineComment = true;
				advance(2);
				continue;
			}
			if (ch === "/" && next === "*") {
				inBlockComment = true;
				advance(2);
				continue;
			}
		}

		if (!inDouble && !inBracket && ch === "'") {
			if (inSingle && next === "'") {
				advance(2);
				continue;
			}
			inSingle = !inSingle;
			advance();
			continue;
		}

		if (!inSingle && !inBracket && ch === '"') {
			if (inDouble && next === '"') {
				advance(2);
				continue;
			}
			inDouble = !inDouble;
			advance();
			continue;
		}

		if (!inSingle && !inDouble && ch === "[" && !inBracket) {
			inBracket = true;
			advance();
			continue;
		}

		if (inBracket) {
			if (ch === "]") {
				inBracket = false;
			}
			advance();
			continue;
		}

		if (!inSingle && !inDouble && !inBracket && ch === "?") {
			let j = index + 1;
			while (j < sql.length && /\d/.test(sql[j]!)) {
				j += 1;
			}
			if (j === index + 1) {
				count += 1;
				advance();
				continue;
			}
			index = j;
			continue;
		}

		advance();
	}

	return count;
}

type ParameterTraversalState = {
	nextSequential: number;
};

function assignPositionsInStatement(
	statement: StatementNode,
	state: ParameterTraversalState
): void {
	switch (statement.node_kind) {
		case "select_statement":
			assignPositionsInSelect(statement, state);
			break;
		case "compound_select":
			assignPositionsInCompound(statement, state);
			break;
		case "insert_statement":
			assignPositionsInInsert(statement, state);
			break;
		case "update_statement":
			assignPositionsInUpdate(statement, state);
			break;
		case "delete_statement":
			assignPositionsInDelete(statement, state);
			break;
		default:
			break;
	}
}
function assignPositionsInSelect(
	select: SelectStatementNode,
	state: ParameterTraversalState
): void {
	if (select.with_clause) {
		assignPositionsInWithClause(select.with_clause, state);
	}
	for (const item of select.projection) {
		assignPositionsInSelectItem(item, state);
	}
	for (const clause of select.from_clauses) {
		assignPositionsInFromClause(clause, state);
	}
	assignPositionsInExpressionOrFragment(select.where_clause, state);
	for (const order of select.order_by) {
		assignPositionsInExpression(order.expression, state);
	}
	assignPositionsInExpressionOrFragment(select.limit, state);
	assignPositionsInExpressionOrFragment(select.offset, state);
}

function assignPositionsInCompound(
	compound: CompoundSelectNode,
	state: ParameterTraversalState
): void {
	if (compound.with_clause) {
		assignPositionsInWithClause(compound.with_clause, state);
	}
	assignPositionsInSelect(compound.first, state);
	for (const branch of compound.compounds) {
		assignPositionsInSelect(branch.select, state);
	}
	for (const item of compound.order_by) {
		assignPositionsInExpression(item.expression, state);
	}
	assignPositionsInExpressionOrFragment(compound.limit, state);
	assignPositionsInExpressionOrFragment(compound.offset, state);
}

function assignPositionsInWithClause(
	withClause: WithClauseNode,
	state: ParameterTraversalState
): void {
	for (const cte of withClause.ctes) {
		assignPositionsInStatement(cte.statement, state);
	}
}

function assignPositionsInSelectItem(
	item: SelectItemNode,
	state: ParameterTraversalState
): void {
	if (item.node_kind === "select_expression") {
		assignPositionsInExpression(item.expression, state);
	}
}

function assignPositionsInFromClause(
	clause: FromClauseNode,
	state: ParameterTraversalState
): void {
	assignPositionsInRelation(clause.relation, state);
	for (const join of clause.joins) {
		assignPositionsInJoin(join, state);
	}
}

function assignPositionsInJoin(
	join: JoinClauseNode,
	state: ParameterTraversalState
): void {
	assignPositionsInRelation(join.relation, state);
	assignPositionsInExpressionOrFragment(join.on_expression, state);
}

function assignPositionsInRelation(
	relation: RelationNode,
	state: ParameterTraversalState
): void {
	switch (relation.node_kind) {
		case "subquery":
			assignPositionsInStatement(relation.statement, state);
			break;
		case "raw_fragment":
			state.nextSequential += countSequentialPlaceholders(relation.sql_text);
			break;
		default:
			break;
	}
}

function assignPositionsInInsert(
	statement: InsertStatementNode,
	state: ParameterTraversalState
): void {
	assignPositionsInInsertSource(statement.source, state);
}

function assignPositionsInInsertSource(
	source: InsertValuesNode,
	state: ParameterTraversalState
): void {
	for (const row of source.rows) {
		for (const expression of row) {
			assignPositionsInExpression(expression, state);
		}
	}
}

function assignPositionsInUpdate(
	statement: UpdateStatementNode,
	state: ParameterTraversalState
): void {
	for (const clause of statement.assignments) {
		assignPositionsInExpression(clause.value, state);
	}
	assignPositionsInExpressionOrFragment(statement.where_clause, state);
}

function assignPositionsInDelete(
	statement: DeleteStatementNode,
	state: ParameterTraversalState
): void {
	assignPositionsInExpressionOrFragment(statement.where_clause, state);
}

function assignPositionsInExpressionOrFragment(
	expression: ExpressionNode | RawFragmentNode | null,
	state: ParameterTraversalState
): void {
	if (!expression) {
		return;
	}
	if ("sql_text" in expression) {
		state.nextSequential += countSequentialPlaceholders(expression.sql_text);
		return;
	}
	assignPositionsInExpression(expression, state);
}

function assignPositionsInExpression(
	expression: ExpressionNode,
	state: ParameterTraversalState
): void {
	switch (expression.node_kind) {
		case "parameter":
			assignPositionToParameter(expression, state);
			break;
		case "grouped_expression":
			assignPositionsInExpression(expression.expression, state);
			break;
		case "binary_expression":
			assignPositionsInExpression(expression.left, state);
			assignPositionsInExpression(expression.right, state);
			break;
		case "unary_expression":
			assignPositionsInExpression(expression.operand, state);
			break;
		case "in_list_expression":
			assignPositionsInExpression(expression.operand, state);
			for (const item of expression.items) {
				assignPositionsInExpression(item, state);
			}
			break;
		case "between_expression":
			assignPositionsInExpression(expression.operand, state);
			assignPositionsInExpression(expression.start, state);
			assignPositionsInExpression(expression.end, state);
			break;
		case "function_call":
			for (const argument of expression.arguments) {
				if (argument.node_kind === "all_columns") {
					continue;
				}
				assignPositionsInExpression(argument, state);
			}
			break;
		case "subquery_expression":
			assignPositionsInStatement(expression.statement, state);
			break;
		case "raw_fragment":
			state.nextSequential += countSequentialPlaceholders(expression.sql_text);
			break;
		default:
			break;
	}
}

function assignPositionToParameter(
	parameter: ParameterExpressionNode,
	state: ParameterTraversalState
): void {
	const position = resolveParameterPosition(
		parameter.placeholder ?? "?",
		state
	);
	(parameter as ParameterExpressionNode & { position: number }).position =
		position;
}

/**
 * Parses SQL text into one or more segmented statements, falling back to raw
 * fragments when the grammar cannot represent portions of the input.
 *
 * @example
 * ```ts
 * const [statement] = parse("SELECT 1");
 * ```
 */
export function parse(sql: string): readonly SegmentedStatementNode[] {
	const program = parseWithGrammar(sql);
	if (program.length > 0) {
		return program;
	}

	const segmentedFallback = parseWithSegmentation(sql);
	if (segmentedFallback.length > 0) {
		return segmentedFallback;
	}

	return [createSegmentedStatement([createRawFragment(sql)])];
}

export { parseCst } from "./cst.js";

function parseWithGrammar(sql: string): SegmentedStatementNode[] {
	const root = parseCst(sql);
	if (!root) {
		return [];
	}

	const statement = toStatementNode(root);
	return [createSegmentedStatement([statement])];
}

function parseWithSegmentation(sql: string): SegmentedStatementNode[] {
	const segments = segmentSelectStatements(sql);
	if (!segments) {
		return [];
	}

	return [createSegmentedStatement(segments)];
}

function createSegmentedStatement(
	segments: StatementSegmentNode[]
): SegmentedStatementNode {
	const state: ParameterTraversalState = { nextSequential: 0 };
	assignPositionsInSegments(segments, state);
	return {
		node_kind: "segmented_statement",
		segments,
	};
}

export function normalizeSegmentedStatement(
	statement: SegmentedStatementNode
): SegmentedStatementNode {
	const segments = [...statement.segments] as StatementSegmentNode[];
	const state: ParameterTraversalState = { nextSequential: 0 };
	assignPositionsInSegments(segments, state);
	return {
		...statement,
		segments,
	};
}

export function normalizeSegmentedStatements(
	statements: readonly SegmentedStatementNode[]
): SegmentedStatementNode[] {
	return statements.map((statement) => normalizeSegmentedStatement(statement));
}

function assignPositionsInSegments(
	segments: StatementSegmentNode[],
	state: ParameterTraversalState
): void {
	for (const segment of segments) {
		if (segment.node_kind === "raw_fragment") {
			state.nextSequential += countSequentialPlaceholders(segment.sql_text);
			continue;
		}
		assignPositionsInStatement(segment, state);
	}
}

/**
 * Extracts SELECT statements that appear within parenthesised regions while
 * preserving surrounding fragments as raw nodes.
 */
function segmentSelectStatements(sql: string): StatementSegmentNode[] | null {
	const segments: StatementSegmentNode[] = [];
	let cursor = 0;
	let depth = 0;
	let inSingleQuotedString = false;

	for (let index = 0; index < sql.length; index += 1) {
		const ch = sql[index]!;

		if (inSingleQuotedString) {
			if (ch === "'") {
				const next = sql[index + 1];
				if (next === "'") {
					index += 1;
					continue;
				}
				inSingleQuotedString = false;
			}
			continue;
		}

		if (ch === "'") {
			inSingleQuotedString = true;
			continue;
		}

		if (ch === "(") {
			depth += 1;
			continue;
		}

		if (ch === ")") {
			if (depth > 0) {
				depth -= 1;
			}
			continue;
		}

		const isSelectKeyword = isKeywordAt(sql, index, "select");
		if (!isSelectKeyword || !isIdentifierBoundary(sql, index - 1)) {
			continue;
		}

		const interstitial = sql.slice(cursor, index).trim().toLowerCase();
		const isAfterUnion = /(?:^|\s)union(?:\s+all)?$/.test(interstitial);
		if (!(depth > 0 || segments.length === 0 || isAfterUnion)) {
			continue;
		}

		{
			const endIndex = findSelectBoundary(sql, index, depth);
			if (endIndex === null || endIndex <= index) {
				return null;
			}

			if (index > cursor) {
				const fragmentSql = sql.slice(cursor, index);
				if (fragmentSql.length > 0) {
					segments.push(createRawFragment(fragmentSql));
				}
			}

			const selectSql = sql.slice(index, endIndex);
			const parsed = parseSimpleStatement(selectSql);
			if (!parsed || parsed.node_kind !== "select_statement") {
				return null;
			}
			segments.push(parsed);

			cursor = endIndex;
			index = endIndex - 1;
		}
	}

	if (segments.length === 0) {
		return null;
	}

	if (cursor < sql.length) {
		const trailing = sql.slice(cursor);
		if (trailing.length > 0) {
			segments.push(createRawFragment(trailing));
		}
	}

	return segments;
}

function parseSimpleStatement(sql: string): StatementNode | null {
	const root = parseCst(sql);
	if (!root) {
		return null;
	}
	return toStatementNode(root);
}

/**
 * Locates the end of a SELECT segment, stopping at UNION keywords or the
 * closing parenthesis that owns the statement.
 *
 * @example
 * ```ts
 * const end = findSelectBoundary("SELECT 1 UNION SELECT 2", 0, 0);
 * ```
 */
function findSelectBoundary(
	sql: string,
	startIndex: number,
	startDepth: number
): number | null {
	let depth = startDepth;
	let inSingleQuotedString = false;

	for (let index = startIndex; index < sql.length; index += 1) {
		const ch = sql[index]!;

		if (inSingleQuotedString) {
			if (ch === "'") {
				const next = sql[index + 1];
				if (next === "'") {
					index += 1;
					continue;
				}
				inSingleQuotedString = false;
			}
			continue;
		}

		if (ch === "'") {
			inSingleQuotedString = true;
			continue;
		}

		if (ch === "(") {
			depth += 1;
			continue;
		}

		if (ch === ")") {
			depth -= 1;
			if (depth < startDepth) {
				return index;
			}
			continue;
		}

		if (depth === startDepth && isKeywordAt(sql, index, "union")) {
			return index;
		}
	}

	return sql.length;
}

/**
 * Checks whether the given keyword appears at the specified index.
 *
 * @example
 * ```ts
 * isKeywordAt("UNION", 0, "union") === true;
 * ```
 */
function isKeywordAt(sql: string, index: number, keyword: string): boolean {
	if (index < 0) {
		return false;
	}
	const remaining = sql.length - index;
	if (remaining < keyword.length) {
		return false;
	}
	const candidate = sql.slice(index, index + keyword.length).toLowerCase();
	return candidate === keyword;
}

/**
 * Determines whether the character at a position can precede an identifier.
 *
 * @example
 * ```ts
 * isIdentifierBoundary(" SELECT", 0) === true;
 * ```
 */
function isIdentifierBoundary(sql: string, index: number): boolean {
	if (index < 0) {
		return true;
	}
	const ch = sql[index]!;
	return !/[a-zA-Z0-9_]/.test(ch);
}

/**
 * Wraps SQL text in a raw fragment node.
 *
 * @example
 * ```ts
 * const fragment = createRawFragment("UNSUPPORTED()");
 * ```
 */
function createRawFragment(sql: string): RawFragmentNode {
	return {
		node_kind: "raw_fragment",
		sql_text: sql,
	};
}
