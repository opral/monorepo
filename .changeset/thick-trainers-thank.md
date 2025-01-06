---
"@lix-js/sdk": patch
---

fix: sync process does not create new intervals after the database has been closed

this bug hindered node processes to exit https://github.com/opral/inlang-sdk/issues/155
