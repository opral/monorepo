---
title: Architecture
description: "Paraglide isn't like other i18n libraries. It uses a compiler to generate translations. Learn more about it here."
---

# Architecture

Paraglide uses a compiler to generate JS functions from your messages. We call these "message functions".

Message Functions are fully typed using JSDoc. They are exported individually from the `messages.js` file making them tree-shakable. When called, they return a translated string. Message functions aren't reactive in any way, if you want a translation in another language you will need to re-call them.

This design avoids many edge cases with reactivity, lazy-loading, and namespacing that other i18n libraries have to work around.

In addition to the message functions, ParaglideJS also emits a runtime. The runtime is used to set the language tag. It contains less than 50 LOC (lines of code) and is less than 300 bytes minified & gzipped.

```mermaid
flowchart TD
    INLANG_PROJECT[INLANG PROJECT]

    COMPILER[COMPILER]

    subgraph RUNTIME
        GET_LOCALE["getLocale()"]
        SET_LOCALE["setLocale()"]
    end

    subgraph MESSAGES
        M["m.hello_world()"]
    end


    subgraph STRATEGY
        X["Your strategy defines how a locale is resolved. Cookie-based, i18n routing, everything is possible."]
    end

    COMPILER --> INLANG_PROJECT
    M --> GET_LOCALE
    MESSAGES --> COMPILER
    RUNTIME --> COMPILER
    APP[Your App] --> M
    MESSAGE["'Hello World!'"] -->|renders| APP[Your App]
    APP --> SET_LOCALE
    GET_LOCALE -->|"defineGetLocale()"| STRATEGY
    SET_LOCALE -->|"defineSetLocale()"| STRATEGY

    classDef plainText stroke-width:0,fill-opacity:0,color:black;
    class X plainText
```

Paraglide consists of four main parts:

| Part                  | Description                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Compiler**          | Compiles messages into tree-shakable message functions                                                                       |
| **Messages**          | The compiled tree-shakable message functions                                                                                 |
| **Runtime**           | A runtime that resolves the locale based on the strategy                                                                     |
| **Strategy**          | The strategy to detect the locale of a user                                                                                  |