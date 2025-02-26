---
imports:
  - https://cdn.jsdelivr.net/npm/@opral/markdown-wc-doc-elements/dist/doc-callout.js
---

# Incremental Migration to Paraglide JS

Migrating from an existing i18n solution to a new one can be challenging, especially in large codebases. Paraglide JS is designed to make this transition as smooth as possible, allowing you to migrate incrementally without disrupting your existing application.

## Multi-Format Translation Support

Paraglide JS can work with multiple translation file formats simultaneously, making it an ideal solution for incremental migration. This means you can:

- Continue using your existing translation files
- Mix and match different formats (JSON, i18next, etc.)
- Migrate your codebase piece by piece

## Setting Up Side-by-Side Migration with i18next

One of the most common migration paths is from i18next to Paraglide JS. Here's how to set them up to work side-by-side:

### 1. Install the i18next Plugin

First, install the i18next plugin for Paraglide:

```bash
npm install @inlang/paraglide-js-adapter-i18next
```

### 2. Configure Your Project

Update your `project.inlang` settings to include the i18next plugin:

```json
{
  "sourceLanguageTag": "en",
  "languageTags": ["en", "de", "fr"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-format-plugin@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@latest/dist/index.js"
  ],
  "plugin.inlang.i18next": {
    "pathPattern": "./locales/{languageTag}.json"
  }
}
```

### 3. Using Both Libraries Together

Now you can use both i18next and Paraglide JS in your code:

```js
// Existing i18next code
import i18next from 'i18next';
console.log(i18next.t('greeting', { name: 'World' }));

// New Paraglide JS code
import { m } from './paraglide/messages.js';
console.log(m.greeting({ name: 'World' }));
```

Both libraries will use the same translation files, ensuring consistency during your migration.

## Migration Strategy

Here's a recommended approach for incremental migration:

1. **Start with New Features**: Use Paraglide JS for new features while keeping existing code on your current solution.

2. **Component by Component**: Migrate components or modules one at a time, starting with less critical ones.

3. **Refactor Gradually**: Plan refactoring sprints that focus on migrating specific sections of your application.

4. **Test Thoroughly**: Ensure that both systems work correctly side-by-side during the migration period.

<doc-callout type="tip">
  During migration, you can use your existing i18next translation files directly with Paraglide JS, which means translations only need to be managed in one place.
</doc-callout>

## Example: Migrating from i18next

Let's walk through a typical migration scenario from i18next:

### Before Migration (i18next only)

```js
// Using i18next
import i18next from 'i18next';

function Greeting() {
  return <h1>{i18next.t('greeting', { name: 'User' })}</h1>;
}
```

### During Migration (both systems)

```js
// Using both systems
import i18next from 'i18next';
import { m } from './paraglide/messages.js';

function OldGreeting() {
  return <h1>{i18next.t('greeting', { name: 'User' })}</h1>;
}

function NewGreeting() {
  return <h1>{m.greeting({ name: 'User' })}</h1>;
}
```

### After Migration (Paraglide JS only)

```js
// Using Paraglide JS only
import { m } from './paraglide/messages.js';

function Greeting() {
  return <h1>{m.greeting({ name: 'User' })}</h1>;
}
```

## Supporting Multiple File Formats

Paraglide JS can work with various file formats simultaneously. For example, you can set up your `project.inlang` to use both JSON and i18next formats:

```json
{
  "sourceLanguageTag": "en",
  "languageTags": ["en", "de", "fr"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/message-format-plugin@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-json@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@latest/dist/index.js"
  ],
  "plugin.inlang.json": {
    "pathPattern": "./messages/{languageTag}.json"
  },
  "plugin.inlang.i18next": {
    "pathPattern": "./locales/{languageTag}/translation.json"
  }
}
```

This configuration allows Paraglide JS to read from both your standard JSON files and i18next-formatted files.

## Conclusion

Incremental migration to Paraglide JS offers a practical path forward for teams looking to modernize their i18n approach without a disruptive rewrite. The ability to work with multiple file formats and alongside existing solutions makes Paraglide JS an excellent choice for gradual adoption.

By leveraging Paraglide's flexibility and plugin system, you can enjoy the benefits of tree-shakable, type-safe internationalization while migrating at your own pace.