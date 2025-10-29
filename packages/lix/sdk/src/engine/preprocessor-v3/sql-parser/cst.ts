import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	Insert,
	Update,
	Delete,
	With,
	Recursive,
	Union,
	All,
	Distinct,
	From,
	Into,
	Where,
	And,
	Or,
	Not,
	Order,
	Limit,
	Offset,
	By,
	Asc,
	Desc,
	Inner,
	Left,
	Right,
	Full,
	Join,
	On,
	SetKeyword,
	Is,
	InKeyword,
	NullKeyword,
	Between,
	Like,
	Identifier,
	Star,
	Semicolon,
	As,
	LeftParen,
	RightParen,
	Dot,
	Parameter,
	Comma,
	Equals,
	NotEquals,
	NotEqualsAlt,
	GreaterThanOrEqual,
	LessThanOrEqual,
	GreaterThan,
	LessThan,
	Plus,
	Minus,
	Slash,
	Percent,
	Values,
	StringLiteral,
	NumberLiteral,
	QuotedIdentifier,
	sqlTokens,
	sqlLexer,
} from "./lexer.js";

class SqlParser extends CstParser {
	public constructor() {
		super(sqlTokens, {
			nodeLocationTracking: "onlyOffset",
		});
		this.performSelfAnalysis();
	}

