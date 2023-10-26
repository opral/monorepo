/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Using parsimmon because:
 *
 * 1. Chevrotain is too complicated.
 * 2. TypeScript's compiler doesn't work in the browser.
 * 3. TypeScripts compiler
 */

import Parsimmon from "parsimmon"

const createParser = () => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.findReference!, Parsimmon.any)
				.many()
				.map((matches) => matches.flatMap((match) => match))
				.map((matches) => matches.filter((item) => typeof item === "object").flat())
		},

		findReference: function (r) {
			return Parsimmon.seq(Parsimmon.string("@inlang/paraglide-js"), r.findMessage!.many())
		},

		findMessage: () => {
			return Parsimmon.seqMap(
				Parsimmon.regex(/.*?(?<![a-zA-Z0-9/])m/s), // no preceding letters or numbers
				Parsimmon.string("."), // continues with "."
				Parsimmon.index, // start position of the message id
				Parsimmon.regex(/[^(]*/), // message id
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/\((?:[^()]|\([^()]*\))*\)/), // function arguments
				(_, __, start, messageId, end, args) => {
					return {
						messageId: `${messageId}`,
						position: {
							start: {
								line: start.line,
								character: start.column,
							},
							end: {
								line: end.line,
								character: end.column + args.length, // adjust for arguments length
							},
						},
					}
				}
			)
		},
	})
}

// Parse the expression
export function parse(sourceCode: string) {
	try {
		const parser = createParser()
		return parser.entry!.tryParse(sourceCode)
	} catch (e) {
		return []
	}
}
