---
"@inlang/sdk": major
---

## Lix v0.5 Integration

This major update to the Inlang SDK integrates Lix v0.5.

### Key Changes

-   **Direct State Writes to Lix:** The SDK now writes all changes (bundles, messages, variants) directly to Lix, removing the previous periodic in-memory SQLite snapshotting.
-   **Granular Filesystem Sync:** Given that state is now directly written to lix, the inlang SDK can track changes on a per-file basis. When you edit a message in one locale file, only that specific file will be marked as changed and updated on disk.

### Why it Matters: The Benefits

-   **Minimized Filesystem Sync Issues:** The new granular sync mechanism minimizes a major pain point where editing a single message would cause all locale files to be rewritten, preserving manual formatting and preventing stale content from being reintroduced [opral/inlang-sherlock#173](https://github.com/opral/inlang-sherlock/issues/173).

-  **Simplified Architecture:** By replacing the "dual database" system with a single source of truth (`project.lix.db`), the SDK is now simpler, more robust, and easier to debug.
  

-   **Full Change Control:** The inlang SDK and apps can now leverage lix change control to it's fullest: Change proposals, subscriptions, history, etc.