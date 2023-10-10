---
"@inlang/create-project": major
---

BREAKING: `tryAutoGenerateSettings` returns either the project settings or undefined.

- simplifies the API
- avoids confusion about what the function does

improve: depend on @inlang/marketplace to get latest plugin links and correct ids 

improve: derives the correct language tags

improve: `tryAutoGenerateSettings` does not write to the filesystem anymore

test: check whether the project returns no errors 

refactor: remove dependency on node because this code runs in the browser

refactor: remove unused exports

