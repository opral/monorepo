/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Using parsimmon because:
 *
 * 1. Chevrotain is too complicated.
 * 2. TypeScript's compiler doesn't work in the browser.
 * 3. TypeScripts compiler
 */

import Parsimmon from "parsimmon";
import type { PluginSettings } from "../settings.js";

const createParser = (
	settings: PluginSettings,
	defaultNS: string | undefined,
	keyPrefix: string | undefined
) => {
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
					return matches.filter((match) => typeof match === "object");
				});
		},

		// A string literal is either a single or double quoted string
		stringLiteral: (r) => {
			return Parsimmon.alt(r.doubleQuotedString!, r.singleQuotedString!);
		},

		// Double quoted string literal parser
		//
		// 1. Start with a double quote.
		// 2. Then match any character that is not a double quote.
		// 3. End with a double quote.
		doubleQuotedString: () => {
			return Parsimmon.string('"')
				.then(Parsimmon.regex(/[^"]*/))
				.skip(Parsimmon.string('"'));
		},

		// Single quoted string literal parser
		//
		// 1. Start with a single quote.
		// 2. Then match any character that is not a single quote.
		// 3. End with a single quote.
		singleQuotedString: () => {
			return Parsimmon.string("'")
				.then(Parsimmon.regex(/[^']*/))
				.skip(Parsimmon.string("'"));
		},

		// Whitespace parser
		whitespace: () => {
			return Parsimmon.optWhitespace;
		},

		// Colon parser
		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!);
		},

		// Comma parser
		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!);
		},

		// Parser for namespace value
		nsValue: (r) => {
			return Parsimmon.seq(
				r.whitespace!,
				Parsimmon.string("ns").trim(r.whitespace!).skip(r.colon!), // namespace key parser
				r.stringLiteral!.trim(r.whitespace!)
			).map(([, , val]) => `${val}`);
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
				(_, __, ___, start, messageId, end, rest) => {
					const namespaceParser = r
						.comma! // comma
						.then(Parsimmon.string("{")) // opening bracket
						.trim(r.whitespace!) // whitespace
						.then(r.nsValue!) // namespace value parser
						.skip(Parsimmon.string("}")) // closing bracket
						.skip(Parsimmon.regex(/[^)]*/)) // ignore the rest of the function call
						.trim(r.whitespace!); // whitespace

					const namespace = (
						namespaceParser.parse(rest) as { status: boolean; value: string }
					).value;

					// -- handle namespaces --
					// only handle namespaces when the pathPattern require namespaces
					if (typeof settings.pathPattern === "object") {
						if (namespace) {
							// if namespace gets parsed, prepend it to the messageId
							messageId =
								namespace +
								":" +
								(keyPrefix ? keyPrefix + "." : "") +
								messageId;
						} else if (!messageId.includes(":")) {
							// if no namespace gets parsed and the namespace is not already included in the messageId, prepend the default namespace
							const defaultNamespace = defaultNS
								? defaultNS
								: Object.keys(settings.pathPattern)[0];
							messageId =
								defaultNamespace +
								":" +
								(keyPrefix ? keyPrefix + "." : "") +
								messageId;
						}
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
					}; // satisfies MessageReferenceMatch
				}
			);
		},
	});
};

const createNamespaceParser = (pattern: string) => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
					// filter arbitrary characters
					return matches.filter((match) => typeof match === "object");
				});
		},

		stringLiteral: (r) => {
			return Parsimmon.alt(r.doubleQuotedString!, r.singleQuotedString!);
		},

		doubleQuotedString: () => {
			return Parsimmon.string('"')
				.then(Parsimmon.regex(/[^"]*/))
				.skip(Parsimmon.string('"'));
		},

		singleQuotedString: () => {
			return Parsimmon.string("'")
				.then(Parsimmon.regex(/[^']*/))
				.skip(Parsimmon.string("'"));
		},

		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!);
		},

		whitespace: () => {
			return Parsimmon.optWhitespace;
		},

		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!);
		},

		keyPrefixValue: (r) => {
			return Parsimmon.seq(
				r.whitespace!,
				Parsimmon.string("keyPrefix").trim(r.whitespace!).skip(r.colon!), // namespace key parser
				r.stringLiteral!.trim(r.whitespace!)
			).map(([, , val]) => `${val}`);
		},

		// Parser for t function calls
		FunctionCall: function (r) {
			return Parsimmon.seqMap(
				Parsimmon.regex(/[^a-zA-Z0-9]/), // no preceding letters or numbers
				Parsimmon.regex(/\buseTranslations?\b/), // starts with useTranslation
				Parsimmon.string(pattern), // then an opening parenthesis
				Parsimmon.index, // start position of the message id
				r.stringLiteral!, // message id
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
				Parsimmon.string(")"), // end with a closing parenthesis
				(_, __, ___, ____, namespace, end, rest) => {
					const keyPrefixParser = r
						.comma! // comma
						.then(Parsimmon.string("{")) // opening bracket
						.trim(r.whitespace!) // whitespace
						.then(r.keyPrefixValue!) // namespace value parser
						.skip(Parsimmon.string("}")) // closing bracket
						.skip(Parsimmon.regex(/[^)]*/)) // ignore the rest of the function call
						.trim(r.whitespace!); // whitespace

					const keyPrefix = (
						keyPrefixParser.parse(rest) as { status: boolean; value: string }
					).value;

					return {
						ns: namespace,
						keyPrefix: keyPrefix,
					};
				}
			);
		},
	});
};

function parseNameSpaces(settings: PluginSettings, sourceCode: string) {
	if (typeof settings.pathPattern === "object") {
		const namespaceParser = createNamespaceParser("(");
		const namespaces = namespaceParser.entry!.tryParse(sourceCode);
		if (namespaces.length > 0) {
			return { ns: namespaces[0].ns, keyPrefix: namespaces[0].keyPrefix };
		} else {
			const namespaceArrayParser = createNamespaceParser("([");
			const namespaces = namespaceArrayParser.entry!.tryParse(sourceCode);
			if (namespaces.length > 0) {
				return { ns: namespaces[0].ns, keyPrefix: namespaces[0].keyPrefix };
			} else {
				return undefined;
			}
		}
	} else {
		return undefined;
	}
}

// Parse the expression
export function parse(sourceCode: string, settings: PluginSettings) {
	try {
		const namespaceParserResult:
			| undefined
			| { ns: string; keyPrefix: string | undefined } = parseNameSpaces(
			settings,
			sourceCode
		);
		const namespace = namespaceParserResult?.ns;
		const keyPrefix = namespaceParserResult?.keyPrefix;
		const parser = createParser(settings, namespace, keyPrefix);
		return parser.entry!.tryParse(sourceCode);
	} catch {
		return [];
	}
}
