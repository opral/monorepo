---
"@lix-js/sdk": minor
---

add the option to open a lix with an existing account

```ts
const account = localStorage.getItem('account')
await openLix({ account })
```