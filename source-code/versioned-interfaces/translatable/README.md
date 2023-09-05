# @inlang/translatable

This library provides an interface for externally provided translations.

## Usage 

```ts
import { Translatable, translationFor } from "@inlang/translatable"

const translatable1: Translatable<string> = "Hello world"
const translatable2: Translatable<string> = {
  en: "Hello world",
  de: "Hallo Welt",
}
 
translationFor("en", translatable1) // "Hello world"
translationFor("en", translatable2) // "Hello world"
translationFor("de", translatable2) // "Hallo Welt"
```

## About this library

### Design goals 

- **Incrementally adoptable.** Most applications start without any translation logic and suddenly find themselves in need of translation logic. This library allows you to add translation logic to your application without having to rewrite large parts of your application.
- **No logic exposure to external parties.** This library defines an interface for external parties to define translations. No logic is exposed to external parties which reduces maintenance effort. If the translation logic (ever) updates, only internal code needs to be updated. The code of external parties stays identical.      

### When to use this library

- Translations are outside of your control (e.g. provided by a third party like a user, customer, or plugin developer). 

### When not to use this library 

- You are the only one providing translations for your application. Use an i18n library instead.