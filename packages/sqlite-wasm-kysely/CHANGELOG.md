# sqlite-wasm-kysely

## 0.3.0

### Minor Changes

- b87f8a8: update sqlite dependency to 3.48.0-build2

## 0.2.0

### Minor Changes

- 31e8fb8: fix: multiple sqlite database instances interfering

  Closes https://github.com/opral/inlang-paraglide-js/issues/320

  Multiple sqlite database instances were interfering with each other upon closing one of them. The bug was mitigated by avoiding a globally set variable for the sqlite module.

## 0.1.1

### Patch Changes

- 7046bc3: We intercept SQLite's logging to mute OPFS warnings. Since we explicitly run SQLite in memory on the main thread, there is no need for OPFS.
