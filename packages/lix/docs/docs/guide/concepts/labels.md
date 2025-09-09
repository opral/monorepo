# Labels

Labels in Lix are flexible tags you can attach to any entity — change sets, files, versions, paragraphs, JSON properties, and more. This universal “attach to any entity” model is a core super power of Lix.

## What are Labels?

Labels are named tags you can attach to any entity in Lix. Each label has:

- an `id` (stable identifier)
- a `name` (human-readable tag, e.g. `important`, `urgent`, `checkpoint`)

You create labels once (by name), then attach/detach them to entities as needed.

## Why use labels?

- Categorize entities (e.g. `type:feature`, `priority:high`)
- Build workflows (`status:review`, `status:approved`)
- Filter queries and views by label

## Attach and detach labels on any entity

Prefer the high-level SDK helpers when working with labels. They work uniformly across all entity types.

```ts
import { openLix, createLabel, attachLabel, detachLabel } from "@lix-js/sdk";

const lix = await openLix({});

// Create or look up a label (labels are global)
const important = await createLabel({ lix, name: "important" });

// The target can be ANY entity. Provide its composite id:
const entity = {
  entity_id: "doc_123",
  schema_key: "markdown_paragraph",
  file_id: "README.md",
};

// Attach
await attachLabel({ lix, entity, label: { id: important.id } });

// Detach
await detachLabel({ lix, entity, label: { id: important.id } });
```

## Querying with labels

Use the `ebEntity().hasLabel(...)` helper to filter by labels.

```ts
import { ebEntity } from "@lix-js/sdk";

// Files labeled "important" (by label name)
const files = await lix.db
  .selectFrom("file")
  .where(ebEntity("file").hasLabel({ name: "important" }))
  .selectAll()
  .execute();

// Change sets labeled by a known label id
const urgent = await lix.db
  .selectFrom("label")
  .where("name", "=", "urgent")
  .selectAll()
  .executeTakeFirstOrThrow();

const changeSets = await lix.db
  .selectFrom("change_set")
  .where(ebEntity("change_set").hasLabel({ id: urgent.id }))
  .selectAll()
  .execute();
```

Advanced (SQL): Under the hood, labels live in `label`, and attachments in `entity_label`.

```ts
// All entities labeled "reviewed" (any schema)
const reviewedEntities = await lix.db
  .selectFrom("entity_label")
  .innerJoin("label", "label.id", "entity_label.label_id")
  .where("label.name", "=", "reviewed")
  .select(["entity_label.entity_id", "entity_label.schema_key", "entity_label.file_id"])
  .execute();
```

## Recommended naming

Labels have a single `name` field. Use a naming scheme that fits your workflow, for example:

- Simple tags: `urgent`, `bug`, `reviewed`, `draft`
- Namespaced tags: `status:approved`, `type:feature`, `priority:high`
- Milestones: `checkpoint`, `release:v1.2.0`

## Special label uses

### Checkpoint label

The `createCheckpoint()` helper converts the current working change set into a checkpoint and attaches the `checkpoint` label to the resulting checkpoint commit. This makes it easy to query and display checkpoints in history.

```ts
import { createCheckpoint } from "@lix-js/sdk";

// Create a checkpoint (adds the `checkpoint` label to the checkpoint commit)
await createCheckpoint({ lix });
```

## Example: Workflow with labels

```ts
import { createChangeSet, createLabel, attachLabel } from "@lix-js/sdk";

// Create a change set and attach labels
const feature = await createChangeSet({ lix });

const typeFeature = await createLabel({ lix, name: "type:feature" });
const statusInProgress = await createLabel({ lix, name: "status:in-progress" });

await attachLabel({
  lix,
  entity: { entity_id: feature.id, schema_key: "lix_change_set", file_id: "lix" },
  label: { id: typeFeature.id },
});

await attachLabel({
  lix,
  entity: { entity_id: feature.id, schema_key: "lix_change_set", file_id: "lix" },
  label: { id: statusInProgress.id },
});

// Later, update status
const statusReview = await createLabel({ lix, name: "status:review" });
await attachLabel({
  lix,
  entity: { entity_id: feature.id, schema_key: "lix_change_set", file_id: "lix" },
  label: { id: statusReview.id },
});
```

## API Reference quick-links

| Function / Type   | Purpose                             | Docs                          |
| ----------------- | ----------------------------------- | ----------------------------- |
| `attachLabel()`   | Attach a label to an entity         | /api/functions/attachLabel    |
| `detachLabel()`   | Detach a label from an entity       | /api/functions/detachLabel    |
| `createLabel()`   | Create a label                      | /api/functions/createLabel    |
| `ebEntity()`      | Query helper with `hasLabel(...)`   | /api/functions/ebEntity       |
