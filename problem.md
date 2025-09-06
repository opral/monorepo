## Materializer returns stale global `lix_version` snapshot after merge (tip is correct)

This document captures the current failure we’re debugging: after performing a merge that updates a target version’s commit pointer to a new commit (e.g., `a4`), the state materializer exposes a stale global `lix_version` snapshot for that version (still pointing to an old commit, e.g., `10`). The version tips view reflects the new tip (`a4`), and the version view row also shows `a4`, but the materializer’s global `lix_version` row remains stale in a cache-miss repopulation. This causes the `version` view (which reads the global `lix_version` row) to re-materialize to the stale commit.

The goal is to identify why `internal_state_materializer` (and the pipeline feeding it) returns an outdated `lix_version` row under cache repopulation despite the commit graph and tip being correct.

---

## TL;DR

- We create a one-commit merge with parents `[target_tip, source_tip]` and update the target version’s pointer to that new commit.
- The materialized tip (`internal_materialization_version_tips`) shows the new commit id (e.g., `a4`).
- The `version` entity view row also shows the new commit id (we insert a `lix_version` change with the new `commit_id`).
- But `internal_state_materializer` emits a global `lix_version` row for that version entity that still has the old commit id (e.g., `10`) after cache repopulation in cache-miss simulation.
- So the global `version` row comes back stale under cache-miss, even though tips and target-scope rows look correct.

---

## Reproduction

Run the merge tests that print rich debug logs:

```
cd packages/lix-sdk
pnpm exec vitest run -t "applies explicit deletions: source tombstones delete target content"
```

We often see this pattern in logs under cache-miss simulation:

```
[MERGE DEBUG] rows.commit {
  id: '01920000-0000-7000-8000-0000000000a4',
  change_set_id: '01920000-0000-7000-8000-0000000000a3',
  parent_commit_ids: [
    '01920000-0000-7000-8000-00000000005b',
    '01920000-0000-7000-8000-000000000091'
  ]
}

[MERGE DEBUG] rows.version {
  id: 'test_0000000042',
  name: 'target',
  commit_id: '01920000-0000-7000-8000-0000000000a4',
  working_commit_id: '01920000-0000-7000-8000-00000000002e',
  inherits_from_version_id: 'global',
  ...
}

materialized_tip: '01920000-0000-7000-8000-0000000000a4'

materializer_version_rows: [
  {
    version_id: 'boot_0000000000',
    entity_id: 'test_0000000042',
    inherited_from_version_id: 'global',
    commit_id: '0192aaaa-0000-7000-8000-000000000010',  // STALE (should be a4)
    name: 'target'
  },
  {
    version_id: 'global',
    entity_id: 'test_0000000042',
    inherited_from_version_id: null,
    commit_id: '0192aaaa-0000-7000-8000-000000000010',  // STALE
    name: 'target'
  },
  {
    version_id: 'test_0000000001',
    entity_id: 'test_0000000042',
    inherited_from_version_id: 'global',
    commit_id: '0192aaaa-0000-7000-8000-000000000010',  // STALE
    name: 'target'
  },
  ...
]
```

Conclusion from logs: the tip commit and the target-scope version row point at `a4`, but the global `lix_version` row from the materializer is stuck on `10` after repop.

---

## Repo context

- Code under `packages/lix-sdk/src`.
- DB is SQLite (wasm) with a stack of views:
  - `internal_materialization_*` views implement graph traversal and snapshot selection.
  - `internal_state_materializer` selects the latest visible state with inheritance.
  - `version` entity view is global (hardcoded `version_id = 'global'`).
- There is a cache subsystem (`internal_state_cache_*`) and a simulation that forces cache misses by clearing cache before each select.

---

## Merge implementation (one-commit model)

File: `packages/lix-sdk/src/version/merge-version.ts`

Key shape:

