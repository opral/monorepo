import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	From,
	Where,
	Identifier,
	Star,
	Semicolon,
	As,
	Dot,
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
			this.SUBRULE(this.tableReference);
			this.OPTION1(() => {
				this.CONSUME(Where);
				this.SUBRULE(this.whereClause);
			});
			this.OPTION2(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
		}
	);

	private readonly selectList: () => CstNode = this.RULE("selectList", () => {
		this.CONSUME(Star);
	});

	private readonly tableReference: () => CstNode = this.RULE(
		"tableReference",
		() => {
			this.SUBRULE(this.identifier);
			this.OPTION(() => {
				this.OPTION1(() => this.CONSUME(As));
				this.SUBRULE1(this.identifier);
			});
		}
	);

	private readonly whereClause: () => CstNode = this.RULE(
		"whereClause",
		() => {
			this.SUBRULE(this.columnReference);
			this.CONSUME(Equals);
			this.SUBRULE(this.valueExpression);
		}
	);

	private readonly columnReference: () => CstNode = this.RULE(
		"columnReference",
		() => {
			this.SUBRULE(this.identifier);
			this.OPTION(() => {
				this.CONSUME(Dot);
				this.SUBRULE1(this.identifier);
			});
		}
	);

	private readonly valueExpression: () => CstNode = this.RULE(
		"valueExpression",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(StringLiteral) },
				{ ALT: () => this.CONSUME(NumberLiteral) },
			]);
		}
	);

	private readonly identifier: () => CstNode = this.RULE(
		"identifier",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Identifier) },
				{ ALT: () => this.CONSUME(QuotedIdentifier) },
			]);
		}
	);
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
