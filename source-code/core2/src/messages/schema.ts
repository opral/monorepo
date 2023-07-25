import type { LanguageTag } from "../languageTag.js"

export type Message = {
	id: string
	body: Record<LanguageTag, MessageBody>
}

type MessageBody = {
	pattern: Pattern
	// variants: Array<Variant>
}

// ------ Pattern AST Nodes ------
//
// A pattern consists of (AST) nodes that are rendered to the UI.
// inspired by (https://github.com/unicode-org/message-format-wg/blob/main/spec/syntax.md)

/**
 * A pattern is a sequence of translatable elements.
 */
// A pattern can contain nested patterns in the future (pluralization).
// Hence, a pattern is a node on its own.
export type Pattern = {
	type: "Pattern"
	elements: Array<Text | Placeholder>
}

export type Text = {
	type: "Text"
	value: string
}

export type Placeholder = {
	type: "Placeholder"
	// only variable reference for now, but will be extended in the future
	body: VariableReference
}

export type VariableReference = {
	type: "VariableReference"
	name: string
}
