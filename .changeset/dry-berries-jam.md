---
"sqlite-wasm-kysely": patch
---

We intercept SQLite's logging to mute OPFS warnings. Since we explicitly run SQLite in memory on the main thread, there is no need for OPFS.