	public readonly select_statement: () => CstNode = this.RULE(
		"select_statement",
		() => {
		this.OPTION(() => this.SUBRULE(this.with_clause, { LABEL: "with_clause" }));
		this.OR([
			{ ALT: () => this.SUBRULE(this.select_compound, { LABEL: "core" }) },
			{
				ALT: () => this.SUBRULE(this.insert_statement, { LABEL: "insert" }),
			},
				{ ALT: () => this.SUBRULE(this.update_statement, { LABEL: "update" }) },
				{ ALT: () => this.SUBRULE(this.delete_statement, { LABEL: "delete" }) },
			]);
			this.OPTION1(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
		}
	);

	private readonly select_compound: () => CstNode = this.RULE(
		"select_compound",
		() => {
			this.SUBRULE(this.select_core, { LABEL: "head" });
			this.MANY(() => {
				this.SUBRULE(this.set_operation, { LABEL: "operations" });
			});
		}
	);

	private readonly set_operation: () => CstNode = this.RULE(
		"set_operation",
		() => {
			this.CONSUME(Union, { LABEL: "operator" });
			this.OPTION(() => {
				this.OR([
					{ ALT: () => this.CONSUME(All, { LABEL: "quantifier" }) },
					{ ALT: () => this.CONSUME(Distinct, { LABEL: "quantifier" }) },
				]);
			});
			this.SUBRULE(this.select_core, { LABEL: "select" });
		}
	);

	private readonly with_clause: () => CstNode = this.RULE("with_clause", () => {
		this.CONSUME(With);
		this.OPTION(() => this.CONSUME(Recursive));
		this.SUBRULE(this.with_binding, { LABEL: "bindings" });
		this.MANY(() => {
			this.CONSUME(Comma);
			this.SUBRULE1(this.with_binding, { LABEL: "bindings" });
		});
	});

	private readonly with_binding: () => CstNode = this.RULE(
		"with_binding",
		() => {
			this.SUBRULE(this.identifier, { LABEL: "name" });
			this.OPTION(() => {
				this.CONSUME(LeftParen);
				this.SUBRULE1(this.identifier, { LABEL: "columns" });
				this.MANY(() => {
					this.CONSUME(Comma);
					this.SUBRULE2(this.identifier, { LABEL: "columns" });
				});
				this.CONSUME(RightParen);
			});
			this.CONSUME(As);
			this.CONSUME1(LeftParen);
			this.SUBRULE3(this.cte_substatement, { LABEL: "statement" });
			this.CONSUME1(RightParen);
		}
	);

	private readonly cte_substatement: () => CstNode = this.RULE(
		"cte_substatement",
		() => {
			this.OPTION(() => this.SUBRULE(this.with_clause, { LABEL: "with_clause" }));
			this.OR([
				{ ALT: () => this.SUBRULE(this.select_compound, { LABEL: "core" }) },
				{ ALT: () => this.SUBRULE(this.insert_statement, { LABEL: "insert" }) },
				{ ALT: () => this.SUBRULE(this.update_statement, { LABEL: "update" }) },
				{ ALT: () => this.SUBRULE(this.delete_statement, { LABEL: "delete" }) },
			]);
		}
	);

	private readonly parenthesized_select: () => CstNode = this.RULE(
		"parenthesized_select",
		() => {
			this.CONSUME(LeftParen);
			this.SUBRULE(this.cte_substatement, { LABEL: "statement" });
			this.CONSUME(RightParen);
		}
	);

	private readonly select_core: () => CstNode = this.RULE("select_core", () => {
		this.CONSUME(Select);
		this.SUBRULE(this.select_list);
		this.OPTION(() => {
			this.CONSUME(From);
			this.SUBRULE(this.table_reference, { LABEL: "from" });
			this.MANY(() => {
				this.SUBRULE1(this.join_clause, { LABEL: "joins" });
			});
		});
		this.OPTION1(() => {
			this.CONSUME(Where);
			this.SUBRULE(this.where_clause);
		});
		this.OPTION2(() => {
			this.CONSUME(Order);
			this.CONSUME(By);
			this.SUBRULE(this.order_by_clause, { LABEL: "order_by" });
		});
		this.OPTION3(() => {
			this.CONSUME(Limit);
			this.SUBRULE(this.limit_clause, { LABEL: "limit" });
		});
		this.OPTION4(() => {
			this.CONSUME(Offset);
			this.SUBRULE(this.offset_clause, { LABEL: "offset" });
		});
	});

	private readonly limit_clause: () => CstNode = this.RULE(
		"limit_clause",
		() => {
			this.SUBRULE(this.expression, { LABEL: "value" });
		}
	);

	private readonly offset_clause: () => CstNode = this.RULE(
		"offset_clause",
		() => {
			this.SUBRULE(this.expression, { LABEL: "value" });
		}
	);

	private readonly insert_statement: () => CstNode = this.RULE(
		"insert_statement",
		() => {
			this.CONSUME(Insert);
			this.CONSUME(Into);
			this.SUBRULE(this.table_name, { LABEL: "table" });
			this.OPTION(() => {
				this.CONSUME(LeftParen);
				this.SUBRULE(this.identifier, { LABEL: "columns" });
				this.MANY(() => {
					this.CONSUME(Comma);
					this.SUBRULE1(this.identifier, { LABEL: "columns" });
				});
				this.CONSUME(RightParen);
			});
			this.CONSUME(Values);
			this.SUBRULE(this.values_list, { LABEL: "rows" });
		}
	);

	private readonly update_statement: () => CstNode = this.RULE(
		"update_statement",
		() => {
			this.CONSUME(Update);
			this.SUBRULE(this.table_reference, { LABEL: "table" });
			this.CONSUME(SetKeyword);
			this.SUBRULE(this.assignment_item, { LABEL: "assignments" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.assignment_item, { LABEL: "assignments" });
			});
			this.OPTION(() => {
				this.CONSUME(Where);
				this.SUBRULE(this.where_clause, { LABEL: "where_clause" });
			});
		}
	);

	private readonly delete_statement: () => CstNode = this.RULE(
		"delete_statement",
		() => {
			this.CONSUME(Delete);
			this.CONSUME(From);
			this.SUBRULE(this.table_reference, { LABEL: "table" });
			this.OPTION(() => {
				this.CONSUME(Where);
				this.SUBRULE(this.where_clause, { LABEL: "where_clause" });
			});
		}
	);

	private readonly select_list: () => CstNode = this.RULE("select_list", () => {
		this.SUBRULE(this.select_item, { LABEL: "items" });
		this.MANY(() => {
			this.CONSUME(Comma);
			this.SUBRULE1(this.select_item, { LABEL: "items" });
		});
	});