```ts
export async function mergeVersion({ lix, source, target }: { ... }) {
  await lix.db.transaction().execute(async (trx) => {
    // 1) Compute diffs (created/updated/deleted) between source and target
    const diffs = await selectVersionDiff({ lix: { ...lix, db: trx }, source, target })
      .where('diff.status', 'in', ['created','updated','deleted'])
      .selectAll()
      .execute();

    // 2) Resolve parent tips (sourceVersion.commit_id, targetVersion.commit_id)
    const sourceVersion = await trx.selectFrom('version').selectAll().where('id','=',source.id).executeTakeFirstOrThrow();
    const targetVersion = await trx.selectFrom('version').selectAll().where('id','=',target.id).executeTakeFirstOrThrow();

    // 3) Build winners/deletions for commit membership
    const toReference = []; // winners (created/updated -> change_ids)
    const toDelete = [];    // explicit tombstones to create in target
    for (const d of diffs) {
      if ((d.status === 'created' || d.status === 'updated') && d.after_change_id) {
        toReference.push({ id: d.after_change_id, entity_id: d.entity_id, schema_key: d.schema_key, file_id: d.file_id });
      } else if (d.status === 'deleted') {
        // Pull plugin_key/schema_version from before_change_id
        const before = await trx.selectFrom('change').where('id','=',d.before_change_id).select(['plugin_key','schema_version']).executeTakeFirstOrThrow();
        toDelete.push({ entity_id: d.entity_id, schema_key: d.schema_key, file_id: d.file_id, plugin_key: before.plugin_key, schema_version: before.schema_version });
      }
    }

    // 4) Create global meta rows and target deletion rows in change table
    const targetChangeSetId = uuidV7({ lix });
    const targetCommitId    = uuidV7({ lix });
    const now = timestamp({ lix });

    // change_set (global)
    changeRows.push({ id: csChangeId, entity_id: targetChangeSetId, schema_key: 'lix_change_set', ...snapshot: { id: targetChangeSetId } });
    // commit (global) with parents [target.tip, source.tip]
    changeRows.push({ id: commitChangeId, entity_id: targetCommitId, schema_key: 'lix_commit', snapshot: { id: targetCommitId, change_set_id: targetChangeSetId, parent_commit_ids: [targetVersion.commit_id, sourceVersion.commit_id] } });
    // version (global) for target -> commit_id = targetCommitId
    changeRows.push({ id: verChangeId, entity_id: target.id, schema_key: 'lix_version', snapshot: { ...targetVersion, commit_id: targetCommitId } });

    // domain deletions (target scope) and explicit CSE changes (global) for winners + deletions
    for (const del of toDelete) changeRows.push({ id: delId, schema_key: del.schema_key, entity_id: del.entity_id, file_id: del.file_id, snapshot: null });
    for (const ref of toReference) cseChangeRows.push(cse(targetChangeSetId, ref.id, ref.entity_id, ref.schema_key, ref.file_id));
    for (const del of deletionChanges) cseChangeRows.push(cse(targetChangeSetId, del.id, del.entity_id, del.schema_key, del.file_id));

    // 5) Update the commit snapshot with change_ids (winners + deletions + local meta)
    //    This is the only source used by the materializer to derive commit membership
    const snap = JSON.parse(commitRow.snapshot_content as string);
    snap.change_ids = [ ...winners, ...deletions, verChangeId, csChangeId, commitChangeId ];
    commitRow.snapshot_content = JSON.stringify(snap);

    // 6) Insert all change rows (commit/version/change_set + deletions + CSEs)
    await trx.insertInto('change').values([...changeRows, ...deletionChanges, ...cseChangeRows]).execute();

    // 7) Update cache deterministically (global + target writes) and mark as fresh
    updateStateCache({ lix, changes: [
      // Global: commit, version, change_set
      { ...commitRow,  lixcol_version_id: 'global', lixcol_commit_id: targetCommitId },
      { ...versionRow, lixcol_version_id: 'global', lixcol_commit_id: targetCommitId },
      { ...csRow,      lixcol_version_id: 'global', lixcol_commit_id: targetCommitId },
      // Target domain writes (winners + deletions)
      ...targetDomainWrites,
      // Global CSEs (winners, deletions, and meta)
      ...globalCseWrites
    ]});
    markStateCacheAsFresh({ lix });

    // 8) Debug: compare version row, tips, materializer rows, and LV-state
    // (see logs below)
  });
}
```

