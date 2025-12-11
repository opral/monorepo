# What is Lix?

Lix is an embeddable change control system that enables Git-like features such as [history](/docs/history), [versions](/docs/versions) (branches), [diffs](/docs/diffs), or [blame](/docs/attribution) for any file format and application.

What makes Lix unique:

- **Supports any file format** - Track changes in `.xlsx`, `.pdf`, `.json` etc. via plugins.
- **SQL powered** - History, versions, and diffs are all queryable via SQL.
- **Embedded** - Runs as a single SQLite file, persistable anywhere (local FS, S3, your database).

## Features

Explore the core capabilities of Lix:

- [**History**](/docs/history): Track every operation, not just snapshots. Know exactly what changed, when, and by whom.
- [**Versions (Branching)**](/docs/versions): Create named versions and branches. Experiment safely without affecting the main state.
- [**Diffs**](/docs/diffs): Compare any two points in time. See granular differences at the operation level.
- [**Change Proposals**](/docs/change-proposals): Propose changes, review them, and merge them with confidence.
- [**Attribution**](/docs/attribution): See who changed what line and when.
- [**Restore**](/docs/restore): Revert files or entire states to a previous version.
- [**Undo / Redo**](/docs/undo-redo): Implement undo/redo functionality for your application state.

## Use Cases

- **AI Agent sandboxing:** Agents propose changes, humans review and approve before applying.
- **Applications with change control:** Branch/merge-style reviews, audit trails, and versioning for structured data.

![Lix features](/lix-features.svg)