	private readonly select_item: () => CstNode = this.RULE("select_item", () => {
		this.OR([
			{ ALT: () => this.CONSUME(Star, { LABEL: "star" }) },
			{
				ALT: () => {
					this.SUBRULE(this.identifier, { LABEL: "qualifier" });
					this.CONSUME(Dot);
					this.CONSUME1(Star, { LABEL: "qualifiedStar" });
				},
			},
			{
				ALT: () => {
					this.SUBRULE(this.expression, { LABEL: "expression" });
					this.OPTION(() => {
						this.OPTION1(() => this.CONSUME(As));
						this.SUBRULE1(this.identifier, { LABEL: "alias" });
					});
				},
			},
		]);
	});

	private readonly table_reference: () => CstNode = this.RULE(
		"table_reference",
		() => {
			this.OR([
				{
					ALT: () => {
						this.SUBRULE(this.table_name, { LABEL: "table" });
						this.OPTION1(() => {
							this.OPTION2(() => this.CONSUME1(As));
							this.SUBRULE1(this.identifier, { LABEL: "alias" });
						});
					},
				},
				{
					ALT: () => {
						this.SUBRULE(this.parenthesized_select, { LABEL: "select" });
						this.OPTION3(() => this.CONSUME2(As));
						this.SUBRULE2(this.identifier, { LABEL: "alias" });
					},
				},
			]);
		}
	);

	private readonly join_clause: () => CstNode = this.RULE("join_clause", () => {
		this.OPTION(() => {
			this.OR([
				{ ALT: () => this.CONSUME(Inner, { LABEL: "join_type" }) },
				{ ALT: () => this.CONSUME(Left, { LABEL: "join_type" }) },
				{ ALT: () => this.CONSUME(Right, { LABEL: "join_type" }) },
				{ ALT: () => this.CONSUME(Full, { LABEL: "join_type" }) },
			]);
		});
		this.CONSUME(Join);
		this.SUBRULE(this.table_reference, { LABEL: "table" });
		this.CONSUME(On);
		this.SUBRULE(this.expression, { LABEL: "left" });
		this.CONSUME(Equals);
		this.SUBRULE1(this.expression, { LABEL: "right" });
		this.MANY(() => {
			this.CONSUME1(And);
			this.SUBRULE2(this.expression, { LABEL: "extra_left" });
			this.CONSUME2(Equals);
			this.SUBRULE3(this.expression, { LABEL: "extra_right" });
		});
	});

	private readonly where_clause: () => CstNode = this.RULE(
		"where_clause",
		() => {
			this.SUBRULE(this.or_expression, { LABEL: "expression" });
		}
	);

	private readonly or_expression: () => CstNode = this.RULE(
		"or_expression",
		() => {
			this.SUBRULE(this.and_expression, { LABEL: "operands" });
			this.MANY(() => {
				this.CONSUME(Or);
				this.SUBRULE1(this.and_expression, { LABEL: "operands" });
			});
		}
	);

	private readonly and_expression: () => CstNode = this.RULE(
		"and_expression",
		() => {
			this.SUBRULE(this.atomic_predicate, { LABEL: "operands" });
			this.MANY(() => {
				this.CONSUME(And);
				this.SUBRULE1(this.atomic_predicate, { LABEL: "operands" });
			});
		}
	);

