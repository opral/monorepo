import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	From,
	Where,
	Or,
	Inner,
	Join,
	On,
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
			this.OPTION2(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
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
			this.SUBRULE(this.identifier, { LABEL: "table" });
			this.OPTION(() => {
				this.OPTION1(() => this.CONSUME(As));
				this.SUBRULE1(this.identifier, { LABEL: "alias" });
			});
		}
	);

	private readonly joinClause: () => CstNode = this.RULE("joinClause", () => {
		this.OPTION(() => this.CONSUME(Inner));
		this.CONSUME(Join);
		this.SUBRULE(this.tableReference, { LABEL: "table" });
		this.CONSUME(On);
		this.SUBRULE(this.columnReference, { LABEL: "left" });
		this.CONSUME(Equals);
		this.SUBRULE1(this.columnReference, { LABEL: "right" });
	});

	private readonly whereClause: () => CstNode = this.RULE("whereClause", () => {
		this.SUBRULE(this.orExpression, { LABEL: "expression" });
	});

	private readonly orExpression: () => CstNode = this.RULE(
		"orExpression",
		() => {
			this.SUBRULE(this.atomicPredicate, { LABEL: "operands" });
			this.MANY(() => {
				this.CONSUME(Or);
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
						this.SUBRULE(this.columnReference, { LABEL: "column" });
						this.CONSUME(Equals);
						this.SUBRULE(this.valueExpression, { LABEL: "value" });
					},
				},
				{
					ALT: () => {
						this.CONSUME(LeftParen);
						this.SUBRULE(this.orExpression, { LABEL: "inner" });
						this.CONSUME(RightParen);
					},
				},
			]);
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

	private readonly valueExpression: () => CstNode = this.RULE(
		"valueExpression",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Parameter) },
				{ ALT: () => this.CONSUME(StringLiteral) },
				{ ALT: () => this.CONSUME(NumberLiteral) },
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
	return cst;
}
