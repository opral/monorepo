import { LanguageTag } from "@inlang/language-tag";
import { Type, type Static } from "@sinclair/typebox";

/**
 * A (text) element that is translatable and rendered to the UI.
 */
export type Text = Static<typeof Text>;
export const Text = Type.Object({
  type: Type.Literal("Text"),
  value: Type.String(),
});

export type VariableReference = Static<typeof VariableReference>;
export const VariableReference = Type.Object({
  type: Type.Literal("VariableReference"),
  name: Type.String(),
});

/**
 * An expression is a reference to a variable or a function.
 *
 * Think of expressions as elements that are rendered to a
 * text value during runtime.
 */
export type Expression = Static<typeof Expression>;
export const Expression = Type.Union([VariableReference]);

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
export type Pattern = Static<typeof Pattern>;
export const Pattern = Type.Array(Type.Union([Text, Expression]));

/**
 * A variant contains a pattern that is rendered to the UI.
 */
export type Variant = Static<typeof Variant>;
export const Variant = Type.Object({
  languageTag: LanguageTag,
  /**
   * The number of keys in each variant match MUST equal the number of expressions in the selectors.
   *
   * Inspired by: https://github.com/unicode-org/message-format-wg/blob/main/spec/formatting.md#pattern-selection
   */
  // a match can always only be string-based because a string is what is rendered to the UI
  match: Type.Array(Type.String()),
  pattern: Pattern,
});

export type Message = Static<typeof Message>;
export const Message = Type.Object({
  id: Type.String(),
  alias: Type.Record(Type.String(), Type.String()),
  /**
   * The order in which the selectors are placed determines the precedence of patterns.
   */
  selectors: Type.Array(Expression),
  variants: Type.Array(Variant),
});