	private readonly atomic_predicate: () => CstNode = this.RULE(
		"atomic_predicate",
		() => {
			this.OR([
				{
					ALT: () => {
						this.CONSUME(Not, { LABEL: "unary_not" });
						this.SUBRULE(this.atomic_predicate, { LABEL: "negated" });
					},
				},
				{
					ALT: () => {
						this.SUBRULE(this.column_reference, { LABEL: "comparison_column" });
						this.OR1([
							{
								ALT: () => {
									this.SUBRULE(this.comparison_operator, {
										LABEL: "comparison_operator",
									});
									this.SUBRULE(this.expression, {
										LABEL: "comparison_value",
									});
								},
							},
							{
								ALT: () => {
									this.CONSUME(Is);
									this.OPTION(() => this.CONSUME1(Not, { LABEL: "is_not" }));
									this.CONSUME(NullKeyword);
								},
							},
							{
								ALT: () => {
									this.CONSUME(Between);
									this.SUBRULE1(this.expression, { LABEL: "between_start" });
									this.CONSUME1(And);
									this.SUBRULE2(this.expression, { LABEL: "between_end" });
								},
							},
							{
								ALT: () => {
									this.OPTION1(() => this.CONSUME2(Not, { LABEL: "in_not" }));
									this.CONSUME(InKeyword);
									this.CONSUME1(LeftParen);
									this.OR2([
										{
											ALT: () =>
												this.SUBRULE(this.expression_list, { LABEL: "in_list" }),
										},
										{
											ALT: () =>
												this.SUBRULE(this.cte_substatement, {
													LABEL: "in_select",
												}),
										},
									]);
									this.CONSUME1(RightParen);
								},
							},
							{
								ALT: () => {
									this.OPTION2(() => this.CONSUME3(Not, { LABEL: "like_not" }));
									this.CONSUME(Like);
									this.SUBRULE3(this.expression, { LABEL: "like_pattern" });
								},
							},
						]);
					},
				},
				{
					ALT: () => {
						this.CONSUME2(LeftParen);
						this.SUBRULE(this.or_expression, { LABEL: "inner" });
						this.CONSUME2(RightParen);
					},
				},
			]);
		}
	);

