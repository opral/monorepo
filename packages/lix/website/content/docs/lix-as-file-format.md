# Lix as File Format

Lix is designed to be used as the foundation for application-specific file formats. Instead of building change control, versioning, and collaboration from scratch, you can build your file format on top of lix and inherit these capabilities automatically.

## Overview

Let's say you want to build a markdown editor where:

- Documents are portable (share via email, Dropbox, USB)
- Images are embedded, not broken links
- Changes sync between devices
- Full history of edits is available

With lix, we could define a new file format `.mdoc` that stores everything in a single portable file:

```
document.mdoc            # A portable lix file (like a .zip)
  ├── /doc.md           # Markdown content
  ├── /assets/diagram.png
  ├── /assets/photo.jpg
  └── /config.json      # Metadata
```

A lix file is essentially a **portable directory with built-in change control**. Think of it like a zip file, but every change to every file is tracked, versioned, and can be reviewed.

Building a file format on lix:

1. **Wrap a lix file** - Create with `newLixFile()`, open with `openLix()`
2. **Store files inside** - Documents, assets, configuration - just like a directory
3. **Provide a domain API** - Simple methods for your users
4. **Get change control for free** - Versioning, history, and collaboration built-in

The lix file is portable - share it anywhere. All files inside get automatic change tracking and can sync between devices.

## Advantages

**Local first app**

Building a web app with lix is reduced to providing a user interface that opens and saves a file.

![Open a file, provide a UI, done](/open_file.png)

**Auth, permissions, collaboration, change history, and automations come with lix**

These features are solved at the file level rather than application level.

![Backend features for files](/backend_features_to_files.png)

Building a file format on lix gives you:

- **Portable files** - Single .lix file contains everything (documents, assets, config)
- **Change control** - Every edit is tracked automatically
- **Version management** - Create versions for experiments or alternate drafts
- **Collaboration** - Built-in merge and conflict resolution
- **SQL queries** - Query history, diffs, and changes with SQL

## Interoperability Between Apps

Solving features at the file level enables different apps and personas to work with the same file. A designer, developer, translator, and PM can each use their preferred tool while collaborating on the same underlying data.

![Inlang interoperability example](/inlang-interop.svg)

[Inlang](https://inlang.com) uses this in production: multiple inlang apps (editor, CLI, plugins, IDE extensions) all work with the same `.inlang` file. Each app provides a different interface for different personas, but they all read and write to the same portable file with shared auth, permissions, and change history.

This interoperability is only possible because features are solved at the file level rather than locked into a specific application.

## Common Use Cases

- **Document editors** - Markdown/rich text with assets and history
- **Design tools** - Designs with embedded assets and version control
- **Note-taking apps** - Notes with attachments that sync
- **Configuration management** - Config files with audit trails
- **Spreadsheets** - Cell changes and formula history tracked
- **Content creation** - Articles, videos, assets in one portable file

## How to Build a File Format on Lix

**1. Create a lix file**
Use `newLixFile()` and `openLix()` to initialize your portable file format.

**2. Store your data**
Add files (`/doc.md`, `/assets/*`) and configuration. Optionally define custom entities.

**3. Provide a domain API**
Wrap lix operations in methods that feel natural (`doc.setContent()`, not `lix.db.updateTable()`).

## Simple Example

Let's build a portable markdown document format (`.mdoc`):

```ts
import { newLixFile, openLix } from "@lix-js/sdk";

// Create new .mdoc file
async function newMarkdownDoc() {
  const lix = await openLix({ blob: await newLixFile() });

  await lix.db
    .insertInto("file")
    .values({
      path: "/doc.md",
      data: new TextEncoder().encode("# New Document"),
    })
    .execute();

  return await lix.toBlob();
}

// Load and edit
async function loadMarkdownDoc(blob: Blob) {
  const lix = await openLix({ blob });

  return {
    async getContent() {
      const file = await lix.db
        .selectFrom("file")
        .where("path", "=", "/doc.md")
        .select("data")
        .executeTakeFirstOrThrow();
      return new TextDecoder().decode(file.data);
    },

    async setContent(markdown: string) {
      await lix.db
        .updateTable("file")
        .where("path", "=", "/doc.md")
        .set({ data: new TextEncoder().encode(markdown) })
        .execute();
    },

    // Access lix for versioning/history
    lix,

    async save() {
      return await lix.toBlob();
    },
  };
}
```

**Usage:**

```ts
const file = await newMarkdownDoc();
const doc = await loadMarkdownDoc(file);

await doc.setContent("# Hello World");
const updatedFile = await doc.save();

// Version management comes free
const version = await createVersion({ lix: doc.lix, name: "draft" });
```

## Real-World Example: Inlang SDK

[Inlang](https://inlang.com) built a production i18n file format on lix used by thousands of developers:

**Why it works:**

- **Multiple apps, one file** - Editor, CLI, IDE extensions, and Figma plugin all work with `.inlang` files
- **Custom schema** - Bundle, message, and variant tables for translation data
- **Natural API** - `project.db.selectFrom("message")` feels intuitive for i18n developers
- **Portable** - Works everywhere (browser, Node, workers) with full change control

This demonstrates the power of file-level features: different personas (developers, designers, translators) use different apps but collaborate on the same portable file.

See the [[Inlang](https://inlang.com) SDK source code](https://github.com/opral/monorepo/tree/main/inlang/packages/sdk/src/project) for implementation details.

## Key Patterns

**1. Store structure as files**

```
/doc.md           # Content
/assets/          # Binary assets
/config.json      # Configuration
```

**2. Define custom schemas for structured data**
Use lix's schema system for domain entities (messages, tasks, records) instead of storing everything as files.

**3. Expose underlying lix**
Let advanced users access `project.lix` for versioning, history, and change proposals.

**4. Provide domain-specific operations**
Hide lix complexity: `doc.addImage()` not `lix.db.insertInto("file")`.

**5. Make it portable**
Implement `toBlob()` for serialization and accept `blob` in your load function.

## Next Steps

- Learn about [Lix Plugins](/docs/plugins) to support different file formats
- Explore [Versions](/docs/versions) for branching workflows
- See [Change Proposals](/docs/change-proposals) for review workflows
- Check the [Inlang SDK source code](https://github.com/opral/monorepo/tree/main/inlang/packages/sdk) for a complete example
