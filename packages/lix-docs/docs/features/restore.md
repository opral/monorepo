# Restore

```ts
const lix = await openLix({});
```

```ts
const checkpoints = await selectCheckpoints({ lix }).executeTakeFirstOrThrow();
```

```ts
// Restore to the first ever existing checkpoint 
await restore({ lix, to: checkpoints.at(-1) });
```
