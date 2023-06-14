import Parsimmon from "parsimmon"

// Utility tokens
const whitespace = Parsimmon.optWhitespace

const character = Parsimmon.any

// Main parser
const parser = Parsimmon.createLanguage({
	entry: (r) => {
		return Parsimmon.alt(r.tFunctionCall, character)
			.many()
			.map((matches) => {
				// filter arbitrary characters
				return matches.filter((match) => typeof match === "object")
			})
	},

	// A string literal is either a single or double quoted string
	stringLiteral: (r) => {
		return Parsimmon.alt(r.doubleQuotedString, r.singleQuotedString)
	},

	// Double quoted string literal parser
	//
	// 1. Start with a double quote.
	// 2. Then match any character that is not a double quote.
	// 3. End with a double quote.
	doubleQuotedString: () => {
		return Parsimmon.string('"').then(Parsimmon.regex(/[^"]*/)).skip(Parsimmon.string('"'))
	},

	// Single quoted string literal parser
	//
	// 1. Start with a single quote.
	// 2. Then match any character that is not a single quote.
	// 3. End with a single quote.
	singleQuotedString: () => {
		return Parsimmon.string("'").then(Parsimmon.regex(/[^']*/)).skip(Parsimmon.string("'"))
	},

	// Parser for t function calls
	tFunctionCall: function (r) {
		return Parsimmon.seqMap(
			Parsimmon.string("t"),
			Parsimmon.string("("),
			Parsimmon.index, // start position
			r.stringLiteral, // message id
			Parsimmon.index, // end position
			Parsimmon.string(")").trim(whitespace),
			(_, __, start, messageId, end) => {
				return {
					messageId,
					position: {
						start,
						end,
					},
				}
			},
		)
	},
})

// Test expression
const sourceCode = `sss  t("some-id"  )   t('www-ddd'  ) dd`

// Parse the expression
export function parse(sourceCode: string) {
	try {
		return parser.entry.tryParse(sourceCode)
	} catch {
		return []
	}
}

console.log(parse(sourceCode))
