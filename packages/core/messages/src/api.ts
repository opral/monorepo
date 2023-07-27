import { z } from "zod"
import type { LanguageTag } from "@inlang/language-tag"

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

/**
 * ---------- Zod Types ----------
 *
 * Not using z.infer to provide developers with a better
 * hover experience over types (comments, etc.)
 */

export const VariableReference = z.object({
	type: z.literal("VariableReference"),
	name: z.string(),
})

export const Expression = z.object({
	type: z.literal("Expression"),
	// only variable reference for now, but will be extended in the future
	body: VariableReference,
})

export const Text = z.object({
	type: z.literal("Text"),
	value: z.string(),
})

export const Pattern = z.array(z.union([Text, Expression]))

export const Variant = z.object({
	match: z.record(z.string()),
	pattern: Pattern,
})

export const Message = z.object({
	id: z.string(),
	expressions: z.array(Expression),
	selectors: z.array(Expression),
	body: z.record(z.array(Variant)),
})

// export type FunctionReference = {
// 	type: "function"
// 	name: string
// 	operand?: Text | VariableReference
// 	options?: Option[]
// }
