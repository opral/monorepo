import { LanguageTag } from "@inlang/language-tag"
import { Type, Static } from "@sinclair/typebox"

/**
 * A (text) element that is translatable and rendered to the UI.
 */
export type Text = Static<typeof Text>
export const Text = Type.Object({
	type: Type.Literal("Text"),
	value: Type.String(),
})

export type VariableReference = Static<typeof VariableReference>
export const VariableReference = Type.Object({
	type: Type.Literal("VariableReference"),
	name: Type.String(),
})

export type Expression = Static<typeof Expression>
export const Expression = Type.Union([VariableReference])

// export type FunctionReference = {
// 	type: "function"
// 	name: string
// 	operand?: Text | VariableReference
// 	options?: Option[]
// }

/**
 * A pattern is a sequence of elements that comprise
 * a message that is rendered to the UI.
 */
export type Pattern = Static<typeof Pattern>
export const Pattern = Type.Array(Type.Union([Text, Expression]))

/**
 * A variant is a pattern that is rendered to the UI.
 */
export type Variant = Static<typeof Variant>
export const Variant = Type.Object({
	/**
	 * The number of keys in each variant match MUST equal the number of expressions in the selectors.
	 *
	 * Inspired by: https://github.com/unicode-org/message-format-wg/blob/main/spec/formatting.md#pattern-selection
	 */
	// a match can always only be string-based because a string is what is rendered to the UI
	match: Type.Record(Type.String(), Type.String()),
	pattern: Pattern,
})

export type Message = Static<typeof Message>
export const Message = Type.Object({
	id: Type.String(),
	/**
	 * The order in which the selectors are placed determines the precedence of patterns.
	 */
	selectors: Type.Array(Expression),
	body: Type.Record(LanguageTag, Type.Array(Variant)),
})
