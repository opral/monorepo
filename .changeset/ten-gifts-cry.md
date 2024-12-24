---
"@lix-js/sdk": patch
---

fix: type mismatch of `file.data`

The type of `file.data` in `File` interface is changed from `ArrayBuffer` to `Uint8Array` to match the type of `Uint8Array` returned by SQLite and various file related APIs.

```diff
-file.data: ArrayBuffer
+file.data: Uint8Array
```