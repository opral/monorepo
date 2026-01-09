# Unpacked Project

## What is an unpacked project?

An unpacked project is a directory representation of an `.inlang` file. Instead of a single SQLite binary, the project is stored as a folder with human-readable files.

```
project.inlang/
├── settings.json
├── cache/
├── README.md
└── .gitignore
```

## Packed vs Unpacked

| | Packed (`.inlang` file) | Unpacked (directory) |
|---|---|---|
| **Format** | Single SQLite file | Directory with files |
| **Git-friendly** | No (binary) | Yes (diffable, mergeable) |
| **Portable** | Yes (one file to share) | No |
| **Use case** | Sharing, backups, tools like Fink | Storing in git repos |

## Why does it exist?

### Storing inlang projects in git

Most codebases use git for version control. Developers want their translations co-located with their code — not in a separate system.

### Git doesn't handle binary files well

An `.inlang` file is a SQLite database (binary). Git can store binary files, but you lose:

- **Readable diffs** — Binary changes show as "file changed", not what changed
- **Merge conflict resolution** — Git can't merge binary files
- **Code review** — Teammates can't review translation changes in PRs

An unpacked project solves this. Each file is human-readable, diffable, and mergeable.

## How to use it

### Loading a project

Use `loadProjectFromDirectory()` to load an unpacked project:

```typescript
import { loadProjectFromDirectory } from "@inlang/sdk";
import fs from "node:fs";

const project = await loadProjectFromDirectory({
  path: "./project.inlang",
  fs: fs,
});

// Query translations
const messages = await project.db
  .selectFrom("message")
  .selectAll()
  .execute();
```

### Saving a project

Use `saveProjectToDirectory()` to save changes back to disk:

```typescript
import { saveProjectToDirectory } from "@inlang/sdk";
import fs from "node:fs/promises";

await saveProjectToDirectory({
  fs: fs,
  project: project,
  path: "./project.inlang",
});
```

### File synchronization

You can enable automatic syncing between the filesystem and the in-memory database:

```typescript
const project = await loadProjectFromDirectory({
  path: "./project.inlang",
  fs: fs,
  syncInterval: 1000, // sync every second
});
```

When `syncInterval` is set, changes to files on disk are automatically imported, and changes to the database are automatically exported.

## Directory structure

| File | Purpose |
|------|---------|
| `settings.json` | Project configuration (locales, plugins, plugin settings) |
| `.gitignore` | Auto-created, ignores everything except `settings.json` (including itself) |
| `README.md` | Auto-created, explains the folder to coding agents (gitignored) |
| `cache/` | Cached plugin modules (gitignored) |

Translation files (like `messages/en.json`) are managed by plugins and stored relative to your project based on plugin configuration.

## Next steps

- [CRUD API](/docs/crud-api) — Query and modify translations after loading
- [Architecture](/docs/architecture) — Understand how storage fits in the architecture
- [Writing a Tool](/docs/write-tool) — Build a tool that loads unpacked projects
