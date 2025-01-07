---
"@lix-js/sdk": minor
---

refactor: removes the `anonymous_` prefix from "anonymous accounts". 

Closes https://github.com/opral/lix-sdk/issues/233. 

There is no difference between an account prefixed with `anonymous` and one that is not. This change removes the prefix to avoid confusion. 