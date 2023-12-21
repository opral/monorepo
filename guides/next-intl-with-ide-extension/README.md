# Setting Up next-intl with IDE Extension.

In this guide, I'll walk you through the seamless integration of the next-intl internationalization library with your favorite IDE extension. This powerful combination, featuring next-intl and an IDE extension, enhances your development workflow, offering i18n management for Next.js projects.

## Why Choose the IDE Extension and next-intl Combo?

The synergy of the next-intl i18n library and an IDE extension provides a robust solution for internationalization in Next.js. Here's why it's a winning combination:

- **Context Tooltips:** See translations and edit them directly in your code. No more back-and-forth looking into the translation files themselves.
- **Extract translations:** via the `Inlang: Extract Message` code action.
- **Translation Linting:** Get notified about missing translations and other issues directly in your IDE.
- **Inline Annotations:** See translations directly in your code. No more back-and-forth looking into the translation files themselves.
- **Update Translations:** Translations from the resource files are automatically updated when you change the source text.

## Let's Get Started:

### 1. Add the settings.json file:
- Ensure you have a working next-intl project. You could also find examples [here](https://next-intl-docs.vercel.app/examples)
- Copy the provided settings file to your project: project.inlang/settings.json.

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "en",
  "languageTags": [
    "en", "de"
  ],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-next-intl@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js"
  ],
  "plugin.inlang.nextIntl": {
    "pathPattern": "./messages/{languageTag}.json"
  }
}
```
Adjust languageTags, and the path to your translations if needed.
The `plugin-next-intl` is a plugin to make next-intl ecosystem compatible with inlang. For further configuration read the [documentation](https://inlang.com/m/193hsyds/plugin-inlang-nextIntl).

### 2. Install the IDE Extension:
- - Install the IDE extension from the [vscode marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)
Reload the VS Code window to activate the extension.

## Usage:
- Visit the ide-extension [documenation](https://inlang.com/m/r7kp499g)
- Visit the next-intl [documenation](https://inlang.com/m/hheug211)
