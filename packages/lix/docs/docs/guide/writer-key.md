# Writer Key

A writer key is a lightweight identity attached to state mutations. It lets UIs and services distinguish “my own writes” from external changes to the same entities, enabling echo‑suppression and correct refresh behavior without polling.

- Stamped on INSERT/UPDATE/DELETE of materialized state rows.
- Propagated end‑to‑end through the transaction pipeline and emitted on `onStateCommit`.
- Nullable: `null` means “unspecified/unknown writer”. Treat `null` as external relative to any editor.

## Why it exists

Writer keys solve a general problem: any state that can be changed by multiple actors (tabs, services, background jobs, bots, imports, etc.) needs a way to react to external updates while avoiding feedback loops from its own writes. 

Rich text editors (e.g., TipTap) are a familiar example, but the same mechanism applies to dashboards, forms, document viewers, code generators, ETL pipelines, and more. Writer keys provide the minimal attribution needed to filter “my” changes while still seeing everyone else’s.

## Setting the writer key

Use the helper `withWriterKey(db, writer, fn)` to run a batch of mutations under a writer identity.

```ts
import { withWriterKey } from '@lix-js/sdk'

await withWriterKey(lix.db, 'flashtype_tiptap_<session_id>', async (trx) => {
  await trx
    .insertInto('state')
    .values({
      entity_id,
      file_id,
      version_id,
      schema_key,
      schema_version,
      plugin_key,
      snapshot_content: snapshot as any,
    })
    .execute()
})
```

## Listening for changes (recommended)

Subscribe to `onStateCommit` and filter by writer. This is event‑triggered (fires on each commit event) and avoids extra DB work.

```ts
const writer_key = 'flashtype_tiptap_<session_id>'
const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
  const externalToMe = changes.some(
    (c) => c.file_id === activeFileId && (c.writer_key == null || c.writer_key !== writer_key)
  )
  if (externalToMe) {
    // e.g. reparse the document and update the UI
  }
})
```


### Alternative change listening via queries

Sometimes you may want query‑triggered semantics (react when the current query result changes) instead of event‑triggered updates. Observed queries are useful when:

- You want a single, derived “latest” signal (e.g., last_updated per file) without handling event bursts.
- You’re in a process that doesn’t consume the hooks API (server tasks, CLIs) but can read the DB.
- You prefer a consistent query‑first data flow and Suspense integration.

Guidelines
- Don’t rely on `writer_key` alone for reactivity — identical projections dedupe and won’t emit.
- Select a monotonic metric that changes on every commit (e.g., `MAX(created_at)`, `MAX(change_id)`, `COUNT(*)`) scoped to your entity.
- Ensure relevant indexes exist for your filter columns (e.g., `file_id`, `version_id`, `plugin_key`).

```ts
// Example: drive reactivity off a changing metric (and still select writer_key if useful)
const rows = await lix.db
  .selectFrom('state_with_tombstones' as any)
  .where('file_id', '=', activeFileId)
  .where('plugin_key', '=', 'plugin_md')
  .where('version_id', '=', lix.db.selectFrom('active_version').select('version_id'))
  .select([ sql`MAX(created_at)`.as('last_updated'), sql`writer_key`.as('writer_key') ])
  .execute()
```

Pros
- Deterministic, value‑based re‑renders; integrates naturally with `useQuery`/Suspense.
- Works in readers that can’t or don’t subscribe to events.

Trade‑offs
- Extra DB work per emission; under the hood, observers still react to `onStateCommit` before re‑executing your SQL.
- Can miss changes if the selected projection doesn’t change (e.g., `writer_key` alone).

Recommendation
- Use `onStateCommit` with writer filtering for interactive UIs and echo suppression.
- Use query‑based listening when you need query‑triggered derived values or server‑side polling semantics.

## Performance considerations

- `onStateCommit` + in‑memory filter
  - No DB round‑trip per commit.
  - Scales with number of subscribers; each does a small array scan and can bail early.

- Query‑based watchers
  - Internally still triggered by `onStateCommit`, then re‑execute your SQL.
  - Extra cost: compile, execute, materialize results, equality check.
  - Multiply this by the number of watching components.

For editor echo suppression and external change detection, `onStateCommit` is both faster and less error‑prone.

## Best practices

- Use a per‑instance writer key (include a session/tab id) so different tabs don’t suppress each other.
- Always stamp editor‑originated writes with `withWriterKey` to avoid `null` (which is treated as external by everyone).
- Filter event changes by `file_id` and your plugin’s `plugin_key` to ignore meta rows.
- Optionally debounce/coalesce rapid sequences before reparsing.
- Track `lastAppliedCommitId` per file to skip redundant refreshes.
- Watch `active_version` and refresh on version switches.

## FAQ

- Do I need `writer_key` on state if I use `onStateCommit`?
  - Not strictly for UIs, but it’s valuable for tools, debugging, and consistency (events match persisted data).

- How do I treat `null`?
  - As external relative to any editor. Ensure your app’s writes set a non‑null writer.

- Can I detect external changes with `useQuery` only?
  - Yes, but select a changing metric (e.g., `MAX(created_at)`, `MAX(change_id)`, `COUNT(*)`) scoped to your file/version. Don’t rely on `writer_key` alone for reactivity.

## Example: TipTap editor

```ts
const writer_key = 'flashtype_tiptap_<session_id>'

// Subscribe to commit events and refresh on external changes
useEffect(() => {
  if (!activeFileId || !editor) return
  const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
    const external = changes.some(
      (c) => c.file_id === activeFileId && (c.writer_key == null || c.writer_key !== writer_key)
    )
    if (external) {
      assembleMdAst({ lix, fileId: activeFileId }).then((ast) => {
        editor.commands.setContent(astToTiptapDoc(ast))
      })
    }
  })
  return () => unsubscribe()
}, [lix, editor, activeFileId])

```
