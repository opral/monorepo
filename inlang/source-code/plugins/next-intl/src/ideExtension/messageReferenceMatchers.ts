/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Parsimmon from "parsimmon"
import type { PluginSettings } from "../settings.js"

const createParser = (settings: PluginSettings, defaultNS: string | undefined) => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
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

		whitespace: () => {
			return Parsimmon.optWhitespace
		},

		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!)
		},

		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!)
		},

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
						messageId = `${defaultNS}.${messageId}`
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
					}
				}
			)
		},
	})
}

const createNamespaceParser = () => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
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

		stringParser: () => {
			return Parsimmon.lookahead(Parsimmon.noneOf("{")).then(
				Parsimmon.regexp(/"([^"]*)"/, 1).map((str) => ({ type: "string", value: str }))
			)
		},

		objectParser: () => {
			const x = {
				stringLiteral: Parsimmon.regexp(/"([^"\\]|\\.)*"/).map((value) => JSON.parse(value)), // Match double-quoted strings and parse them
				variableName: Parsimmon.regexp(/[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*/), // Match variable names
				functionLiteral: Parsimmon.regexp(/function\s*\([^)]*\)\s*\{[^}]*\}/), // Match function literals
			}

			const valueParser = Parsimmon.alt(x.stringLiteral, x.variableName, x.functionLiteral)

			const propertyParser = Parsimmon.seq(
				Parsimmon.regexp(/[\w]+/).skip(Parsimmon.optWhitespace), // Property name
				Parsimmon.string(":").then(Parsimmon.optWhitespace).then(valueParser).fallback(undefined) // Optional colon and value
			).map(([key, value]) => (value !== null ? [key, value] : [key, undefined]))

			return Parsimmon.optWhitespace.then(
				Parsimmon.seq(
					Parsimmon.string("{").then(Parsimmon.optWhitespace),
					Parsimmon.sepBy(propertyParser, Parsimmon.string(",").then(Parsimmon.optWhitespace)),
					Parsimmon.optWhitespace.then(Parsimmon.string("}"))
				).map(([, entries]) => {
					const obj = Object.fromEntries(entries)
					return { type: "object", value: obj }
				})
			)
		},

		FunctionCall: function (r) {
			return Parsimmon.seqMap(
				Parsimmon.regex(/[^a-zA-Z0-9]/), // no preceding letters or numbers
				Parsimmon.regex(/\b(?:use|get)Translations\b/), // starts with useTranslations or getTranslations
				Parsimmon.string("("), // then an opening parenthesis
				Parsimmon.index, // start position of the message id
				Parsimmon.alt(r.stringParser!, r.objectParser!),
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
				Parsimmon.string(")"), // end with a closing parenthesis
				(_, __, ___, ____, insideString) => {
					let namespace = undefined

					if (insideString.type === "string") {
						namespace = insideString.value
					} else if (insideString && insideString.value.namespace) {
						namespace = insideString.value.namespace
					}
					return { ns: namespace }
				}
			)
		},
	})
}

function parseNameSpaces(settings: PluginSettings, sourceCode: string) {
	const namespaceParser = createNamespaceParser()
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
		const result = parser.entry!.tryParse(sourceCode)
		return result
	} catch (error) {
		console.error("Parsing error:", error)
		return []
	}
}
