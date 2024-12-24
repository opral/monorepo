---
"lix-file-manager": patch
"@lix-js/plugin-csv": patch
"csv-app": patch
---

Refactor(fix): `file.data` from `ArrayBuffer` to `Uint8Array`

The lix SDK's file.data type changed from `ArrayBuffer` to `Uint8Array`. SQLite returned `UInt8Array`.