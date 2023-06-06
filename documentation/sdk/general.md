---
title: Overview
href: /documentation/sdk/overview
description: inlang is not framework specific. It can be used with any framework.
---

# {% $frontmatter.title %}

inlang is not Framework specific. It can be used with any framework. To translate with the [editor](/editor) or use the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension) only the `inlang.config.js` file is needed.

However, we want to provide SDKs for some of the most popular frameworks. These SDKs are designed and fully integrated for the specific framework. It provides a lot of features that make it easy to use inlang with your framework of choice.

## What benefits does the SDK provide?

- easy setup in a few simple step
- fully configurable depending on your projects needs
- fully integrated with your Framework (compiler-based to avoid a heavy runtime)
- automatic language specific routing (e.g. `/en/site`, `/de/site`)
- faster page loads (resource splitting per route) [coming soon]
- typesafety (due to compiler) [coming soon]
- better SEO (localized head tags and sitemaps) [coming soon]
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

{% Feedback /%}
