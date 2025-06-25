# How Lix Works

Lix is a change control system designed to run in the browser. This page provides an overview of the core architecture and how the different components interact.

## Core Architecture

At its core, Lix combines:
1. A SQLite database (running in WebAssembly)
2. A type-safe SQL query builder ([Kysely](https://kysely.dev/))
3. A plugin system for handling different file formats
4. A change detection and tracking system

This architecture allows Lix to provide powerful change control capabilities within the browser environment.

## Component Overview

### Database Layer

Lix uses a SQLite database running in WebAssembly to store all data. The database schema includes tables for:

- Files
- Changes
- Snapshots
- Versions
- Labels
- Threads (discussions)
- And more...

The database is the source of truth for all data in a Lix application.

### SQL Query Interface

All interactions with the Lix database happen through Kysely, a type-safe SQL query builder. This provides:

- Type safety with TypeScript
- SQL-based queries (no new query language to learn)
- Powerful filtering and aggregation capabilities

### Plugin System

Plugins in Lix handle specific file formats, providing:

1. **Change Detection**: Understanding what changed between different versions of a file
2. **Schema Definition**: Defining the data model for the file format
3. **Change Application**: Applying changes to files

Different plugins handle different file formats:
- [JSON Plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-json) for JSON files
- [CSV Plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-csv) for CSV files
- [Markdown Plugin](https://github.com/opral/monorepo/tree/main/packages/lix-plugin-md) for Markdown files
- And more...

### Change Detection Flow

When a file is updated in Lix, the following process occurs:

1. The file is written to the database
2. The file-queue system detects the change
3. The appropriate plugin analyzes the old and new versions
4. The plugin generates change records describing what changed
5. The changes are stored in the database
6. The snapshot system groups related changes together

This flow ensures that every modification to a file is tracked and can be queried later.

## Usage Flow

The typical flow for using Lix in an application is:

1. **Initialize Lix**: [Create](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/new-lix.ts) or [open](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/lix/open-lix-in-memory.ts) a Lix file with required plugins
2. **Insert/Update Files**: Add or modify files in the Lix database
3. **Query Changes**: Retrieve information about what changed
4. **Manage Versions**: [Create](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/create-version.ts) and [switch](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/version/switch-version.ts) between different versions
5. **Merge Changes**: [Combine changes](https://github.com/opral/monorepo/blob/main/packages/lix-sdk/src/change-set/create-merge-change-set.ts) from different versions

All of these operations are performed through the SQL interface, providing a consistent and powerful API for managing changes.

## Memory Model

Lix is designed to work in memory by default, but can be synchronized with persistent storage systems:

- **In-Memory Mode**: All data is stored in memory
- **File Persistence**: Changes can be serialized to disk
- **Remote Sync**: Changes can be synchronized with remote servers

This design allows Lix to work in a variety of environments, from fully offline to collaborative online applications.

## Next Steps

Now that you understand how Lix works at a high level, you can explore the core concepts in more detail:

- [Files](./concepts/files) - Learn about the primary data containers
- [Changes](./concepts/changes) - Understand how changes are tracked
- [Versions](./concepts/versions) - See how different states are managed