	private readonly order_by_clause: () => CstNode = this.RULE(
		"order_by_clause",
		() => {
			this.SUBRULE(this.order_by_item, { LABEL: "items" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.order_by_item, { LABEL: "items" });
			});
		}
	);

	private readonly order_by_item: () => CstNode = this.RULE(
		"order_by_item",
		() => {
			this.SUBRULE(this.column_reference, { LABEL: "expression" });
			this.OPTION(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Asc, { LABEL: "direction" }) },
					{ ALT: () => this.CONSUME(Desc, { LABEL: "direction" }) },
				]);
			});
		}
	);

	private readonly table_name: () => CstNode = this.RULE("table_name", () => {
		this.SUBRULE(this.identifier, { LABEL: "parts" });
		this.OPTION(() => {
			this.CONSUME(Dot);
			this.SUBRULE1(this.identifier, { LABEL: "parts" });
		});
	});

	private readonly assignment_item: () => CstNode = this.RULE(
		"assignment_item",
		() => {
			this.SUBRULE(this.column_reference, { LABEL: "column" });
			this.CONSUME(Equals);
			this.SUBRULE(this.expression, { LABEL: "value" });
		}
	);

	private readonly column_reference: () => CstNode = this.RULE(
		"column_reference",
		() => {
			this.SUBRULE(this.identifier, { LABEL: "parts" });
			this.OPTION(() => {
				this.CONSUME(Dot);
				this.SUBRULE1(this.identifier, { LABEL: "parts" });
			});
		}
	);

	private readonly comparison_operator: () => CstNode = this.RULE(
		"comparison_operator",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Equals, { LABEL: "operator" }) },
				{ ALT: () => this.CONSUME(NotEquals, { LABEL: "operator" }) },
				{ ALT: () => this.CONSUME(NotEqualsAlt, { LABEL: "operator" }) },
				{
					ALT: () => this.CONSUME(GreaterThanOrEqual, { LABEL: "operator" }),
				},
				{
					ALT: () => this.CONSUME(LessThanOrEqual, { LABEL: "operator" }),
				},
				{ ALT: () => this.CONSUME(GreaterThan, { LABEL: "operator" }) },
				{ ALT: () => this.CONSUME(LessThan, { LABEL: "operator" }) },
			]);
		}
	);

	private readonly expression_list: () => CstNode = this.RULE(
		"expression_list",
		() => {
			this.SUBRULE(this.expression, { LABEL: "items" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.expression, { LABEL: "items" });
			});
		}
	);

	private readonly values_list: () => CstNode = this.RULE("values_list", () => {
		this.SUBRULE(this.values_clause, { LABEL: "rows" });
		this.MANY(() => {
			this.CONSUME(Comma);
			this.SUBRULE1(this.values_clause, { LABEL: "rows" });
		});
	});

	private readonly values_clause: () => CstNode = this.RULE(
		"values_clause",
		() => {
			this.CONSUME(LeftParen);
			this.SUBRULE(this.expression_list, { LABEL: "values" });
			this.CONSUME(RightParen);
		}
	);

	private readonly expression: () => CstNode = this.RULE("expression", () => {
		this.SUBRULE(this.additive_expression, { LABEL: "expression" });
	});

	private readonly additive_expression: () => CstNode = this.RULE(
		"additive_expression",
		() => {
			this.SUBRULE(this.multiplicative_expression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Plus, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Minus, { LABEL: "operators" }) },
				]);
				this.SUBRULE1(this.multiplicative_expression, {
					LABEL: "operands",
				});
			});
		}
	);

	private readonly multiplicative_expression: () => CstNode = this.RULE(
		"multiplicative_expression",
		() => {
			this.SUBRULE(this.unary_expression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Star, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Slash, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Percent, { LABEL: "operators" }) },
				]);
				this.SUBRULE1(this.unary_expression, { LABEL: "operands" });
			});
		}
	);

	private readonly unary_expression: () => CstNode = this.RULE(
		"unary_expression",
		() => {
			this.OPTION(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Minus, { LABEL: "unary_operator" }) },
					{ ALT: () => this.CONSUME(Not, { LABEL: "unary_operator" }) },
				]);
			});
			this.SUBRULE(this.primary_expression, { LABEL: "operand" });
		}
	);

	private readonly primary_expression: () => CstNode = this.RULE(
		"primary_expression",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Parameter, { LABEL: "parameter" }) },
				{ ALT: () => this.CONSUME(StringLiteral, { LABEL: "string" }) },
				{ ALT: () => this.CONSUME(NumberLiteral, { LABEL: "number" }) },
				{
					GATE: () =>
						this.LA(1).tokenType === Identifier &&
						this.LA(2).tokenType === LeftParen,
					ALT: () => {
						this.CONSUME(Identifier, { LABEL: "callIdentifier" });
						this.CONSUME(LeftParen, { LABEL: "callLParen" });
						this.OPTION(() => {
							this.SUBRULE1(this.expression, { LABEL: "callArguments" });
							this.MANY(() => {
								this.CONSUME(Comma);
								this.SUBRULE2(this.expression, { LABEL: "callArguments" });
							});
						});
						this.CONSUME(RightParen, { LABEL: "callRParen" });
					},
				},
			{
				GATE: () => {
					const next = this.LA(1).tokenType;
					return next === Identifier || next === QuotedIdentifier;
				},
				ALT: () =>
					this.SUBRULE(this.column_reference, { LABEL: "reference" }),
			},
			{
				GATE: this.BACKTRACK(this.parenthesized_select),
				ALT: () =>
					this.SUBRULE(this.parenthesized_select, { LABEL: "subselect" }),
			},
			{
				ALT: () => {
					this.CONSUME1(LeftParen, { LABEL: "groupLParen" });
					this.SUBRULE(this.expression, { LABEL: "inner" });
					this.CONSUME1(RightParen, { LABEL: "groupRParen" });
				},
			},
			]);
		}
	);

	private readonly identifier: () => CstNode = this.RULE("identifier", () => {
		this.OR([
			{ ALT: () => this.CONSUME(Identifier) },
			{ ALT: () => this.CONSUME(QuotedIdentifier) },
		]);
	});
}

export const parserInstance: SqlParser = new SqlParser();

function extractFirstError(
	label: string,
	errors: ReadonlyArray<unknown>
): Error | null {
	if (errors.length === 0) {
		return null;
	}
	const [first] = errors;
	if (first instanceof Error) {
		return first;
	}
	return new Error(`${label} failed: ${String(first)}`);
}

export function parseCst(sql: string): CstNode | null {
	const lexResult = sqlLexer.tokenize(sql);
	const lexError = extractFirstError("Lexing", lexResult.errors);
	if (lexError) {
		parserInstance.reset();
		return null;
	}
	parserInstance.input = lexResult.tokens;
	const cst = parserInstance.select_statement();
	const parseErrors = [...parserInstance.errors];
	parserInstance.reset();
	const parseError = extractFirstError("Parsing", parseErrors);
	if (parseError) {
		return null;
	}
	return cst;
}
