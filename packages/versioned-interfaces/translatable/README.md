# What does this library?

This library provides an interface for externally provided translations.

# Design goals

- **Incrementally adoptable.** Most applications start without any translation logic and suddenly find themselves in need of translation logic. This library allows you to add translation logic to your application without having to rewrite large parts of your application.
- **A stable (data) interface with no implementation logic** This library only defines a (data) interface to exchange translations between internal and external parties. This library does not include implementation logic to reduce the risk of breaking changes. 

# How to use

### When to use this library

- Translations are outside of your control (e.g. provided by a third party like a user, customer, or plugin developer).

### When not to use this library

- You are the only one providing translations for your application. Use an i18n library instead.


## Install

You can install the @inlang/cli with this command:

```sh
npm install @inlang/translatable
```

or

```sh
yarn add @inlang/translatable
```

## Usage

```ts
import { Translatable } from "@inlang/translatable"

const translatable1: Translatable<string> = "Hello world"
const translatable2: Translatable<string> = {
	en: "Hello world",
	de: "Hallo Welt",
}

// "Hello world"
const translation = typeof translatable1 === "object" ? translatable1["de"] ?? translatable.en : translatable1

// "Hello world"
const translation = typeof translatable2 === "object" ? translatable2.en : translatable2

// "Hallo Welt"
const translation = typeof translatable2 === "object" ? translatable2["de"] ?? translatable2.en : translatable2
```

You are free to write utility functions. 

```ts
import { Translatable } from "@inlang/translatable"

const translatable1: Translatable<string> = "Hello world"
const translatable2: Translatable<string> = {
	en: "Hello world",
	de: "Hallo Welt",
}

// Hello world
const translation = t(translatable1, "de")
```
