---
title: m Function Matcher - Paraglide JS Integration for Sherlock
description: Enable inline translation previews and linting for Paraglide JS m.message() function calls in VS Code with Sherlock.
og:image: https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/assets/sherlock-preview.svg
---

# m Function Matcher for Sherlock

This plugin enables [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) (VS Code extension) to recognize `m.message()` function calls used by [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).

![Sherlock inline preview](https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/assets/sherlock-preview.svg)

## What it does

- **Inline previews**: See translations directly in your code editor
- **Message extraction**: Extract hardcoded strings into messages
- **Linting**: Get warnings for missing or invalid message references

## Supported file types

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Svelte (`.svelte`)
- Vue (`.vue`)
- Astro (`.astro`)

## Installation

Add the plugin to your `project.inlang/settings.json`:

```json
{
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js"
	]
}
```

Then install [Sherlock](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension) from the VS Code marketplace.

## Matched patterns

The plugin recognizes these patterns:

| Pattern        | Example                         |
| -------------- | ------------------------------- |
| Simple call    | `m.welcome()`                   |
| With variables | `m.greeting({ name: "World" })` |
| In JSX         | `{m.button_label()}`            |
