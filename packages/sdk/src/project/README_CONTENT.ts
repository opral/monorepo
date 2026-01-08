/**
 * README content that gets written to every .inlang project folder.
 *
 * The goal is to help coding agents understand what this folder is
 * and how to use the inlang SDK to build tooling.
 */
export const README_CONTENT = `// this readme is auto generated
## What is this folder?

This is an [unpacked (git-friendly)](https://inlang.com/docs/unpacked-file-format) inlang project.

\`\`\`
*.inlang/
├── settings.json    # Locales, plugins, and file patterns (source of truth)
├── cache/           # Plugin caches (gitignored)
└── .gitignore       # Ignores cache by default
\`\`\`

Everything in this folder is managed by the SDK, except for \`settings.json\`, which can be edited by users.

Translation files (like \`messages/en.json\`) live **outside** this folder and are referenced via plugins in \`settings.json\`.

## What is inlang?

[Inlang](https://inlang.com) is an open file format designed for building localization (i18n) tooling. It provides:

- **CRUD API** — Read and write translations programmatically
- **SQL queries** — Query messages like a database, scale to millions
- **Plugin system** — Import/export any format (JSON, XLIFF, etc.)
- **Version control** — Built-in version control via [lix](https://lix.dev)

\`\`\`
┌──────────┐        ┌───────────┐         ┌────────────┐
│ i18n lib │        │Translation│         │   CI/CD    │
│          │        │   Tool    │         │ Automation │
└────┬─────┘        └─────┬─────┘         └─────┬──────┘
     │                    │                     │
     └─────────┐          │          ┌──────────┘
               ▼          ▼          ▼
           ┌──────────────────────────────────┐
           │          *.inlang file           │
           └──────────────────────────────────┘
\`\`\`

## Quick start

\`\`\`bash
npm install @inlang/sdk
\`\`\`

\`\`\`ts
import { loadProjectFromDirectory } from "@inlang/sdk";

const project = await loadProjectFromDirectory({ path: "./project.inlang" });

// Query messages (uses SQLite under the hood)
const messages = await project.db.selectFrom("message").selectAll().execute();

// Insert a new message
await project.db
  .insertInto("message")
  .values({
    id: "new_message_id",
    bundleId: "welcome_header",
    locale: "en",
  })
  .execute();

// Save changes back to disk
import { saveProjectToDirectory } from "@inlang/sdk";
await saveProjectToDirectory({ path: "./project.inlang", project });
\`\`\`

## Data model

\`\`\`
bundle (a concept, e.g., "welcome_header")
  └── message (per locale, e.g., "en", "de")
        └── variant (plural forms, gender, etc.)
\`\`\`

- **bundle**: Groups messages by ID (e.g., \`welcome_header\`)
- **message**: A translation for a specific locale
- **variant**: Handles pluralization/selectors (most messages have one variant)

## Common tasks

| Task                      | Code                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Get all bundles           | \`project.db.selectFrom("bundle").selectAll().execute()\`                             |
| Get messages for locale   | \`project.db.selectFrom("message").where("locale", "=", "en").selectAll().execute()\` |
| Find missing translations | Compare message counts across locales                                               |
| Update a message          | \`project.db.updateTable("message").set({ ... }).where("id", "=", "...").execute()\`  |

## Links

- [SDK documentation](https://inlang.com/docs)
- [inlang.com](https://inlang.com)
- [List of plugins](https://inlang.com/c/plugins)
- [List of tools](https://inlang.com/c/tools)
`;
