# @inlang/message-bundle

A message bundle is a collection of ICU Messages (Message Format 2).

A bundle has a id (or aliases) which can be used the refer to a message from code.

Each message in the bundle targets a different locale.

```ts
export type Message = Static<typeof Message>
export const Message = Type.Object({
	locale: Locale,
	declarations: Type.Array(Declaration),
	selectors: Type.Array(Expression),
	variants: Type.Array(Variant),
})

export type MessageBundle = Static<typeof MessageBundle>
export const MessageBundle = Type.Object({
	id: Type.String(),
	alias: Type.Record(Type.String(), Type.String()),
	messages: Type.Array(Message),
})
```

See https://github.com/unicode-org/message-format-wg
