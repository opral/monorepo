/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Using parsimmon because:
 *
 * 1. Chevrotain is too complicated.
 * 2. TypeScript's compiler doesn't work in the browser.
 * 3. TypeScripts compiler
 */

import Parsimmon from "parsimmon"
import type { PluginSettings } from "../settings.js"

const createParser = (settings: PluginSettings, defaultNS: string | undefined) => {
	// Create a Parsimmon language
	return Parsimmon.createLanguage({
		// The entry point for message reference matching.
		//
		// 1. Match a t function call or any other character.
		// 2. Match as many of these as possible.
		// 3. Filter out any non-object matches.
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
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

		// Whitespace parser
		whitespace: () => {
			return Parsimmon.optWhitespace
		},

		// Colon parser
		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!)
		},

		// Comma parser
		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!)
		},

		// Parser for t function calls
		FunctionCall: function (r) {
			return Parsimmon.seqMap(
				Parsimmon.regex(/[^a-zA-Z0-9]/), // no preceding letters or numbers
				Parsimmon.string("t"), // starts with t
				Parsimmon.string("("), // then an opening parenthesis
				Parsimmon.index, // start position of the message id
				r.stringLiteral!, // message id
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
				Parsimmon.string(")"), // end with a closing parenthesis
				(_, __, ___, start, messageId, end) => {
					// -- handle namespaces --
					if (defaultNS) {
						messageId = defaultNS + "." + messageId
					}

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
					} // satisfies MessageReferenceMatch
				}
			)
		},
	})
}

const createNamespaceParser = (pattern: string) => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
					// filter arbitrary characters
					return matches.filter((match) => typeof match === "object")
				})
		},

		stringLiteral: (r) => {
			return Parsimmon.alt(r.doubleQuotedString!, r.singleQuotedString!)
		},

		doubleQuotedString: () => {
			return Parsimmon.string('"').then(Parsimmon.regex(/[^"]*/)).skip(Parsimmon.string('"'))
		},

		singleQuotedString: () => {
			return Parsimmon.string("'").then(Parsimmon.regex(/[^']*/)).skip(Parsimmon.string("'"))
		},

		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!)
		},

		whitespace: () => {
			return Parsimmon.optWhitespace
		},

		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!)
		},

		nsValue: (r) => {
			return Parsimmon.seq(
				r.whitespace!,
				Parsimmon.string("namespace").trim(r.whitespace!).skip(r.colon!), // namespace key parser
				r.stringLiteral!.trim(r.whitespace!)
			).map(([, , val]) => `${val}`)
		},

		// Parser for t function calls
		FunctionCall: function (r) {
			return Parsimmon.seqMap(
				Parsimmon.regex(/[^a-zA-Z0-9]/), // no preceding letters or numbers
				Parsimmon.regex(/\b(?:use|get)Translations\b/), // starts with useTranslation or getTranslations
				Parsimmon.string(pattern), // then an opening parenthesis
				Parsimmon.index, // start position of the message id
				Parsimmon.regex(/[^)]*/), // inside string
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
				Parsimmon.string(")"), // end with a closing parenthesis
				(_, __, ___, ____, insideString) => {
					const namespaceParser = Parsimmon.alt(
						Parsimmon.seq(
							Parsimmon.string("{").trim(r.whitespace!),
							Parsimmon.string("locale").trim(r.whitespace!),
							Parsimmon.alt(
								Parsimmon.seq(r.comma!, r.nsValue!).map(([, val]) => val),
								Parsimmon.seq(
									r.colon!,
									r.stringLiteral!.trim(r.whitespace!),
									r.comma!,
									r.nsValue!,
									Parsimmon.regex(/[^)}]*/)
								).map(([, , , val]) => val)
							),
							Parsimmon.string("}").trim(r.whitespace!)
						).map(([, , val]) => val),
						Parsimmon.seq(
							Parsimmon.string("{").trim(r.whitespace!),
							r.nsValue!,
							Parsimmon.regex(/[^)}]*/),
							Parsimmon.string("}").trim(r.whitespace!)
						).map(([, val]) => val),
						Parsimmon.seq(r.stringLiteral!)
					)
					const namespace = (
						namespaceParser.parse(insideString) as { status: boolean; value: string }
					).value

					return {
						ns: namespace,
					}
				}
			)
		},
	})
}

function parseNameSpaces(settings: PluginSettings, sourceCode: string) {
	const namespaceParser = createNamespaceParser("(")
	const namespaces = namespaceParser.entry!.tryParse(sourceCode)
	if (namespaces.length > 0) {
		return namespaces[0].ns
	} else {
		return undefined
	}
}

// Parse the expression
export function parse(sourceCode: string, settings: PluginSettings) {
	try {
		const namespace: undefined | string = parseNameSpaces(settings, sourceCode)
		const parser = createParser(settings, namespace)
		return parser.entry!.tryParse(sourceCode)
	} catch {
		return []
	}
}
