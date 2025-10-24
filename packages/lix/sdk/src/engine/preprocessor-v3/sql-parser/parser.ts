import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	Update,
	Delete,
	From,
	Where,
	And,
	Or,
	Not,
	Order,
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

	public readonly selectStatement: () => CstNode = this.RULE(
		"selectStatement",
		() => {
			this.OR([
				{ ALT: () => this.SUBRULE(this.selectCore, { LABEL: "core" }) },
				{ ALT: () => this.SUBRULE(this.updateStatement, { LABEL: "update" }) },
				{ ALT: () => this.SUBRULE(this.deleteStatement, { LABEL: "delete" }) },
			]);
			this.OPTION(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
		}
	);

	private readonly selectCore: () => CstNode = this.RULE("selectCore", () => {
		this.CONSUME(Select);
		this.SUBRULE(this.selectList);
		this.CONSUME(From);
		this.SUBRULE(this.tableReference, { LABEL: "from" });
		this.MANY(() => {
			this.SUBRULE1(this.joinClause, { LABEL: "joins" });
		});
		this.OPTION1(() => {
			this.CONSUME(Where);
			this.SUBRULE(this.whereClause);
		});
		this.OPTION2(() => {
			this.CONSUME(Order);
			this.CONSUME(By);
			this.SUBRULE(this.orderByClause, { LABEL: "orderBy" });
		});
	});

	private readonly updateStatement: () => CstNode = this.RULE(
		"updateStatement",
		() => {
			this.CONSUME(Update);
			this.SUBRULE(this.tableReference, { LABEL: "table" });
			this.CONSUME(SetKeyword);
			this.SUBRULE(this.assignmentItem, { LABEL: "assignments" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.assignmentItem, { LABEL: "assignments" });
			});
			this.OPTION(() => {
				this.CONSUME(Where);
				this.SUBRULE(this.whereClause, { LABEL: "whereClause" });
			});
		}
	);

	private readonly deleteStatement: () => CstNode = this.RULE(
		"deleteStatement",
		() => {
			this.CONSUME(Delete);
			this.CONSUME(From);
			this.SUBRULE(this.tableReference, { LABEL: "table" });
			this.OPTION(() => {
				this.CONSUME(Where);
				this.SUBRULE(this.whereClause, { LABEL: "whereClause" });
			});
		}
	);

	private readonly selectList: () => CstNode = this.RULE("selectList", () => {
		this.OR([
			{ ALT: () => this.CONSUME(Star) },
			{
				ALT: () => {
					this.SUBRULE(this.identifier, { LABEL: "table" });
					this.CONSUME(Dot);
					this.CONSUME1(Star);
				},
			},
			{
				ALT: () => {
					this.SUBRULE(this.selectItem, { LABEL: "items" });
					this.MANY(() => {
						this.CONSUME(Comma);
						this.SUBRULE1(this.selectItem, { LABEL: "items" });
					});
				},
			},
		]);
	});

	private readonly selectItem: () => CstNode = this.RULE("selectItem", () => {
		this.SUBRULE(this.columnReference, { LABEL: "expression" });
		this.OPTION(() => {
			this.OPTION1(() => this.CONSUME(As));
			this.SUBRULE1(this.identifier, { LABEL: "alias" });
		});
	});

	private readonly tableReference: () => CstNode = this.RULE(
		"tableReference",
		() => {
			this.OR([
				{
					ALT: () => {
						this.SUBRULE(this.tableName, { LABEL: "table" });
						this.OPTION1(() => {
							this.OPTION2(() => this.CONSUME1(As));
							this.SUBRULE1(this.identifier, { LABEL: "alias" });
						});
					},
				},
				{
					ALT: () => {
						this.CONSUME(LeftParen);
						this.SUBRULE(this.selectCore, { LABEL: "select" });
						this.CONSUME(RightParen);
						this.OPTION3(() => this.CONSUME2(As));
						this.SUBRULE2(this.identifier, { LABEL: "alias" });
					},
				},
			]);
		}
	);

	private readonly joinClause: () => CstNode = this.RULE("joinClause", () => {
		this.OPTION(() => {
			this.OR([
				{ ALT: () => this.CONSUME(Inner, { LABEL: "joinType" }) },
				{ ALT: () => this.CONSUME(Left, { LABEL: "joinType" }) },
				{ ALT: () => this.CONSUME(Right, { LABEL: "joinType" }) },
				{ ALT: () => this.CONSUME(Full, { LABEL: "joinType" }) },
			]);
		});
		this.CONSUME(Join);
		this.SUBRULE(this.tableReference, { LABEL: "table" });
		this.CONSUME(On);
		this.SUBRULE(this.columnReference, { LABEL: "left" });
		this.CONSUME(Equals);
		this.SUBRULE1(this.columnReference, { LABEL: "right" });
		this.MANY(() => {
			this.CONSUME1(And);
			this.SUBRULE2(this.columnReference, { LABEL: "extraLeft" });
			this.CONSUME2(Equals);
			this.SUBRULE3(this.columnReference, { LABEL: "extraRight" });
		});
	});

	private readonly whereClause: () => CstNode = this.RULE("whereClause", () => {
		this.SUBRULE(this.orExpression, { LABEL: "expression" });
	});

	private readonly orExpression: () => CstNode = this.RULE(
		"orExpression",
		() => {
			this.SUBRULE(this.andExpression, { LABEL: "operands" });
			this.MANY(() => {
				this.CONSUME(Or);
				this.SUBRULE1(this.andExpression, { LABEL: "operands" });
			});
		}
	);

	private readonly andExpression: () => CstNode = this.RULE(
		"andExpression",
		() => {
			this.SUBRULE(this.atomicPredicate, { LABEL: "operands" });
			this.MANY(() => {
				this.CONSUME(And);
				this.SUBRULE1(this.atomicPredicate, { LABEL: "operands" });
			});
		}
	);

	private readonly atomicPredicate: () => CstNode = this.RULE(
		"atomicPredicate",
		() => {
			this.OR([
				{
					ALT: () => {
						this.SUBRULE(this.columnReference, { LABEL: "predicateColumn" });
						this.OR1([
							{
								ALT: () => {
									this.SUBRULE(this.comparisonOperator, {
										LABEL: "comparisonOperator",
									});
									this.SUBRULE(this.expression, {
										LABEL: "comparisonValue",
									});
								},
							},
							{
								ALT: () => {
									this.CONSUME(Is);
									this.OPTION(() => this.CONSUME(Not, { LABEL: "isNot" }));
									this.CONSUME(NullKeyword);
								},
							},
							{
								ALT: () => {
									this.CONSUME(Between);
									this.SUBRULE1(this.expression, { LABEL: "betweenStart" });
									this.CONSUME1(And);
									this.SUBRULE2(this.expression, { LABEL: "betweenEnd" });
								},
							},
							{
								ALT: () => {
									this.OPTION1(() => this.CONSUME1(Not, { LABEL: "inNot" }));
									this.CONSUME(InKeyword);
									this.CONSUME1(LeftParen);
									this.SUBRULE(this.expressionList, { LABEL: "inList" });
									this.CONSUME1(RightParen);
								},
							},
							{
								ALT: () => {
									this.OPTION2(() => this.CONSUME2(Not, { LABEL: "likeNot" }));
									this.CONSUME(Like);
									this.SUBRULE3(this.expression, { LABEL: "likePattern" });
								},
							},
						]);
					},
				},
				{
					ALT: () => {
						this.CONSUME2(LeftParen);
						this.SUBRULE(this.orExpression, { LABEL: "inner" });
						this.CONSUME2(RightParen);
					},
				},
			]);
		}
	);

	private readonly orderByClause: () => CstNode = this.RULE(
		"orderByClause",
		() => {
			this.SUBRULE(this.orderByItem, { LABEL: "items" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.orderByItem, { LABEL: "items" });
			});
		}
	);

	private readonly orderByItem: () => CstNode = this.RULE("orderByItem", () => {
		this.SUBRULE(this.columnReference, { LABEL: "expression" });
		this.OPTION(() => {
			this.OR([
				{ ALT: () => this.CONSUME(Asc, { LABEL: "direction" }) },
				{ ALT: () => this.CONSUME(Desc, { LABEL: "direction" }) },
			]);
		});
	});

	private readonly tableName: () => CstNode = this.RULE("tableName", () => {
		this.SUBRULE(this.identifier, { LABEL: "parts" });
		this.OPTION(() => {
			this.CONSUME(Dot);
			this.SUBRULE1(this.identifier, { LABEL: "parts" });
		});
	});

	private readonly assignmentItem: () => CstNode = this.RULE(
		"assignmentItem",
		() => {
			this.SUBRULE(this.columnReference, { LABEL: "column" });
			this.CONSUME(Equals);
			this.SUBRULE(this.expression, { LABEL: "value" });
		}
	);

	private readonly columnReference: () => CstNode = this.RULE(
		"columnReference",
		() => {
			this.SUBRULE(this.identifier, { LABEL: "parts" });
			this.OPTION(() => {
				this.CONSUME(Dot);
				this.SUBRULE1(this.identifier, { LABEL: "parts" });
			});
		}
	);

	private readonly comparisonOperator: () => CstNode = this.RULE(
		"comparisonOperator",
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

	private readonly expressionList: () => CstNode = this.RULE(
		"expressionList",
		() => {
			this.SUBRULE(this.expression, { LABEL: "items" });
			this.MANY(() => {
				this.CONSUME(Comma);
				this.SUBRULE1(this.expression, { LABEL: "items" });
			});
		}
	);

	private readonly expression: () => CstNode = this.RULE("expression", () => {
		this.SUBRULE(this.additiveExpression, { LABEL: "expression" });
	});

	private readonly additiveExpression: () => CstNode = this.RULE(
		"additiveExpression",
		() => {
			this.SUBRULE(this.multiplicativeExpression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Plus, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Minus, { LABEL: "operators" }) },
				]);
				this.SUBRULE1(this.multiplicativeExpression, {
					LABEL: "operands",
				});
			});
		}
	);

	private readonly multiplicativeExpression: () => CstNode = this.RULE(
		"multiplicativeExpression",
		() => {
			this.SUBRULE(this.unaryExpression, { LABEL: "operands" });
			this.MANY(() => {
				this.OR([
					{ ALT: () => this.CONSUME(Star, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Slash, { LABEL: "operators" }) },
					{ ALT: () => this.CONSUME(Percent, { LABEL: "operators" }) },
				]);
				this.SUBRULE1(this.unaryExpression, { LABEL: "operands" });
			});
		}
	);

	private readonly unaryExpression: () => CstNode = this.RULE(
		"unaryExpression",
		() => {
			this.OPTION(() => this.CONSUME(Minus, { LABEL: "unaryOperator" }));
			this.SUBRULE(this.primaryExpression, { LABEL: "operand" });
		}
	);

	private readonly primaryExpression: () => CstNode = this.RULE(
		"primaryExpression",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Parameter, { LABEL: "parameter" }) },
				{ ALT: () => this.CONSUME(StringLiteral, { LABEL: "string" }) },
				{ ALT: () => this.CONSUME(NumberLiteral, { LABEL: "number" }) },
				{
					ALT: () => this.SUBRULE(this.columnReference, { LABEL: "reference" }),
				},
				{
					ALT: () => {
						this.CONSUME(LeftParen);
						this.SUBRULE(this.expression, { LABEL: "inner" });
						this.CONSUME(RightParen);
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

function throwIfErrors(label: string, errors: ReadonlyArray<unknown>): void {
	if (errors.length > 0) {
		const [first] = errors;
		throw new Error(`${label} failed: ${String(first)}`);
	}
}

export function parse(sql: string): CstNode {
	const lexResult = sqlLexer.tokenize(sql);
	throwIfErrors("Lexing", lexResult.errors);
	parserInstance.input = lexResult.tokens;
	const cst = parserInstance.selectStatement();
	const parseErrors = [...parserInstance.errors];
	parserInstance.reset();
	throwIfErrors("Parsing", parseErrors);
	const children = (cst as any)?.children ?? {};
	const core = children.core?.[0];
	const update = children.update?.[0];
	const del = children.delete?.[0];
	return core ?? update ?? del ?? cst;
}
