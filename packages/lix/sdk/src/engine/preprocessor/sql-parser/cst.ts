import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	Insert,
	Update,
	Delete,
	From,
	Into,
	DefaultKeyword,
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
	Distinct,
	Group,
	Union,
	All,
	Intersect,
	Except,
	With,
	Recursive,
	Inner,
	Left,
	Right,
	Full,
	Join,
	On,
	Conflict,
	Over,
	Partition,
	RowsKeyword,
	RangeKeyword,
	GroupsKeyword,
	UnboundedKeyword,
	PrecedingKeyword,
	FollowingKeyword,
	CurrentKeyword,
	RowKeyword,
	WindowKeyword,
	DoKeyword,
	NothingKeyword,
	SetKeyword,
	Is,
	InKeyword,
	NullKeyword,
	Exists,
	Between,
	Like,
	Match,
	Glob,
	Regexp,
	CaseKeyword,
	WhenKeyword,
	ThenKeyword,
	ElseKeyword,
	EndKeyword,
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
	JsonExtract,
	JsonExtractText,
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
	Concat,
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
			this.OR([
				{
					ALT: () => this.SUBRULE(this.select_compound, { LABEL: "select" }),
				},
				{
					ALT: () => this.SUBRULE(this.insert_statement, { LABEL: "insert" }),
				},
				{ ALT: () => this.SUBRULE(this.update_statement, { LABEL: "update" }) },
				{ ALT: () => this.SUBRULE(this.delete_statement, { LABEL: "delete" }) },
			]);
			this.OPTION(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
		}
	);

	private readonly select_compound: () => CstNode = this.RULE(
		"select_compound",
		() => {
			this.OPTION(() => {
				this.SUBRULE(this.with_clause, { LABEL: "with_clause" });
			});
			this.SUBRULE(this.select_core, { LABEL: "cores" });
			this.MANY(() => {
				this.SUBRULE(this.compound_operator, { LABEL: "operators" });
				this.SUBRULE1(this.select_core, { LABEL: "cores" });
			});
			this.OPTION1(() => {
				this.CONSUME(Order);
				this.CONSUME(By);
				this.SUBRULE(this.order_by_clause, { LABEL: "order_by" });
			});
			this.OPTION2(() => {
				this.CONSUME(Limit);
				this.SUBRULE(this.limit_clause, { LABEL: "limit" });
			});
			this.OPTION3(() => {
				this.CONSUME(Offset);
				this.SUBRULE(this.offset_clause, { LABEL: "offset" });
			});
		}
	);

	private readonly with_clause: () => CstNode = this.RULE("with_clause", () => {
		this.CONSUME(With);
		this.OPTION(() => {
			this.CONSUME(Recursive, { LABEL: "recursive" });
		});
		this.SUBRULE(this.common_table_expression, { LABEL: "ctes" });
		this.MANY(() => {
			this.CONSUME(Comma);
			this.SUBRULE1(this.common_table_expression, { LABEL: "ctes" });
		});
	});

	private readonly common_table_expression: () => CstNode = this.RULE(
		"common_table_expression",
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
			this.SUBRULE(this.select_compound, { LABEL: "statement" });
			this.CONSUME1(RightParen);
		}
	);

	private readonly compound_operator: () => CstNode = this.RULE(
		"compound_operator",
		() => {
			this.OR([
				{
					ALT: () => {
						this.CONSUME(Union);
						this.OPTION(() => this.CONSUME(All));
					},
				},
				{ ALT: () => this.CONSUME(Intersect) },
				{ ALT: () => this.CONSUME(Except) },
			]);
		}
	);

	private readonly select_core: () => CstNode = this.RULE("select_core", () => {
		this.CONSUME(Select);
		this.OPTION(() => this.CONSUME(Distinct, { LABEL: "distinct" }));
		this.SUBRULE(this.select_list);
		this.OPTION1(() => {
			this.CONSUME(From);
			this.SUBRULE(this.table_reference, { LABEL: "from" });
			this.MANY(() => {
				this.SUBRULE1(this.join_clause, { LABEL: "joins" });
			});
		});
		this.OPTION2(() => {
			this.CONSUME(Where);
			this.SUBRULE(this.where_clause);
		});
		this.OPTION3(() => {
			this.CONSUME(Group);
			this.CONSUME(By);
			this.SUBRULE(this.expression, { LABEL: "group_by" });
			this.MANY2(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.expression, { LABEL: "group_by" });
			});
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
			this.OR([
				{
					ALT: () => {
						this.CONSUME(DefaultKeyword, { LABEL: "default_keyword" });
						this.CONSUME1(Values, { LABEL: "default_values" });
					},
				},
				{
					ALT: () => {
						this.CONSUME(Values);
						this.SUBRULE(this.values_list, { LABEL: "rows" });
					},
				},
			]);
			this.OPTION1(() => {
				this.SUBRULE(this.on_conflict_clause, { LABEL: "conflict" });
			});
		}
	);

	private readonly on_conflict_clause: () => CstNode = this.RULE(
		"on_conflict_clause",
		() => {
			this.CONSUME(On);
			this.CONSUME(Conflict);
			this.OPTION(() => {
				this.CONSUME(LeftParen);
				this.SUBRULE1(this.expression, { LABEL: "target_expressions" });
				this.MANY1(() => {
					this.CONSUME1(Comma);
					this.SUBRULE2(this.expression, { LABEL: "target_expressions" });
				});
				this.CONSUME(RightParen);
			});
			this.OPTION1(() => {
				this.CONSUME2(Where);
				this.SUBRULE3(this.or_expression, { LABEL: "target_where" });
			});
			this.CONSUME(DoKeyword);
			this.OR([
				{
					ALT: () => {
						this.CONSUME(NothingKeyword, { LABEL: "do_nothing" });
					},
				},
				{
					ALT: () => {
						this.CONSUME(Update, { LABEL: "do_update" });
						this.CONSUME(SetKeyword);
						this.SUBRULE4(this.assignment_item, { LABEL: "assignments" });
						this.MANY2(() => {
							this.CONSUME3(Comma);
							this.SUBRULE5(this.assignment_item, { LABEL: "assignments" });
						});
						this.OPTION2(() => {
							this.CONSUME4(Where);
							this.SUBRULE6(this.or_expression, { LABEL: "action_where" });
						});
					},
				},
			]);
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
						this.OPTION(() => {
							this.OPTION1(() => this.CONSUME(As));
							this.SUBRULE(this.identifier, { LABEL: "alias" });
						});
					},
				},
				{
					ALT: () => {
						this.CONSUME1(LeftParen, { LABEL: "nestedLParen" });
						this.SUBRULE(this.table_reference, { LABEL: "nested" });
						this.CONSUME1(RightParen, { LABEL: "nestedRParen" });
						this.OPTION2(() => {
							this.OPTION3(() => this.CONSUME2(As));
							this.SUBRULE1(this.identifier, { LABEL: "alias" });
						});
					},
				},
				{
					ALT: () => {
						this.CONSUME2(LeftParen, { LABEL: "selectLParen" });
						this.SUBRULE(this.select_compound, { LABEL: "select" });
						this.CONSUME2(RightParen, { LABEL: "selectRParen" });
						this.OPTION4(() => {
							this.OPTION5(() => this.CONSUME3(As));
							this.SUBRULE2(this.identifier, { LABEL: "alias" });
						});
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
		this.OPTION1(() => {
			this.CONSUME(On);
			this.SUBRULE(this.or_expression, { LABEL: "on_expression" });
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
						this.CONSUME(Exists, { LABEL: "exists" });
						this.CONSUME(LeftParen, { LABEL: "exists_lparen" });
						this.SUBRULE1(this.select_compound, { LABEL: "exists_subquery" });
						this.CONSUME(RightParen, { LABEL: "exists_rparen" });
					},
				},
				{
					GATE: () =>
						this.LA(1).tokenType !== Not && this.LA(1).tokenType !== LeftParen,
					ALT: () => {
						this.SUBRULE(this.expression, { LABEL: "left_expression" });
						this.OPTION4(() => {
							this.OR1([
								{
									ALT: () => {
										this.SUBRULE(this.comparison_operator, {
											LABEL: "comparison_operator",
										});
										this.SUBRULE1(this.expression, {
											LABEL: "comparison_value",
										});
									},
								},
								{
									ALT: () => {
										this.CONSUME(Is, { LABEL: "is_operator" });
										this.OPTION(() => this.CONSUME1(Not, { LABEL: "is_not" }));
										this.CONSUME(NullKeyword);
									},
								},
								{
									ALT: () => {
										this.CONSUME(Between);
										this.SUBRULE2(this.expression, { LABEL: "between_start" });
										this.CONSUME1(And);
										this.SUBRULE3(this.expression, { LABEL: "between_end" });
									},
								},
								{
									ALT: () => {
										this.OPTION1(() => this.CONSUME2(Not, { LABEL: "in_not" }));
										this.CONSUME(InKeyword);
										this.CONSUME1(LeftParen);
										this.OR2([
											{
												GATE: () =>
													this.LA(1).tokenType === Select ||
													this.LA(1).tokenType === With,
												ALT: () => {
													this.SUBRULE(this.select_compound, {
														LABEL: "in_subquery",
													});
												},
											},
											{
												ALT: () => {
													this.SUBRULE(this.expression_list, {
														LABEL: "in_list",
													});
												},
											},
										]);
										this.CONSUME1(RightParen);
									},
								},
								{
									ALT: () => {
										this.OPTION2(() =>
											this.CONSUME3(Not, { LABEL: "like_not" })
										);
										this.CONSUME(Like);
										this.SUBRULE4(this.expression, { LABEL: "like_pattern" });
									},
								},
							]);
						});
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
				{ ALT: () => this.CONSUME(Match, { LABEL: "operator" }) },
				{ ALT: () => this.CONSUME(Glob, { LABEL: "operator" }) },
				{ ALT: () => this.CONSUME(Regexp, { LABEL: "operator" }) },
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
		this.OR([
			{
				GATE: () => this.LA(1).tokenType === CaseKeyword,
				ALT: () => {
					this.SUBRULE(this.case_expression, { LABEL: "expression" });
				},
			},
			{
				ALT: () => {
					this.SUBRULE(this.additive_expression, { LABEL: "expression" });
				},
			},
		]);
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
			this.SUBRULE(this.concatenation_expression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Star, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Slash, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Percent, { LABEL: "operators" }) },
				]);
				this.SUBRULE1(this.concatenation_expression, {
					LABEL: "operands",
				});
			});
		}
	);

	private readonly concatenation_expression: () => CstNode = this.RULE(
		"concatenation_expression",
		() => {
			this.SUBRULE(this.unary_expression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Concat, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(JsonExtract, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(JsonExtractText, { LABEL: "operators" }) },
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
				{ ALT: () => this.CONSUME(NullKeyword, { LABEL: "nullLiteral" }) },
				{
					GATE: () =>
						this.LA(1).tokenType === CaseKeyword ||
						(this.LA(1).tokenType === Identifier &&
							this.LA(1).image?.toLowerCase() === "case"),
					ALT: () => {
						this.SUBRULE(this.case_expression, { LABEL: "caseExpression" });
					},
				},
				{
					GATE: () =>
						this.LA(1).tokenType === Identifier &&
						this.LA(2).tokenType === LeftParen,
					ALT: () => {
						this.CONSUME(Identifier, { LABEL: "callIdentifier" });
						this.CONSUME(LeftParen, { LABEL: "callLParen" });
						this.OPTION(() => {
							this.OR1([
								{
									ALT: () => {
										this.CONSUME1(Star, { LABEL: "callStar" });
									},
								},
								{
									ALT: () => {
										this.SUBRULE1(this.expression, { LABEL: "callArguments" });
										this.MANY(() => {
											this.CONSUME(Comma);
											this.SUBRULE2(this.expression, {
												LABEL: "callArguments",
											});
										});
									},
								},
							]);
						});
						this.CONSUME(RightParen, { LABEL: "callRParen" });
						this.OPTION1(() => {
							this.SUBRULE(this.over_clause, { LABEL: "overClause" });
						});
					},
				},
				{
					ALT: () =>
						this.SUBRULE(this.column_reference, { LABEL: "reference" }),
				},
				{
					GATE: () => this.LA(2).tokenType === Select,
					ALT: () => {
						this.CONSUME1(LeftParen);
						this.SUBRULE(this.select_compound, { LABEL: "subselect" });
						this.CONSUME1(RightParen);
					},
				},
				{
					GATE: () => this.LA(2).tokenType !== Select,
					ALT: () => {
						this.CONSUME2(LeftParen);
						this.SUBRULE(this.expression, { LABEL: "inner" });
						this.CONSUME2(RightParen);
					},
				},
			]);
		}
	);

	private readonly over_clause: () => CstNode = this.RULE("over_clause", () => {
		this.CONSUME(Over);
		this.OR([
			{
				ALT: () => {
					this.CONSUME(Identifier, { LABEL: "windowName" });
				},
			},
			{
				ALT: () => {
					this.CONSUME(LeftParen, { LABEL: "windowLParen" });
					this.OPTION(() => {
						this.SUBRULE(this.window_specification, { LABEL: "windowSpec" });
					});
					this.CONSUME(RightParen, { LABEL: "windowRParen" });
				},
			},
		]);
	});

	private readonly window_specification: () => CstNode = this.RULE(
		"window_specification",
		() => {
			this.OPTION(() => {
				this.SUBRULE(this.identifier, { LABEL: "name" });
			});
			this.OPTION1(() => {
				this.CONSUME(Partition);
				this.CONSUME(By);
				this.SUBRULE(this.expression, { LABEL: "partitionBy" });
				this.MANY(() => {
					this.CONSUME(Comma);
					this.SUBRULE1(this.expression, { LABEL: "partitionBy" });
				});
			});
			this.OPTION2(() => {
				this.CONSUME(Order);
				this.CONSUME1(By);
				this.SUBRULE(this.order_by_clause, { LABEL: "orderBy" });
			});
			this.OPTION3(() => {
				this.SUBRULE(this.window_frame, { LABEL: "frame" });
			});
		}
	);

	private readonly window_frame: () => CstNode = this.RULE(
		"window_frame",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(RowsKeyword, { LABEL: "units" }) },
				{ ALT: () => this.CONSUME(RangeKeyword, { LABEL: "units" }) },
				{ ALT: () => this.CONSUME(GroupsKeyword, { LABEL: "units" }) },
			]);
			this.OR1([
				{
					GATE: () => this.LA(1).tokenType === Between,
					ALT: () => {
						this.CONSUME(Between);
						this.SUBRULE(this.window_frame_bound, { LABEL: "start" });
						this.CONSUME(And);
						this.SUBRULE1(this.window_frame_bound, { LABEL: "end" });
					},
				},
				{
					ALT: () => {
						this.SUBRULE2(this.window_frame_bound, { LABEL: "start" });
					},
				},
			]);
		}
	);

	private readonly window_frame_bound: () => CstNode = this.RULE(
		"window_frame_bound",
		() => {
			this.OR([
				{
					ALT: () => {
						this.CONSUME(UnboundedKeyword, { LABEL: "unbounded" });
						this.OR1([
							{
								ALT: () =>
									this.CONSUME(PrecedingKeyword, { LABEL: "direction" }),
							},
							{
								ALT: () =>
									this.CONSUME(FollowingKeyword, { LABEL: "direction" }),
							},
						]);
					},
				},
				{
					ALT: () => {
						this.CONSUME(CurrentKeyword, { LABEL: "current" });
						this.CONSUME(RowKeyword, { LABEL: "row" });
					},
				},
				{
					ALT: () => {
						this.SUBRULE(this.expression, { LABEL: "offset" });
						this.OR2([
							{
								ALT: () =>
									this.CONSUME1(PrecedingKeyword, { LABEL: "direction" }),
							},
							{
								ALT: () =>
									this.CONSUME1(FollowingKeyword, { LABEL: "direction" }),
							},
						]);
					},
				},
			]);
		}
	);

	private readonly case_expression: () => CstNode = this.RULE(
		"case_expression",
		() => {
			this.CONSUME(CaseKeyword, { LABEL: "caseToken" });
			let hasOperand = false;
			this.OPTION(() => {
				hasOperand = true;
				this.SUBRULE(this.expression, { LABEL: "operand" });
			});
			this.AT_LEAST_ONE(() => {
				this.CONSUME(WhenKeyword, { LABEL: "whenToken" });
				if (hasOperand) {
					this.SUBRULE1(this.expression, { LABEL: "when_value" });
				} else {
					this.SUBRULE1(this.or_expression, { LABEL: "when_condition" });
				}
				this.CONSUME(ThenKeyword, { LABEL: "thenToken" });
				this.SUBRULE2(this.expression, { LABEL: "then_expression" });
			});
			this.OPTION1(() => {
				this.CONSUME(ElseKeyword, { LABEL: "elseToken" });
				this.SUBRULE3(this.expression, { LABEL: "else_expression" });
			});
			this.CONSUME(EndKeyword, { LABEL: "endToken" });
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
	const children = (cst as any)?.children ?? {};
	const core = children.core?.[0];
	const insert = children.insert?.[0];
	const update = children.update?.[0];
	const del = children.delete?.[0];
	return core ?? insert ?? update ?? del ?? cst;
}
