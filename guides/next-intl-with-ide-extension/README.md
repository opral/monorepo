![image](https://cdn.jsdelivr.net/gh/opral/monorepo@latest/inlang/guides/next-intl-with-ide-extension/assets/next-intl-guide.png)

## What is this about?

In this guide, I'll walk you through the seamless integration of the [next-intl](https://inlang.com/m/hheug211) internationalization library with [Sherlock](https://inlang.com/m/r7kp499g). This powerful combination, featuring next-intl and an Sherlock, enhances your development workflow, offering i18n management for Next.js projects.

#### Main Links:

<doc-links>
    <doc-link title="Next-Intl" icon="mdi:bookmark-box-multiple" href="/m/hheug211" description="Read documentation"></doc-link>
	<doc-link title="Next-Intl Plugin" icon="mdi:puzzle" href="/m/193hsyds" description="Make it compatible"></doc-link>
	<doc-link title="Sherlock" icon="mdi:microsoft-visual-studio-code" href="/m/r7kp499g" description="Supercharge i18n within VS Code"></doc-link>
</doc-links>

## Why Choose Sherlock and next-intl together?

The synergy of the next-intl i18n library and an [IDE extension](/m/r7kp499g) provides a robust solution for internationalization in Next.js. Here's why it's a winning combination:

- **Extract translations:** via the `Sherlock: Extract Message` code action.
- **Translation Linting:** Get notified about missing translations and other issues directly in your IDE.
- **Inline Annotations:** See translations directly in your code.
- **Update Translations:** Translations from the resource files are automatically updated when you change the source text.

## Let's Get Started:

### 1. Add the settings.json file:

<br/>

- Ensure you have a working next-intl project. You could also find examples [here](https://next-intl-docs.vercel.app/examples)
- Add a `project.inlang` folder on the root
- Copy the following `settings.json` file to that new dir `project.inlang/settings.json`.

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "sourceLanguageTag": "en",
  "languageTags": ["en", "de"],
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

### 2. Install Sherlock:

<br/>

- Install Sherlock from the [vscode marketplace](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)
- Reload the VS Code window to activate the extension.

## Usage:

- Visit the ide-extension [documenation](https://inlang.com/m/r7kp499g)
- Visit the next-intl [documenation](https://inlang.com/m/hheug211)

<br/>
<br/>
