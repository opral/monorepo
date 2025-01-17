---
"sqlite-wasm-kysely": minor
---

fix: multiple sqlite database instances interfering

Closes https://github.com/opral/inlang-paraglide-js/issues/320

Multiple sqlite database instances were interfering with each other upon closing one of them. The bug was mitigated by avoiding a globally set variable for the sqlite module. 
