import {
	LanguageTag,
	Declaration,
	MessageBundle,
	Message,
	Pattern,
	Text,
	Expression,
} from "./types.js"

export function createMessageBundle(
	id: string,
	localeText: Record<LanguageTag, string>,
	options?: {
		alias?: MessageBundle["alias"]
		variableReferencePattern?: string[]
	}
): MessageBundle {
	const messages = Object.keys(localeText).map((locale) =>
		createMessage(locale, (localeText as any)[locale], {
			variableReferencePattern: options?.variableReferencePattern,
		})
	)
	return {
		id: id,
		alias: options?.alias ?? {},
		messages,
	}
}

export function createMessage(
	locale: LanguageTag,
	text: string,
	options?: {
		variableReferencePattern?: string[]
	}
): Message {
	const pattern: Pattern = options?.variableReferencePattern
		? parsePattern(text, options.variableReferencePattern)
		: [toTextElement(text)]
	return {
		locale: locale,
		declarations: inferInputDeclarations(pattern),
		selectors: [],
		variants: [{ match: [], pattern }],
	}
}

function inferInputDeclarations(pattern: Pattern) {
	const inputMap: Record<string, boolean> = {}
	for (const element of pattern) {
		if (element.type === "expression" && element.arg.type === "variable") {
			inputMap[element.arg.name] = true
		}
	}
	return Object.keys(inputMap).map(toInputDeclaration)
}

function toTextElement(text: string): Text {
	return {
		type: "text",
		value: text,
	}
}

function toInputDeclaration(name: string): Declaration {
	return {
		type: "input",
		name,
		value: toVariableExpression(name),
	}
}

function toVariableExpression(name: string): Expression {
	return {
		type: "expression",
		arg: {
			type: "variable",
			name,
		},
	}
}

/**
 * Parses a pattern.
 * based on inlang/source-code/plugins/i18next/src/plugin.ts
 * returns v2 Pattern with variableExpression or Text elements
 *
 * @example parsePattern("Hello {{name}}!", ["{{", "}}"])
 */
function parsePattern(text: string, variableReferencePattern: string[]): Pattern {
	// dependent on the variableReferencePattern, different regex
	// expressions are used for matching

	const expression = variableReferencePattern[1]
		? new RegExp(
				`(\\${variableReferencePattern[0]}[^\\${variableReferencePattern[1]}]+\\${variableReferencePattern[1]})`,
				"g"
		  )
		: new RegExp(`(${variableReferencePattern}\\w+)`, "g")

	const pattern: Pattern = text
		.split(expression)
		.filter((element) => element !== "")
		.map((element) => {
			if (expression.test(element) && variableReferencePattern[0]) {
				return toVariableExpression(
					variableReferencePattern[1]
						? element.slice(
								variableReferencePattern[0].length,
								// negative index, removing the trailing pattern
								-variableReferencePattern[1].length
						  )
						: element.slice(variableReferencePattern[0].length)
				)
			} else {
				return toTextElement(element)
			}
		})
	return pattern
}
