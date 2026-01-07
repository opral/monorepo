# t Function Matcher for Sherlock

This plugin enables [Sherlock](https://inlang.com/m/r7kp499g/app-inlang-ideExtension) (VS Code extension) to recognize `t("key")` function calls used by most i18n libraries.

![Sherlock inline preview](https://cdn.jsdelivr.net/npm/@inlang/plugin-t-function-matcher@latest/assets/sherlock-preview.svg)

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
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-t-function-matcher@latest/dist/index.js"
  ]
}
```

Then install [Sherlock](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension) from the VS Code marketplace.

## Matched patterns

The plugin recognizes these patterns:

| Pattern | Example |
|---------|---------|
| Simple call | `t("welcome")` |
| With variables | `t("greeting", { name: "World" })` |
| With namespace | `t("common:button")` |
| In JSX | `{t("label")}` |
