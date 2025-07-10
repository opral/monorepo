# Versions (Branching)

Versions allow you to manage divergent states of your data, similar to branching in Git. This is a powerful feature for building applications that need to support drafts, experiments, or different contexts for the same data.

![Versions](../../assets/versions.svg)

> [!NOTE]
> Lix uses the term "version" instead of "branch" because it's more intuitive for non-technical users. "Version" mirrors the familiar concept of duplicating a file and adding `v2` or `final` to the file name e.g. `something_v2.docx` or `something_final.docx`.

## Examples

```ts
const lix = await openLix({});
```

```ts
const activeVersion = await selectActiveVersion({ lix })
  .executeTakeFirstOrThrow();

const newVersion = await createVersion({ lix, from: activeVersion });

await switchVersion({ lix, to: newVersion });
```

```ts
await mergeVersion({ lix, source: activeVersion, target: newVersion });
```

## Interactive Examples

Explore these interactive examples to see version management in action:

<InteractiveExampleCard
  title="Versions Interactive Examples"
  description="Explore interactive examples showing how to create, manage, and merge versions (branches) of your data."
  link="/examples/interactive/versions/"
/>
```
