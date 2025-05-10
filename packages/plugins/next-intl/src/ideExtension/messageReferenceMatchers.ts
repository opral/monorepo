/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Parsimmon from "parsimmon";
import type { PluginSettings } from "../settings.js";

type FunctionNameToNamespaces = Record<
	string,
	Array<{ ns: string; declarationPosition: number }>
>;

const createParser = (
	settings: PluginSettings,
	functionNameToNamespaces: FunctionNameToNamespaces
) => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
					return matches.filter(
						(match) => match !== null && typeof match === "object"
					);
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

		whitespace: () => {
			return Parsimmon.optWhitespace;
		},

		colon: (r) => {
			return Parsimmon.string(":").trim(r.whitespace!);
		},

		comma: (r) => {
			return Parsimmon.string(",").trim(r.whitespace!);
		},

		FunctionCall: function (r) {
			return Parsimmon.seqMap(
				Parsimmon.regex(/[^a-zA-Z0-9]/), // no preceding letters or numbers
				Parsimmon.regex(/(?!(?:use|get)Translations\b)[a-zA-Z_][a-zA-Z0-9_]*/), // Match function name (like 't') but exclude useTranslations/getTranslations which are handled separately
				Parsimmon.string("("), // then an opening parenthesis
				Parsimmon.index, // start position of the message id
				r.stringLiteral!, // message id
				Parsimmon.index, // end position of the message id
				Parsimmon.regex(/[^)]*/), // ignore the rest of the function call
				Parsimmon.string(")"), // end with a closing parenthesis
				(_, invokedFuncName, __, keyStartIndex, messageId, keyEndIndex) => {
					// If the invoked function name is not "t" (our common case for global/default translations)
					// AND it's not found in our map of explicitly namespaced translation functions,
					// then we consider it not a match.
					if (
						invokedFuncName !== "t" &&
						!functionNameToNamespaces[invokedFuncName]
					) {
						return null;
					}

					const finalMessageId = getFinalMessageId(
						invokedFuncName,
						messageId,
						keyStartIndex.offset,
						functionNameToNamespaces
					);

					return {
						messageId: finalMessageId,
						position: {
							start: {
								line: keyStartIndex.line,
								character: keyStartIndex.column,
							},
							end: {
								line: keyEndIndex.line,
								character: keyEndIndex.column,
							},
						},
					};
				}
			);
		},
	});
};

const createNamespaceParser = () => {
	return Parsimmon.createLanguage({
		entry: (r) => {
			return Parsimmon.alt(r.FunctionCall!, Parsimmon.any)
				.many()
				.map((matches) => {
					// Filter for matches that have varName and ns
					return matches.filter(
						(match) =>
							typeof match === "object" && match && match.varName && match.ns
					);
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

		identifier: () => Parsimmon.regex(/[a-zA-Z_][a-zA-Z0-9_]*/),

		// Parser for variable name, supporting direct assignment and simple object destructuring like { t } or { t: alias }
		variableDeclarationName: (r) =>
			Parsimmon.alt(
				r.identifier!, // Direct assignment: const t = ...
				Parsimmon.seqMap(
					// Destructured assignment: const { t } = ... or const { t: tc } = ...
					Parsimmon.string("{"),
					r.whitespace!,
					r.identifier!, // Original name (e.g., 't')
					Parsimmon.alt(
						// Optional alias
						Parsimmon.seqMap(
							r.whitespace!,
							Parsimmon.string(":"),
							r.whitespace!,
							r.identifier!,
							(_, __, ___, alias) => alias
						),
						Parsimmon.succeed(null) // No alias
					),
					r.whitespace!,
					Parsimmon.string("}"),
					(_obr, _ws1, id, alias, _ws2, _cbr) => alias || id // Return alias if present, else original id
				)
			),

		stringParser: () => {
			return Parsimmon.alt(
				Parsimmon.regexp(/'([^']*)'/, 1).map((str) => ({
					type: "string",
					value: str,
				})),
				Parsimmon.regexp(/"([^"]*)"/, 1).map((str) => ({
					type: "string",
					value: str,
				}))
			);
		},

		objectParser: () => {
			const x = {
				stringLiteral: Parsimmon.regexp(/"([^"\\]|\\.)*"/).map((value) =>
					JSON.parse(value)
				), // Match double-quoted strings and parse them
				variableName: Parsimmon.regexp(
					/[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*/
				), // Match variable names
				functionLiteral: Parsimmon.regexp(/function\s*\([^)]*\)\s*\{[^}]*\}/), // Match function literals
			};

			const valueParser = Parsimmon.alt(
				x.stringLiteral,
				x.variableName,
				x.functionLiteral
			);

			const propertyParser = Parsimmon.seq(
				Parsimmon.regexp(/[\w]+/).skip(Parsimmon.optWhitespace), // Property name
				Parsimmon.string(":")
					.then(Parsimmon.optWhitespace)
					.then(valueParser)
					.fallback(undefined) // Optional colon and value
			).map(([key, value]) =>
				value !== null ? [key, value] : [key, undefined]
			);

			return Parsimmon.optWhitespace.then(
				Parsimmon.seq(
					Parsimmon.string("{").then(Parsimmon.optWhitespace),
					Parsimmon.sepBy(
						propertyParser,
						Parsimmon.string(",").then(Parsimmon.optWhitespace)
					),
					Parsimmon.optWhitespace.then(Parsimmon.string("}"))
				).map(([, entries]) => {
					const obj = Object.fromEntries(entries);
					return { type: "object", value: obj };
				})
			);
		},

		FunctionCall: function (r) {
			// Parser for the useTranslations() or getTranslations() call itself
			const useOrGetTranslationsCall = Parsimmon.seqMap(
				// Parsimmon.regex(/\b(?:use|get)Translations\b/), // OLD: no await
				Parsimmon.regex(/\b(?:await\s+)?(?:use|get)Translations\b/), // NEW: optional await
				Parsimmon.string("("),
				r.whitespace!,
				Parsimmon.alt(r.stringParser!, r.objectParser!), // Namespace string or object
				r.whitespace!,
				Parsimmon.regex(/[^)]*/), // Ignore rest of args
				Parsimmon.string(")"),
				(_, __, ___, parsedArgument) => {
					let namespace: string | undefined;

					// Case 1: Argument is a string literal e.g. useTranslations("myNamespace")
					if (
						parsedArgument.type === "string" &&
						typeof parsedArgument.value === "string"
					) {
						namespace = parsedArgument.value;
					}
					// Case 2: Argument is an object e.g. useTranslations({ namespace: "myNamespace" })
					else if (parsedArgument.type === "object") {
						const optionsObject = parsedArgument.value; // This is the object like { namespace: "..." }
						// Check if optionsObject exists and has a 'namespace' property that is a string
						if (optionsObject && typeof optionsObject.namespace === "string") {
							namespace = optionsObject.namespace;
						}
					}
					return { namespace };
				}
			);

			// Parser for the variable assignment: const myVar = useTranslations(...);
			return Parsimmon.seqMap(
				Parsimmon.index, // Capture the starting position of the declaration
				Parsimmon.regex(/\b(?:const|let|var)\b\s+/), // Matches 'const ', 'let ', or 'var '
				// r.identifier!, // The variable name (e.g., "tc", "t") // OLD: simple identifier
				r.variableDeclarationName!, // NEW: supports destructuring { t } or direct t
				r.whitespace!,
				Parsimmon.string("="), // Equals sign
				r.whitespace!,
				useOrGetTranslationsCall, // The useTranslations() or getTranslations() call
				// Callback function for seqMap
				(declPosition, _keyword, varName, _ws1, _eq, _ws2, callDetails) => {
					// callDetails is the result from useOrGetTranslationsCall, which is { namespace: "..." }
					if (callDetails && typeof callDetails.namespace === "string") {
						return {
							varName: varName,
							ns: callDetails.namespace,
							declarationPosition: declPosition.offset, // Store the declaration position
						};
					}
					return null; // Return null if parsing wasn't successful or namespace not found
				}
			);
		},
	});
};

