# Message Alias

**❗ Do not use aliases for newly created messages.** 

Aliases allow managing pre-existing messages with keys like "account-settings-button-label" with the inlang ecosystem by treating the key as an "alias" for a message. 

```diff
id: "banana_car_sky_door"
+alias: {
+  default: "login-page-card-title"
+  android: "signup-screen-card-title"
+  ios: "LOGIN_CARD_HEADER"  
+}
```

## When to use aliases? 

- You have pre-existing messages with keys and want to adopt parts of inlang ecosystem without refactoring code.
- You target multiple platforms that need a different syntax to reference the same message e.g. iOS must use `UPPERCASE_WITH_UNDERSCORES` and Android must use `kebap-case`.

## Why should new messages not use aliases?

_See GitHub issue [[#1892](https://github.com/opral/monorepo/issues/1892)]_

1. Risk of loosing change history.
2. Avoid discussions around naming conventions.
3. Newly created messages via inlang apps like [fink](/m/tdozzpar) or [parrot](m/gkrpgoir) wont't have aliases.

### The lack of immutability of keys

![lackOfImmutability](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/alias-key-immutability.png)

Keys like "login-button-label" are mutable. Anyone can rename a key. The moment a key is renamed, history like "What was the previous English text?" of a message is lost.

Suppose someone renamed "login-button-label" to "signup-button-label", the message "login-button-label" does not exist anymore. Hence, "signup-button-label" is a brand new message with no history. Existing systems try re-establish the relationship between "login-button-label" and "signup-button-label" with fuzzy matching. Fuzzy matching is error-prone, unreliable, and is simply not required with proper immutable IDs.  

### Avoiding naming convention discussions

![naming](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/documentation/ecosystem/assets/alias-naming.png)

The nature of given a something a "name" (key) leads to naming convention discussions. Should the key be "login-button-label", "login_button_label", or even "loginScreenButton"? In reality, it does not matter. The purpose of a "key" is to reference the message. Context can be provided with tooling. Any attempt to establish a naming convention will lead to discussions, be broken by someone on the team, and ultimately fail. 

Don't waste time discussing naming conventions of keys. Use the assigned human readable IDs and ship your software. The inlang ecosystem tooling will do the rest! :)  
