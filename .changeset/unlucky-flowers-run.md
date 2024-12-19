---
"@lix-js/sdk": patch
---

refactor: replace `#*` key syntax with `skip_change_control` column

closes https://github.com/opral/lix-sdk/issues/191

Enables matching of flags and avoids re-names of keys. This change replaces the `#*` key syntax with a `skip_change_control` column in the `flags` table.

```diff
key_value = {
-  key: "#mock_key",
+  key: "mock_key",
+  skip_change_control: true,
   value: "mock_value",
}
```
