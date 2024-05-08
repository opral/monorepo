# sdk/v2 MessageBundle types

A message bundle is a collection of ICU Messages (Message Format 2).
A bundle has a id (or aliases) which can be used the refer to a message from code.
Each message in the bundle targets a different locale.

### Usage

```ts
import type { Message, MessageBundle } from '@inlang/sdk/v2'

const myMessageBundle: MessageBundle = {
  // to be filled in
}
```

In case of type name conflicts with existing Message type

```ts
import type * as V2 from '@inlang/sdk/v2'

const myMessageBundle: V2.MessageBundle = {
  // to be filled in
}
```


### New types

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
