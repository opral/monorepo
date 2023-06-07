import { createToken, Lexer, EmbeddedActionsParser } from "chevrotain"

type Match = {
	messageId: string
	position: {
		start: { line: number; character: number }
		end: { line: number; character: number }
	}
}

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
			const result: Match[] = []

			this.MANY(() => {
				this.OR([
					{
						ALT: () => {
							const match = this.SUBRULE(
								// @ts-expect-error - The parser is only partially typesafe.
								this.ReferenceViaFunction,
							)
							result.push(match as Match)
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
		this.RULE("ReferenceViaFunction", () => {
			// Message is referenced with a function named
			this.OR4([
				{
					// next character is t
					GATE: () => this.LA(1).image === "t",
					// thus consume it
					ALT: () => this.CONSUME6(Character),
				},
			])

			// must be followed by an opening parenthesis
			this.CONSUME(OpeningParenthesis)
			// must be followed by the start of a string
			const startOfMessageId = this.OR1([
				{
					// single quotation mark '
					ALT: () => this.CONSUME1(SingleQuotationMark),
				},
				{
					// double quoatation mark "
					ALT: () => this.CONSUME1(DoubleQuotationMark),
				},
				{
					// or template literal `
					ALT: () => this.CONSUME(TemplateLiteral),
				},
			])
			// that has contains the id of the message
			let id = ""
			this.MANY(() => {
				// can be any character except the end of the string (must be the same quotation token as the start)
				const char = this.OPTION({
					GATE: () => this.LA(1).tokenType !== startOfMessageId.tokenType,
					DEF: () => this.CONSUME(Character),
				})
				// if the character is not undefined, add it to the id
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
			} satisfies Match
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
export async function parse(text: any) {
	const lexResult = lexer.tokenize(text)

	// setting a new input will RESET the parser instance's state.
	parser.input = lexResult.tokens

	// @ts-expect-error - The parser is not typesafe.
	const matches = parser.result() as Match[] | undefined

	return matches ?? []
}
