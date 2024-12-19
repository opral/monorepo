---
"@lix-js/sdk": patch
---

refactor: explicit `firstComment` argument in `createDiscussion()` https://github.com/opral/lix-sdk/issues/164

It was unclear that the `content` argument in `createDiscussion()` was meant to be the first comment. This change makes it explicit by renaming the argument to `firstComment`.

```diff
- createDiscussion({ discussion, content: "first comment" })
+ createDiscussion({ discussion, firstComment: { content: "first commment" } }})
```
