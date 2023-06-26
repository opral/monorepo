---
title: Overview
href: /documentation/sdk/overview
description: inlang is not framework specific. It can be used with any framework.
---

# {% $frontmatter.title %} SDKs

inlang is not Framework specific. It can be used with any framework. To translate with the [editor](/editor) or use the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension) only the `inlang.config.js` file is needed.

To get started with globalizing your app, you just need to choose an SDK from the options below and follow their setup guide. Once that's done, you can jump right into the [Quickstart](/documentation/quick-start). Plus, if you go with the SvelteKit SDK, you won't have to worry about any extra inlang setup!

{% QuickLinks %}

    {% QuickLink
        title="SvelteKit"
        logo="svelte"
        href="/documentation/sdk/sveltekit"
        description="@inlang/sdk-js"
    /%}

    {% QuickLink
        title="Next.js"
        logo="next"
        href="https://github.com/i18next/next-i18next"
        description="next-i18next"
    /%}

    {% QuickLink
        title="Vue.js"
        logo="vue"
        href="https://github.com/i18next/i18next-vue"
        description="i18next-vue"
    /%}

    {% QuickLink
        title="React.js"
        logo="react"
        href="https://github.com/i18next/react-i18next"
        description="react-i18next"
    /%}

{% /QuickLinks %}

{% Callout variant="info" %}
Nothing that fits your needs? Checkout other [supported SDKs](/documentation/sdk/overview#supported-sdks).
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

### Supported SDKs

- [SvelteKit SDK](/documentation/sdk/sveltekit) maintained by inlang.
- [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n) A fully type-safe and lightweight internationalization library for all TypeScript and JavaScript projects.
- [i18next](https://www.i18next.com/) is an internationalization-SDK written in and for JavaScript.

#### Your favorite frameworks is missing?

[Reach out to us](https://github.com/inlang/inlang/discussions) and we develop an SDK for your favorite framework.
