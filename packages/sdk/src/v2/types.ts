import { Type, type Static } from "@sinclair/typebox"

/**
 * Follows the IETF BCP 47 language tag schema.
 *
 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 */
export type LanguageTag = Static<typeof LanguageTag>
/**
 * Follows the IETF BCP 47 language tag schema with modifications.
 * @see REAMDE.md file for more information on the validation.
 */

export const pattern =
	"^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$"

export const LanguageTag = Type.String({
	pattern: pattern,
	description: "The language tag must be a valid IETF BCP 47 language tag.",
	examples: ["en", "de", "en-US", "zh-Hans", "es-419"],
})

export type Literal = Static<typeof Literal>
export const Literal = Type.Object({
	type: Type.Literal("literal"),
	value: Type.String(),
})

/**
 * A (text) element that is translatable and rendered to the UI.
 */
export type Text = Static<typeof Text>
export const Text = Type.Object({
	type: Type.Literal("text"),
	value: Type.String(),
})

export type VariableReference = Static<typeof VariableReference>
export const VariableReference = Type.Object({
	type: Type.Literal("variable"),
	name: Type.String(),
})

export type Option = Static<typeof Option>
export const Option = Type.Object({
	name: Type.String(),
	value: Type.Union([Literal, VariableReference]),
})

export type FunctionAnnotation = Static<typeof FunctionAnnotation>
export const FunctionAnnotation = Type.Object({
	type: Type.Literal("function"),
	name: Type.String(),
	options: Type.Array(Option),
})

/**
 * An expression is a reference to a variable or a function.
 *
 * Think of expressions as elements that are rendered to a
 * text value during runtime.
 */
export type Expression = Static<typeof Expression>
export const Expression = Type.Object({
	type: Type.Literal("expression"),
	arg: Type.Union([Literal, VariableReference]),
	annotation: Type.Optional(FunctionAnnotation),
})

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
 * A variant contains a pattern that is rendered to the UI.
 */
export type Variant = Static<typeof Variant>
export const Variant = Type.Object({
	/**
	 * The number of keys in each variant match MUST equal the number of expressions in the selectors.
	 *
	 * Inspired by: https://github.com/unicode-org/message-format-wg/blob/main/spec/formatting.md#pattern-selection
	 */
	// a match can always only be string-based because a string is what is rendered to the UI
	match: Type.Array(Type.String()),
	pattern: Pattern,
})

export type InputDeclaration = Static<typeof InputDeclaration>
export const InputDeclaration = Type.Object({
	type: Type.Literal("input"),
	name: Type.String(),

	//TODO make this generic so that only Variable-Ref Expressions are allowed
	value: Expression,
})

// local declarations are not supported.
// Will only add when required. See discussion:
// https://github.com/opral/monorepo/pull/2700#discussion_r1591070701
//
// export type LocalDeclaration = Static<typeof InputDeclaration>
// export const LocalDeclaration = Type.Object({
// 	type: Type.Literal("local"),
// 	name: Type.String(),
// 	value: Expression,
// })
//
// export type Declaration = Static<typeof Declaration>
// export const Declaration = Type.Union([LocalDeclaration, InputDeclaration])

export type Declaration = Static<typeof Declaration>
export const Declaration = Type.Union([InputDeclaration])

export type Message = Static<typeof Message>
export const Message = Type.Object({
	locale: LanguageTag,
	declarations: Type.Array(Declaration),
	/**
	 * The order in which the selectors are placed determines the precedence of patterns.
	 */
	selectors: Type.Array(Expression),
	variants: Type.Array(Variant),
})

export type MessageBundle = Static<typeof MessageBundle>
export const MessageBundle = Type.Object({
	id: Type.String(),
	alias: Type.Record(Type.String(), Type.String()),
	messages: Type.Array(Message),
})
