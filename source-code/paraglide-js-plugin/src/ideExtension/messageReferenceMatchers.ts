import { MessageReferenceMatch } from "@inlang/core/config"
import { createToken, Lexer, EmbeddedActionsParser } from "chevrotain"

/**
 * ------------------------ Lexer ------------------------
 */

const Character = createToken({
	name: "Character",
	pattern: /[^\s\\]/,
})

// const StringDelimiter = createToken({
//   name: "StringDelimiter",
// });

const SingleQuotationMark = createToken({
	name: "SingleQuotationMark",
	pattern: /'/,
})

const DoubleQuotationMark = createToken({
	name: "DoubleQuotationMark",
	pattern: /"/,
})

const TemplateLiteral = createToken({
	name: "TemplateLiteral",
	pattern: /`/,
})

const OpeningParenthesis = createToken({
	name: "OpeningParenthesis",
	pattern: /\(/,
})

const ClosingParenthesis = createToken({
	name: "ClosingParenthesis",
	pattern: /\)/,
})

const Whitespace = createToken({
	name: "Whitespace",
	pattern: /\s+/,
	line_breaks: true,
})

const allTokens = [
	SingleQuotationMark,
	DoubleQuotationMark,
	TemplateLiteral,
	OpeningParenthesis,
	ClosingParenthesis,
	Character,
	Whitespace,
]

/**
 * ------------------------ Parser ------------------------
 */

class Parser extends EmbeddedActionsParser {
	constructor() {
		super(allTokens)

		/**
		 * Entrypoint for the parser.
		 *
		 * Aggregates all matches and returns them.
		 */
		this.RULE("result", () => {
			const result: MessageReferenceMatch[] = []

			this.MANY(() => {
				this.OR([
					{
						ALT: () => {
							const match = this.SUBRULE(
								// @ts-expect-error - The parser is only partially typesafe.
								this.tFunction,
							)
							result.push(match as MessageReferenceMatch)
						},
					},
					{
						ALT: () => this.CONSUME(Character),
					},
					{ ALT: () => this.CONSUME(Whitespace) },
				])
			})
			return result
		})

		/**
		 * Matches a t function.
		 *
		 * See the test cases for examples.
		 *
		 * @example
		 *  t("some-id")
		 *  t('some-id')
		 */
		this.RULE("tFunction", () => {
			// function name is a single character (t)
			this.CONSUME1(Character)
			// must be followed by an opening parenthesis
			this.CONSUME(OpeningParenthesis)
			// must be followed by the start of a string
			const startOfMessageId = this.OR1([
				{
					ALT: () => this.CONSUME1(SingleQuotationMark),
				},
				{
					ALT: () => this.CONSUME1(DoubleQuotationMark),
				},
				{
					ALT: () => this.CONSUME(TemplateLiteral),
				},
			])
			// that has contains the id of the message
			let id = ""
			this.MANY(() => {
				const char = this.OPTION({
					GATE: () => this.LA(1).tokenType !== startOfMessageId.tokenType,
					DEF: () => this.CONSUME(Character),
				})
				if (char?.image) {
					id += char.image
				}
			})
			// end of the string (must be the same quotation token as the start)
			const endOfMessageId = this.OR2([
				{
					GATE: () => this.LA(1).tokenType === startOfMessageId.tokenType,
					ALT: () => this.CONSUME3(SingleQuotationMark),
				},
				{
					GATE: () => this.LA(1).tokenType === startOfMessageId.tokenType,
					ALT: () => this.CONSUME3(DoubleQuotationMark),
				},
				{
					GATE: () => this.LA(1).tokenType === startOfMessageId.tokenType,
					ALT: () => this.CONSUME3(TemplateLiteral),
				},
			])
			// can be followed by additional arguments
			this.MANY2(() =>
				this.OR3([
					{
						ALT: () => this.CONSUME4(Whitespace),
					},
					{
						ALT: () => this.CONSUME4(Character),
					},
					// no idea why string delimiters are required explicitly
					// and are not included in the Character token
					{
						ALT: () => this.CONSUME4(SingleQuotationMark),
					},
					{
						ALT: () => this.CONSUME4(DoubleQuotationMark),
					},
					{
						ALT: () => this.CONSUME4(TemplateLiteral),
					},
				]),
			)
			// but at one point, a closing parenthesis (end of the function) must exist
			this.CONSUME5(ClosingParenthesis)

			return {
				messageId: id,
				position: {
					start: {
						line: startOfMessageId.startLine!,
						character: startOfMessageId.startColumn!,
					},
					end: {
						line: endOfMessageId.endLine!,
						character: endOfMessageId.endOffset!,
					},
				},
			} satisfies MessageReferenceMatch
		})

		this.performSelfAnalysis()
	}
}

/**
 * ------------------------ Exports ------------------------
 */

// reuse the same lexer instance.
const lexer = new Lexer(allTokens)

// reuse the same parser instance.
const parser = new Parser()

// wrapping it all together
export function parse(text: string) {
	const lexResult = lexer.tokenize(text)

	// setting a new input will RESET the parser instance's state.
	parser.input = lexResult.tokens

	// @ts-expect-error - The parser is not typesafe.
	const matches = parser.result() as Match[] | undefined

	return matches ?? []
}
