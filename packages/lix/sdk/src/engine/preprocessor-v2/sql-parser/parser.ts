import { CstParser, EOF, type CstNode } from "chevrotain";
import {
	Select,
	From,
	Identifier,
	Star,
	Semicolon,
	As,
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
			this.OPTION(() => this.CONSUME(Semicolon));
			this.CONSUME(EOF);
		}
	);

	private readonly selectList: () => CstNode = this.RULE("selectList", () => {
		this.CONSUME(Star);
	});

	private readonly tableReference: () => CstNode = this.RULE(
		"tableReference",
		() => {
			this.SUBRULE(this.tableIdentifierRule);
			this.OPTION(() => {
				this.OPTION1(() => this.CONSUME(As));
				this.SUBRULE(this.aliasIdentifierRule);
			});
		}
	);

	private readonly tableIdentifierRule: () => CstNode = this.RULE(
		"tableIdentifier",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME(Identifier) },
				{ ALT: () => this.CONSUME(QuotedIdentifier) },
			]);
		}
	);

	private readonly aliasIdentifierRule: () => CstNode = this.RULE(
		"aliasIdentifier",
		() => {
			this.OR([
				{ ALT: () => this.CONSUME1(Identifier) },
				{ ALT: () => this.CONSUME1(QuotedIdentifier) },
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
