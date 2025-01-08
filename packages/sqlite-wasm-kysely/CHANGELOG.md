# sqlite-wasm-kysely

## 0.1.1

### Patch Changes

- 7046bc3: We intercept SQLite's logging to mute OPFS warnings. Since we explicitly run SQLite in memory on the main thread, there is no need for OPFS.
