---
"@lix-js/sdk": patch
---

Extract `toBlob()` from `lix.*` object https://github.com/opral/lix-sdk/issues/196

```diff
- await lix.toBlob()
+ await toBlob({ lix })
```
