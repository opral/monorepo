---
"@lix-js/sdk": minor
---

refactor: `changeSetHasLabel()` now takes an object to perform a lookup by id or name.

```diff
await lix.db.selectFrom("change_set")
- 	.where(changeSetHasLabel("checkpoint"))
+ 	.where(changeSetHasLabel({ name: "checkpoint" }))
 		.selectAll()
 		.execute();
```
