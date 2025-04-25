---
"@lix-js/sdk": patch
---

new testing utility `mockJsonPlugin`

- can be used intead of defining a mock plugin for each test
- do not rely on it for production code

```ts
test("abc", async () => {
  const lix = await openLixInMemory({
    providePlugins: [mockJsonPlugin],
  });

  // ...
});
```
