import { Type, type Static } from "@sinclair/typebox";

/**
 * A (text) element that is translatable and rendered to the UI.
 */
export type TextV1 = Static<typeof TextV1>;
export const TextV1 = Type.Object({
	type: Type.Literal("Text"),
	value: Type.String(),
});

export type VariableReferenceV1 = Static<typeof VariableReferenceV1>;
export const VariableReferenceV1 = Type.Object({
	type: Type.Literal("VariableReference"),
	name: Type.String(),
});

/**
 * An expression is a reference to a variable or a function.
 *
 * Think of expressions as elements that are rendered to a
 * text value during runtime.
 */
export type ExpressionV1 = Static<typeof ExpressionV1>;
export const ExpressionV1 = Type.Union([VariableReferenceV1]);

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
export type PatternV1 = Static<typeof PatternV1>;
export const PatternV1 = Type.Array(Type.Union([TextV1, ExpressionV1]));

/**
 * A variant contains a pattern that is rendered to the UI.
 */
export type VariantV1 = Static<typeof VariantV1>;
export const VariantV1 = Type.Object({
	languageTag: Type.String(),
	/**
	 * The number of keys in each variant match MUST equal the number of expressions in the selectors.
	 *
	 * Inspired by: https://github.com/unicode-org/message-format-wg/blob/main/spec/formatting.md#pattern-selection
	 */
	// a match can always only be string-based because a string is what is rendered to the UI
	match: Type.Array(Type.String()),
	pattern: PatternV1,
});

export type MessageV1 = Static<typeof MessageV1>;
export const MessageV1 = Type.Object({
	id: Type.String(),
	alias: Type.Record(Type.String(), Type.String()),
	/**
	 * The order in which the selectors are placed determines the precedence of patterns.
	 */
	selectors: Type.Array(ExpressionV1),
	variants: Type.Array(VariantV1),
});