function parseNameSpaces(sourceCode: string): FunctionNameToNamespaces {
	const namespaceParser = createNamespaceParser();
	// parsedDeclarations will be an array of { varName: string, ns: string, declarationPosition: number }
	const parsedDeclarations = namespaceParser.entry!.tryParse(sourceCode);

	const functionNameToNamespaces: FunctionNameToNamespaces = {};

	for (const declaration of parsedDeclarations) {
		// Ensure declaration is not null and has the expected properties
		if (
			declaration &&
			declaration.varName &&
			declaration.ns &&
			typeof declaration.declarationPosition === "number"
		) {
			if (!functionNameToNamespaces[declaration.varName]) {
				functionNameToNamespaces[declaration.varName] = [];
			}
			functionNameToNamespaces[declaration.varName]!.push({
				ns: declaration.ns,
				declarationPosition: declaration.declarationPosition,
			});
		}
	}

	// Optionally sort declarations by position for potentially faster lookup, though linear scan is fine for few items.
	for (const varName in functionNameToNamespaces) {
		functionNameToNamespaces[varName]!.sort(
			(a, b) => a.declarationPosition - b.declarationPosition
		);
	}

	return functionNameToNamespaces;
}

/**
 * Returns the fully qualified messageId by prepending the correct namespace, if available.
 * Looks up the most recent namespace declaration for the given variable name that appears before the function call.
 * If no suitable declaration is found, returns the original messageId.
 */
const getFinalMessageId = (
	invokedFuncName: string,
	messageId: string,
	startOffset: number,
	functionNameToNamespaces: FunctionNameToNamespaces
): string => {
	// Get all namespace declarations for the invoked function variable
	const declarations = functionNameToNamespaces[invokedFuncName];
	if (!declarations) return messageId; // No declarations found, return as is

	// Track the most recent (latest) declaration before the function call
	let latestDeclarationBeforeCall = null;
	for (const declaration of declarations) {
		// Skip declarations that appear after or at the function call
		const isDeclarationAfterOrAtCall =
			declaration.declarationPosition >= startOffset;
		if (isDeclarationAfterOrAtCall) continue;

		// If this is the first valid declaration, or it's closer to the function call than the previous one, update
		const isFirstOrCloser =
			latestDeclarationBeforeCall === null ||
			declaration.declarationPosition >
				latestDeclarationBeforeCall.declarationPosition;

		if (isFirstOrCloser) {
			latestDeclarationBeforeCall = declaration;
		}
	}

	// If no valid declaration was found, return the original messageId
	if (latestDeclarationBeforeCall === null) return messageId;
	// Prepend the namespace to the messageId
	return `${latestDeclarationBeforeCall.ns}.${messageId}`;
};

// Parse the expression
export function parse(sourceCode: string, settings: PluginSettings) {
	try {
		const functionNameToNamespaces = parseNameSpaces(sourceCode);

		const parser = createParser(settings, functionNameToNamespaces);
		const result = parser.entry!.tryParse(sourceCode);
		return result;
	} catch (error) {
		console.error("Parsing error:", error);
		return [];
	}
}
