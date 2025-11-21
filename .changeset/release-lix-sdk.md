---
"@lix-js/sdk": minor
---

Refactored the architecture of lix to be event-sourced. 

Changes are now the source of truth which allows re-materialization of state at any point in time, and re-assurance of data integrity. 

Lix up to v0.4 used SQLite event triggers to track changes. The risk of missing triggers combined with a lack of hooking into the commit process meant that changes could be lost or not properly tracked. 

This release includes: 

- **Lix Engine**: A query engine (`packages/lix/sdk/src/engine`) that includes a custom SQL parser, preprocessor, and query optimizer to map queries to native SQL.

- **Reactive queries**: subscribe UI components to live data with `lix.observe()`; emits on every state commit for polling-free updates.

- **Diffing + history**: working/checkpoint and commit-to-commit diffs, plus a `state_history` view for blame and time-travel.

- **Change proposals**: change proposals with conversations/messages and per-change authorship for review flows.

- **Support for directories**: built-in directory/file descriptors and path helpers replace the old file-queue plumbing.
  
- **Engine portabilityy**: `openLix` now accepts raw plugin modules and exposes `lix.call(...)` for worker/remote environments.

- **New Transaction Model**: A formal 3-stage mutation lifecycle (Mutation -> Transaction -> Commit) ensures ACID guarantees and clearer change tracking.

- **Schema definition API**: API for defining custom entity schemas, making Lix extensible for any data type.