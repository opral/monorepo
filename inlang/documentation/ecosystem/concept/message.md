# Message

A message is a piece of text that is displayed to the user. Everything within an application, like the text on a button, is a message. A message itself is composed of variants. User preferences like language or region determine which variant is displayed. Inlang's message handling is based on the [ICU Message Format 2.0](https://github.com/unicode-org/message-format-wg/blob/main/spec/syntax.md).

## ID (human readable)

**💡 This is an upcoming feature, read issue [#1892](https://github.com/opral/monorepo/issues/1892).** 

Messages use human readable and auto-generated IDs. 

```diff
+id: "penguin_purple_shoe_window"
```

You will fall in love with auto-generated IDs, we promise:

- preserves change history for messages through immutability
- no need to think about "Should this key be `login-button-label` or `signup-label-button`?"
- no name convention discussions in the team


<doc-figure src="https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/alias-naming.png" alt="naming convention disucssions" caption="Auto generated human readable IDs prevent naming discussions."></doc-figure>



## Alias

**❗ Only use aliases if you import pre-existing messages, not for newly created messages.** 

Aliases allow managing pre-existing messages with keys like "account-settings-button-label" with the inlang ecosystem by treating the key as an "alias" for a message. 

```diff
id: "banana_car_sky_door"
+alias: {
+  default: "login-page-card-title"
+  android: "signup-screen-card-title"
+  ios: "LOGIN_CARD_HEADER"  
+}
```

_A message always has an auto-generated but human readable ID. The alias is an optional field._

### When to use aliases? 

1. You have pre-existing messages with keys and want to adopt parts of inlang ecosystem without refactoring code.
2. You target multiple platforms that need a different syntax to reference the same message e.g. iOS must use `UPPERCASE_WITH_UNDERSCORES` and Android must use `kebab-case`.

### When NOT to use aliases?

You create a new message that has no pre-existing key. In this case, only use the auto-generated human readable ID. 

### What is bad about using keys like `account-settings-button-label` as an ID?

1. Risk of loosing change history.
2. Discussions around name conventions.
3. Translators and designers have no possibility to create messages via inlang apps like [fink](https://inlang.com/m/tdozzpar) or [parrot](https://inlang.com/m/gkrpgoir).
  
GitHub issue [#1892](https://github.com/opral/monorepo/issues/1892) provides more context on our decision to use auto-generated but human readable IDs for messages instead of keys.


#### Unnecessary name convention discussions

![naming](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/alias-naming.png)

Giving something a "name" (key or alias) invitably leads to naming convention discussions.


Should a key be `login-button-label`, `login_button_label`, or even `loginScreenButton`? In reality, it does not matter. The main purpose of a key is to reference the message. Context like "Where a message is used?" is provided with tooling from the inlang ecosystem. Any attempt to establish a naming convention will lead to discussions. Discussions that are unnecessary because someone will, by mistake, break the naming convention and thereby make all discussions irrelevant. 

Don't waste time discussing naming conventions. Use the assigned human readable IDs and ship your software. The inlang ecosystem tooling will do the rest! :)  


#### Losing the change history of messages

![lackOfImmutability](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/alias-key-immutability.png)

Keys/aliases like "login-button-label" are mutable. Anyone can rename a key/alias. The moment a key/alias is renamed, history like "What was the previous English text?" of a message is lost.

Suppose someone renamed "login-button-label" to "signup-button-label", the message "login-button-label" does not exist anymore. Hence, "signup-button-label" is a brand new message with no history. Existing systems try re-establish the relationship between "login-button-label" and "signup-button-label" with fuzzy matching. Fuzzy matching is error-prone, unreliable, and is not required when the auto-generated immutable and human readable IDs are used.  

## Variant

Variants are the different versions of a message. They are used to display the grammatically correct message pattern of a variant in different languages based on selectors.

### Selectors

A message can contain a set of selectors (e.g. `gender` or `plural`) and variants that contain matching values for them. For example, a message can have a `gender` selector with the values `male` and `female`. The variant with the best matching values is displayed to the user.

### Pattern

The pattern is the text structure of a variant. It can include variable references that are replaced with the values of the variables. For example, a pattern can be `Hello {name}` and the variable `name` can have the value `John`.
