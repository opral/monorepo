---
"@lix-js/sdk": patch
---

refactor: rename `file_id` of own changes from `null` to `lix_own_change_control` to avoid debugging confusions https://github.com/opral/lix-sdk/issues/194

```diff
- file_id: null
+ file_id: lix_own_change_control
```
