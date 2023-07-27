import type { LanguageTag } from "../languageTag.js"

export type Message = {
	id: string
	expressions: Expression[]
	selectors: Expression[]
	body: Record<LanguageTag, Variant[]>
}

export type Variant = {
	// a match can always only be string-based because a string is what is rendered to the UI
	match: Record<string, string>
	pattern: Pattern
}

// ------ Pattern AST Nodes ------
//
// A pattern consists of (AST) nodes that are rendered to the UI.
// inspired by (https://github.com/unicode-org/message-format-wg/blob/main/spec/syntax.md)

/**
 * A pattern is a sequence of translatable elements.
 */
export type Pattern = Array<Text | Expression>

export type Text = {
	type: "Text"
	value: string
}

export type Expression = {
	type: "Expression"
	// only variable reference for now, but will be extended in the future
	body: VariableReference
}

export type VariableReference = {
	type: "VariableReference"
	name: string
}

// export type FunctionReference = {
// 	type: "function"
// 	name: string
// 	operand?: Text | VariableReference
// 	options?: Option[]
// }