Key invariants for this implementation:

- One-commit model. Parents ordered `[target_tip, source_tip]`.
- `commit.change_ids` includes: winners + deletions + local meta (commit/version/change_set) for deterministic membership.
- Explicit `lix_change_set_element` change rows are written for both winners and deletions (anchoring membership), plus global cache CSE projections.
- Cache writes are batched and `markStateCacheAsFresh()` is called.

---

## Debug logs collected after merge writes

From `merge-version.ts` we log pointer and materializer state right after writing cache:

```ts
const afterVersionRow = await trx.selectFrom('version').where('id','=',target.id).selectAll().executeTakeFirst();
const tipRows = (lix.sqlite.exec({
  sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`,
  bind: [target.id], rowMode: 'object', returnValue: 'resultRows'
}) as Array<{ version_id: string; tip_commit_id: string }>) ?? [];
const matVersionRows = (lix.sqlite.exec({
  sql: `SELECT version_id, entity_id, change_id, inherited_from_version_id,
               json_extract(snapshot_content,'$.commit_id') AS commit_id,
               json_extract(snapshot_content,'$.name') AS name
        FROM internal_state_materializer
        WHERE schema_key = 'lix_version' AND entity_id = ?
        ORDER BY version_id`,
  bind: [target.id], rowMode: 'object', returnValue: 'resultRows'
}) as Array<{ version_id: string; entity_id: string; commit_id: string | null }> ) ?? [];

