---
title: Architecture
description: "Paraglide isn't like other i18n libraries. It uses a compiler to generate translations. Learn more about it here."
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-video.js
---

# Architecture

<doc-video src="https://youtu.be/PBhdb5AS0mk"></doc-video>

Paraglide uses a compiler to generate JS functions from your messages. We call these "message functions".

Message Functions are fully typed and TypeScript compatible using JSDoc. They are exported individually from the `messages.js` file making them tree-shakable. When called, they return a translated string. Message functions aren't reactive in any way, if you want a translation in another language you will need to re-call them.

This design avoids many edge cases with reactivity, lazy-loading, and namespacing that other i18n libraries have to work around.

```mermaid
flowchart TD
    INLANG_PROJECT[INLANG PROJECT]

    COMPILER[COMPILER]

    subgraph RUNTIME[runtime.js]
        GET_LOCALE["getLocale()"]
        SET_LOCALE["setLocale()"]
        STRATEGY
    end

    subgraph MESSAGES[messages.js]
        M["m.hello_world()"]
    end

    COMPILER -->|Opens| INLANG_PROJECT
    M --> GET_LOCALE
    MESSAGES --> COMPILER
    RUNTIME --> COMPILER
    APP[Your App] --> M
    MESSAGE["'Hello World!'"] -->|renders| APP[Your App]
    APP --> SET_LOCALE
    GET_LOCALE --> STRATEGY
    SET_LOCALE --> STRATEGY

    classDef plainText stroke-width:0,fill-opacity:0,color:black;
    class X plainText
```

Paraglide consists of four main parts:

| Part         | Description                                              |
| ------------ | -------------------------------------------------------- |
| **Compiler** | Compiles messages into tree-shakable message functions   |
| **Messages** | The compiled tree-shakable message functions             |
| **Runtime**  | A runtime that resolves the locale based on the strategy |
| **Strategy** | The strategy to detect the locale of a user              |

