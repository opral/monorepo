# Message

A message is a piece of text that is displayed to the user. Everything within an application, like the text on a button, is a message. A message itself is composed of variants. User preferences like language or region determine which variant is displayed. Inlang's message handling is based on the [ICU Message Format 2.0](https://github.com/unicode-org/message-format-wg/blob/main/spec/syntax.md).

## Variant

Variants are the different versions of a message. They are used to display the grammatically correct message pattern of a variant in different languages based on selectors.

### Selectors

A message can contain a set of selectors (e.g. `gender` or `plural`) and variants that contain matching values for them. For example, a message can have a `gender` selector with the values `male` and `female`. The variant with the best matching values is displayed to the user.

### Pattern

The pattern is the text structure of a variant. It can include variable references that are replaced with the values of the variables. For example, a pattern can be `Hello {name}` and the variable `name` can have the value `John`.