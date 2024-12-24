---
"@lix-js/sdk": minor
---

Refactor: Use [nano-ids](https://zelark.github.io/nano-id-cc/) for change controlled tables like discussions, comments, and labels. 

- severely shortens the length of shareable URLs
- closes https://github.com/opral/lix-sdk/issues/189.

```diff
-http://localhost:3005/app/fm/?f=0193f041-21ce-7ffc-ba6e-d2d62b399383&d=0193f041-2457-7ffc-ba7e-494efc37b1b8&l=55a7bcc8-63d8-43b7-af0b-3916618fc258
+http://localhost:3005/app/fm/?f=tUYFRUe4lb&d=rrzumhqqTOwq&l=MftKxYHfDw2bSVr8Bs
```

**Additional information**

The pattern is still not human readable. I assume that we will introduce a human readable pattern in the future in addition to permalinks. This change is a incremental step towards better link sharing and good enough for now. 

**Performance implications**

Nano IDs are not sortable and theoretically make insertions slower. However, until we get lix'es that have billions of rows we need to get users first. Sharing is a key feature to get users. 