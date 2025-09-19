---
"@inlang/sdk": major
---

## Highlights

- Upgraded the SDK to the Lix v0.5 event pipeline: file sync now reacts instantly to state commits and filesystem watcher signals with per-path granularity.
- Retired the dual SQLite connection so project reads and writes flow straight into Lix state—`project.lix.db` is now the single source of truth.
- Exposed subscriptions and writer-key workflows documented in the [Lix guide](https://lix.dev/guide/writer-key), enabling echo suppression without extra plumbing.

## Example

```ts
import { loadProjectFromDirectory } from "@inlang/sdk";

const project = await loadProjectFromDirectory({
  fs,
  path: "/project.inlang",
});

// React instantly when a Lix v0.5 commit touches project files.
project.lix.hooks.onStateCommit(({ changes }) => {
  const external = changes.filter(
    (change) => change.writer_key !== "my-writer"
  );
  if (external.length > 0) {
    console.log("Fresh state detected – project is already in sync with disk");
  }
});
```
