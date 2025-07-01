# Restore

![Restore](../../assets/restore.svg)

```ts
const lix = await openLix({});
```

```ts
const checkpoints = await selectCheckpoints({ lix }).executeTakeFirstOrThrow();
```

```ts
// Restore to the previous checkpoint 
await restore({ lix, to: checkpoints[0] });
```
