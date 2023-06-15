/**
 * Using parsimmon because:
 *
 * 1. Chevrotain is too complicated.
 * 2. TypeScript's compiler doesn't work in the browser.
 * 3. TypeScripts compiler
 */

import Parsimmon from "parsimmon"
import type { MessageReferenceMatch } from "@inlang/core/config"

const parser = Parsimmon.createLanguage({
	// The entry point for message reference matching.
	//
	// 1. Match a t function call or any other character.
	// 2. Match as many of these as possible.
	// 3. Filter out any non-object matches.
	entry: (r) => {
		return Parsimmon.alt(r.tFunctionCall!, Parsimmon.any)
			.many()
			.map((matches) => {
				// filter arbitrary characters
				return matches.filter((match) => typeof match === "object")
			})
	},

	// A string literal is either a single or double quoted string
	stringLiteral: (r) => {
		return Parsimmon.alt(r.doubleQuotedString!, r.singleQuotedString!)
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
			Parsimmon.string("t"), // starts with t
			Parsimmon.string("("), // then an opening parenthesis
			Parsimmon.index, // start position of the message id
			r.stringLiteral!, // message id
			Parsimmon.index, // end position of the message id
			Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
			Parsimmon.string(")"), // end with a closing parenthesis
			(_, __, start, messageId, end) => {
				return {
					messageId,
					position: {
						start: {
							line: start.line,
							character: start.column,
						},
						end: {
							line: end.line,
							character: end.column,
						},
					},
				} satisfies MessageReferenceMatch
			},
		)
	},
})

// Parse the expression
export function parse(sourceCode: string): MessageReferenceMatch[] {
	try {
		return parser.entry!.tryParse(sourceCode)
	} catch {
		return []
	}
}