// Also inspect pre-inheritance latest-visible-state and commit graph for these commits
const lvsRows = (lix.sqlite.exec({
  sql: `SELECT version_id, commit_id, depth, change_id
        FROM internal_materialization_latest_visible_state
        WHERE schema_key = 'lix_version' AND entity_id = ?
        ORDER BY version_id, depth ASC`,
  bind: [target.id], rowMode: 'object', returnValue: 'resultRows'
}) as Array<{ version_id: string; commit_id: string | null; depth: number; change_id: string }> ) ?? [];
```

Observed anomaly:

- `afterVersionRow.commit_id === a4` (new commit)
- `tipRows[0].tip_commit_id === a4` (tip is a4)
- `matVersionRows` contains a row for `version_id='global'` and inherited rows that all show `commit_id === 10` (stale)

---

## Materializer SQL (relevant views)

File: `packages/lix-sdk/src/state/materialize-state.ts`

1) Unified commit edges from commit snapshot (`parent_commit_ids`):

```sql
CREATE VIEW IF NOT EXISTS internal_materialization_all_commit_edges AS
WITH latest_commits AS (
  SELECT c.entity_id, c.snapshot_content,
         ROW_NUMBER() OVER (PARTITION BY c.entity_id ORDER BY c.created_at DESC, c.id DESC) AS rn
  FROM change c
  WHERE c.schema_key = 'lix_commit'
),
derived_edges AS (
  SELECT je.value AS parent_id, lc.entity_id AS child_id
  FROM latest_commits lc
  JOIN json_each(json_extract(lc.snapshot_content,'$.parent_commit_ids')) je
  WHERE lc.rn = 1
    AND json_type(json_extract(lc.snapshot_content,'$.parent_commit_ids')) = 'array'
)
SELECT DISTINCT parent_id, child_id FROM derived_edges;
```

2) Version tips per version (`lix_version` change history):

```sql
CREATE VIEW IF NOT EXISTS internal_materialization_version_tips AS
WITH
version_commits(version_id, commit_id) AS (
  SELECT v.entity_id, json_extract(v.snapshot_content,'$.commit_id')
  FROM change v
  WHERE v.schema_key = 'lix_version'
    AND json_extract(v.snapshot_content,'$.commit_id') IS NOT NULL
),
non_tips AS (
  SELECT DISTINCT vc.version_id, vc.commit_id
  FROM version_commits vc
  JOIN internal_materialization_all_commit_edges e ON e.parent_id = vc.commit_id
  JOIN version_commits vc_child ON vc_child.commit_id = e.child_id AND vc_child.version_id = vc.version_id
)
SELECT vc.version_id, vc.commit_id AS tip_commit_id
FROM version_commits vc
WHERE NOT EXISTS (
  SELECT 1
  FROM non_tips nt
  WHERE nt.version_id = vc.version_id AND nt.commit_id = vc.commit_id
);
```

3) Commit graph from tips, with depth (0 = tip, 1 = parent, …):

```sql
CREATE VIEW IF NOT EXISTS internal_materialization_commit_graph AS
WITH RECURSIVE commit_paths(commit_id, version_id, depth, path) AS (
  SELECT tip_commit_id, version_id, 0, ',' || tip_commit_id || ','
  FROM internal_materialization_version_tips
  UNION ALL
  SELECT e.parent_id, g.version_id, g.depth + 1, g.path || e.parent_id || ','
  FROM internal_materialization_all_commit_edges e
  JOIN commit_paths g ON e.child_id = g.commit_id
  WHERE e.parent_id IS NOT NULL
    AND INSTR(g.path, ',' || e.parent_id || ',') = 0
)
SELECT commit_id, version_id, MIN(depth) as depth
FROM commit_paths
GROUP BY commit_id, version_id;
```

4) Latest visible state (pre-inheritance). Important bits for lix_version projection:

```sql
CREATE VIEW IF NOT EXISTS internal_materialization_latest_visible_state AS
WITH commit_targets AS (
  SELECT cg.version_id, cg.commit_id, cg.depth, j.value AS target_change_id
  FROM internal_materialization_commit_graph cg
  JOIN change cmt ON cmt.entity_id = cg.commit_id AND cmt.schema_key = 'lix_commit'
  JOIN json_each(json_extract(cmt.snapshot_content,'$.change_ids')) j
),
-- Project non-version entities under their graph version_id
commit_changes AS (
  SELECT 
    ct.version_id AS version_id,
    ct.commit_id,
    ct.depth,
    c.id as change_id,
    c.entity_id,
    c.schema_key,
    c.file_id,
    c.plugin_key,
    c.snapshot_content,
    c.schema_version,
    c.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
      ORDER BY ct.depth ASC
    ) as first_seen,
    FIRST_VALUE(c.created_at) OVER (
      PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
      ORDER BY ct.depth DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as entity_created_at,
    FIRST_VALUE(c.created_at) OVER (
      PARTITION BY ct.version_id, c.entity_id, c.schema_key, c.file_id
      ORDER BY ct.depth ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as entity_updated_at
  FROM commit_targets ct
  JOIN change c ON c.id = ct.target_change_id
  WHERE c.schema_key != 'lix_version'
),
-- Project lix_version rows under GLOBAL using the VERSION'S OWN graph depth
commit_versions_global AS (
  SELECT
    'global' AS version_id,
    ct.commit_id,
    vg.depth AS depth,
    c.id as change_id,
    c.entity_id,
    'lix_version' AS schema_key,
    'lix' AS file_id,
    'lix_own_entity' AS plugin_key,
    c.snapshot_content,
    c.schema_version,
    c.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 'global', c.entity_id, 'lix_version', 'lix'
      ORDER BY vg.depth ASC
    ) as first_seen,
    FIRST_VALUE(c.created_at) OVER (
      PARTITION BY 'global', c.entity_id, 'lix_version', 'lix'
      ORDER BY vg.depth DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as entity_created_at,
    FIRST_VALUE(c.created_at) OVER (
      PARTITION BY 'global', c.entity_id, 'lix_version', 'lix'
      ORDER BY vg.depth ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as entity_updated_at
  FROM commit_targets ct
  JOIN change c ON c.id = ct.target_change_id AND c.schema_key = 'lix_version'
  JOIN internal_materialization_commit_graph vg
    ON vg.version_id = c.entity_id  -- version’s OWN graph
   AND vg.commit_id = ct.commit_id  -- same commit id
)
SELECT version_id, commit_id, depth, change_id, entity_id, schema_key, file_id,
       plugin_key, snapshot_content, schema_version,
       entity_created_at as created_at, entity_updated_at as updated_at
FROM commit_changes WHERE first_seen = 1
UNION ALL
SELECT version_id, commit_id, depth, change_id, entity_id, schema_key, file_id,
       plugin_key, snapshot_content, schema_version,
       entity_created_at as created_at, entity_updated_at as updated_at
FROM commit_versions_global WHERE first_seen = 1
UNION ALL
-- (Plus commit_cse, commit_edges unions omitted here for brevity)
;
```

5) Version ancestry + final materializer (inheritance resolution):

```sql
CREATE VIEW IF NOT EXISTS internal_materialization_version_ancestry AS
WITH RECURSIVE version_ancestry(version_id, ancestor_version_id, inheritance_depth, path) AS (
  SELECT entity_id, entity_id, 0, ',' || entity_id || ','
  FROM change WHERE schema_key = 'lix_version'
  UNION ALL
  SELECT va.version_id,
         json_extract(parent_v.snapshot_content,'$.inherits_from_version_id'),
         va.inheritance_depth + 1,
         va.path || json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') || ','
  FROM version_ancestry va
  JOIN change parent_v ON parent_v.entity_id = va.ancestor_version_id AND parent_v.schema_key = 'lix_version'
  WHERE json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') IS NOT NULL
    AND INSTR(va.path, ',' || json_extract(parent_v.snapshot_content,'$.inherits_from_version_id') || ',') = 0
)
SELECT version_id, ancestor_version_id, inheritance_depth FROM version_ancestry;

CREATE VIEW IF NOT EXISTS internal_state_materializer AS
WITH all_possible_states AS (
  SELECT va.version_id,
         s.entity_id, s.schema_key, s.file_id, s.plugin_key,
         s.snapshot_content, s.schema_version, s.created_at, s.updated_at,
         s.change_id, s.commit_id,
         va.ancestor_version_id, va.inheritance_depth,
         ROW_NUMBER() OVER (
           PARTITION BY va.version_id, s.entity_id, s.schema_key, s.file_id
           ORDER BY va.inheritance_depth ASC
         ) as inheritance_rank
  FROM internal_materialization_version_ancestry va
  JOIN internal_materialization_latest_visible_state s
    ON s.version_id = va.ancestor_version_id
)
SELECT entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content,
       schema_version, created_at, updated_at,
       CASE WHEN inheritance_depth > 0 THEN ancestor_version_id ELSE NULL END as inherited_from_version_id,
       0 as untracked, change_id, commit_id
FROM all_possible_states
WHERE inheritance_rank = 1;
```

---

## Why this looks wrong

We see a stale global `lix_version` row pointing to commit `10` even after:

- Creating a merge commit `a4` with parents `[target_tip, source_tip]`.
- Writing a `lix_version` change for the target version with `commit_id = a4`.
- Adding `a4` to `commit.change_ids` (so LV-state can derive membership deterministically).
- The version tips view emits `tip_commit_id = a4` for the target version.

Yet `internal_state_materializer` returns, under `version_id = 'global'`, a `lix_version` row for the target entity pointing to `10`. This row is what the global `version` view ultimately consumes, causing the re-materialized pointer to be stale under cache-miss.

Places where this can go wrong:

1) `internal_materialization_latest_visible_state` projection of `lix_version` under GLOBAL might be choosing an older change due to the window/ordering (depth) logic, or due to mixing graphs when deriving depths.
2) The `commit_targets` source is based on `commit.change_ids` of commits in the target version’s graph. That is by design, but the mapping of those change_ids back to `lix_version` rows must use the entity’s OWN graph depth to select the newest one globally. If that mapping fails or falls back, the first_seen calculation can incorrectly mark an older snapshot as the winner.
3) Under cache-miss repopulation, the materializer paths might include an older `lix_version` change for the same version entity from a different graph context, and due to the partition key / ordering, that older change “wins” in GLOBAL.

---

## Instrumentation we added (to help pinpoint)

In `merge-version.ts` we added logs of:

- `after_version_row` (from the `version` view)
- `materialized_tip` (from `internal_materialization_version_tips`)
- `materializer_version_rows` (from `internal_state_materializer` for `schema_key='lix_version'` and the target entity)
- `materializer_lvs_rows` (from `internal_materialization_latest_visible_state` for `schema_key='lix_version'` and the target entity)
- `commit_graph_rows` (rows in `internal_materialization_commit_graph` for the target’s version commits)
- `version_change_rows` (all `lix_version` change rows for the target entity)
- `cache_lix_version_rows` (if present)
- `cse_anchored_ids` (contents of the merge change set)

These should make it clear where the pointer diverges.

---

## Determinism test for pointer vs tip

We also added a small sim test to assert: tip equals the `lix_version` materializer commit_id (for the version entity under GLOBAL):

```ts
// packages/lix-sdk/src/state/materialize-state.test.ts
simulationTest("version tip matches lix_version snapshot commit_id", async ({ openSimulatedLix, expectDeterministic }) => {
  const lix = await openSimulatedLix({ keyValues: [{ key: 'lix_deterministic_mode', value: { enabled: true, bootstrap: true }, lixcol_version_id: 'global' }] });
  const { id: versionId } = await createVersion({ lix, name: "tip-vs-snapshot" });

  const tips = lix.sqlite.exec({ sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`, bind: [versionId], rowMode: 'object', returnValue: 'resultRows' }) as Array<{ version_id: string; tip_commit_id: string }>;
  expectDeterministic(tips.length).toBe(1);

  const matRows = lix.sqlite.exec({ sql: `SELECT json_extract(snapshot_content,'$.commit_id') AS commit_id FROM internal_state_materializer WHERE schema_key = 'lix_version' AND version_id = 'global' AND entity_id = ?`, bind: [versionId], rowMode: 'object', returnValue: 'resultRows' }) as Array<{ commit_id: string | null }>;
  expectDeterministic(matRows.length).toBe(1);

  expectDeterministic(matRows[0]!.commit_id).toBe(tips[0]!.tip_commit_id);
});
```

This captures the required invariant.

---

## What we need help with

Given the SQL above and the merge/change creation steps:

- Why would `internal_state_materializer` return a stale global `lix_version` row (commit `10`) for the target entity after a merge sets the pointer to `a4` and tips also see `a4`?
- Is the `internal_materialization_latest_visible_state` projection of `lix_version` to GLOBAL incorrectly mixing graphs or ordering by the wrong depth key?
- Are the `first_seen` partitions and ORDER BY depth (ASC) for `lix_version` rows correct when multiple commits for the same version entity exist across different version graphs?
- Is there a subtlety with `latest_commits` / edges (using “latest” change row per commit entity) that can cause mismatched edges under cache repop?

Constraints and assumptions:

- Keep the one-commit model; parents = `[target_tip, source_tip]`.
- Global entity: `version` is read under GLOBAL; `lix_version` changes for a version are global.
- `commit.change_ids` is the authoritative membership list; materializer must derive from it (not from implicit joins).
- Do not filter out `lix_*` meta changes (we rely on them for deterministic materialization).

What a correct fix would achieve:

- After cache clear (cache-miss), repopulation should produce a single global `lix_version` row for the target entity where `snapshot.commit_id` equals the tip for that version (i.e., the newest commit for that version entity). No stale global row should shadow the new one.

---

## Appendix: additional pointers

- `version` view is global by construction (see `applyVersionDatabaseSchema`, hardcoded `hardcodedVersionId: 'global'`).
- The cache-miss simulation clears caches before selects; ensure pointer comes from repopulated materializer, not stale cache.
- We anchor winners/deletions + meta in `lix_change_set_element` change rows (and also materialize corresponding cache rows) to ensure commit membership is consistent both as changes and cache.

Please reason about `internal_materialization_latest_visible_state`’s `commit_versions_global` and `commit_changes` partitions/orderings for `lix_version` rows, and how it selects the “first seen” change across multiple graphs. That seems the most likely culprit for the stale global row.

