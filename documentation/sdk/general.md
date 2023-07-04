---
title: SDK Overview and Setup
shortTitle: Overview
href: /documentation/sdk/overview
description: inlang is not framework specific. It can be used with any framework such as React, Vue, Svelte, Next.js, etc.
---

# {% $frontmatter.shortTitle %} SDKs

inlang is not Framework specific. It can be used with any framework. To translate with the [editor](/editor) or use the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension) only the `inlang.config.js` file is needed.

To get started with globalizing your app, you just need to choose an SDK from the options below and follow their setup guide. Once that's done, you can jump right into the [Quickstart](/documentation/quick-start). Plus, if you go with the SvelteKit SDK, you won't have to worry about any extra inlang setup!

{% QuickLinks %}

    {% QuickLink
        title="SvelteKit"
        logo="svelte"
        href="https://github.com/inlang/inlang/tree/main/source-code/starters/inlang-svelte"
        description="@inlang/sdk-js"
    /%}

    {% QuickLink
        title="Next.js"
        logo="next"
        href="https://github.com/inlang/inlang/tree/main/source-code/starters/inlang-nextjs"
        description="i18next"
    /%}

    {% QuickLink
        title="Nuxt.js"
        logo="vue"
        href="https://github.com/inlang/inlang/tree/main/source-code/starters/inlang-nuxt"
        description="nuxtjs/i18n"
    /%}

    {% QuickLink
        title="React.js"
        logo="react"
        href="https://github.com/i18next/react-i18next"
        description="react-i18next"
    /%}

{% /QuickLinks %}

{% Callout variant="info" %}
Nothing that fits your needs? Check out [i18n libraries that are supported via plugins](/documentation/plugins/registry).
{% /Callout %}

## What benefits does the SDK provide?

- easy setup in a few simple step
- fully configurable depending on your projects needs
- fully integrated with your Framework (compiler-based to avoid a heavy runtime)
- automatic language specific routing (e.g. `/en/site`, `/de/site`)
- faster page loads (resource splitting per route) [coming soon]
- automatic setup for inlang editor and VS Code extension

## Usage

inlang's SDK works the same in each environment it runs. Take a look at the [Usage](/documentation/sdk/usage) section to learn how to use inlang in your project.

Inlang also provides custom solutions that are built specifically for certain Frameworks.

#### Your favorite frameworks is missing?

[Reach out to us](https://github.com/inlang/inlang/discussions) and we develop an SDK for your favorite framework.
