## Current Architecture

```
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│        entity         │ │   entity_by_version   │ │    entity_history     │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│        state          │ │   state_by_version    │ │     state_history     │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        lix_internal_state_vtable                            │
│                    (unified read/write virtual table)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ reads from (prioritized UNION)
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │ priority 1                 │ priority 2                 │ priority 3
        ▼                            ▼                            ▼
┌─────────────────┐    ┌───────────────────────┐    ┌─────────────────────────┐
│   Transaction   │    │      Untracked        │    │    Committed State      │
│     State       │    │        State          │    │    (cache tables)       │
│   (staging)     │    │       (local)         │    │                         │
│                 │    │                       │    │ lix_internal_state_     │
│ lix_internal_   │    │ lix_internal_state_   │    │ cache_v1_{schema_key}   │
│ transaction_    │    │ all_untracked         │    │                         │
│ state           │    │                       │    │ e.g. _lix_key_value     │
└────────┬────────┘    └───────────────────────┘    │      _lix_commit        │
         │                                          │      _lix_file          │
         │ on commit                                └────────────▲────────────┘
         │                                                       │
         ├───────────────────────────────────────────────────────┤
         │                                                       │
         │ if untracked=1                  if untracked=0        │ cached from
         ▼                                                       ▼
┌─────────────────┐                           ┌──────────────────────────────┐
│ lix_internal_   │                           │      lix_internal_change     │
│ state_all_      │                           │       (change history)       │
│ untracked       │                           └──────────────┬───────────────┘
└─────────────────┘                                          │
                                                             │ FK: snapshot_id
                                                             ▼
                                              ┌──────────────────────────────┐
                                              │      lix_internal_snapshot   │
                                              │    (content-addressed blobs) │
                                              └──────────────────────────────┘
```

## Proposed Architecture

### Changes

- cache tables store the derived state (changes are the source of truth)
- cache state is authoritative for constraints
  - untracked state does NOT participate in constraints
- drop transaction table - rely on SQLite transactions for isolation

```
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│        entity         │ │   entity_by_version   │ │    entity_history     │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│        state          │ │   state_by_version    │ │     state_history     │
└───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        lix_internal_state_vtable                            │
│                    (unified read/write virtual table)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ reads from (prioritized UNION)
                                     │
                  ┌──────────────────┴──────────────────┐
                  │ priority 1                          │ priority 2
                  ▼                                     ▼
    ┌───────────────────────┐             ┌─────────────────────────────┐
    │    Untracked State    │             │        Cache State          │
    │       (local)         │             │    (derived from changes)   │
    │                       │             │                             │
    │ lix_internal_state_   │             │ lix_internal_state_         │
    │ untracked             │             │ cache_v1_{schema_key}       │
    │                       │             │                             │
    └───────────────────────┘             │ e.g. _lix_key_value         │
                                          │      _lix_commit            │
                                          │      _lix_file              │
                                          └──────────────▲──────────────┘
                                                         │
                                                         │ built from
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │      lix_internal_change     │
                                          │       (change history)       │
                                          └──────────────┬───────────────┘
                                                         │
                                                         │ FK: snapshot_id
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │      lix_internal_snapshot   │
                                          │    (content-addressed blobs) │
                                          └──────────────────────────────┘
```

### Special View: file

The `file` view reads from both the state vtable and specialized file cache tables:

```
                         ┌───────────────────────┐
                         │         file          │
                         └───────────┬───────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  ▼                  ▼                  ▼
┌───────────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
│ lix_internal_file_    │ │ lix_internal_    │ │ lix_internal_file_    │
│ data_cache            │ │ state_vtable     │ │ lixcol_cache          │
│                       │ │                  │ │                       │
│ (cached file          │ │ (file metadata)  │ │ (change_id, commit_id │
│  blob data)           │ │                  │ │  writer_key, etc.)    │
├───────────────────────┤ └──────────────────┘ └───────────────────────┘
│ lix_internal_file_    │
│ path_cache            │
│                       │
│ (precomputed paths)   │
└───────────────────────┘
```

### Special View: version

The `version` view reads from state cache with special handling for inheritance:

```
                         ┌───────────────────────┐
                         │        version        │
                         └───────────┬───────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  │                                     │
                  ▼                                     ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ lix_internal_state_vtable       │   │ lix_internal_state_cache_v1_    │
│                                 │   │ lix_version_descriptor          │
│ (version descriptors,           │   │                                 │
│  lix_version_tip)               │   │ (indexed inheritance chain)     │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

---

# Foundation

## Milestone 1: Untracked State

Untracked state is local-only data that is not synced and does not participate in constraint validation. It lives in a single table separate from the per-schema cache tables.

### Design

- **Single table**: `lix_internal_state_untracked` stores all untracked rows regardless of schema
- **No constraints**: Untracked state does NOT participate in PK, FK, or UNIQUE checks
- **Read-time resolution**: Untracked rows take priority over cache rows at read time (priority 1 in UNION)

This design simplifies constraint enforcement since we only validate tracked (committed) state.

### Write Path

When INSERT/UPDATE specifies `untracked = 1`:

```sql
-- Input
INSERT INTO lix_internal_state_vtable (entity_id, schema_key, snapshot_content, untracked)
VALUES ('entity-1', 'lix_key_value', '{"key": "foo"}', 1)

-- Rewritten (no change record, no constraint checks)
INSERT INTO lix_internal_state_untracked (entity_id, schema_key, file_id, version_id, snapshot_content)
VALUES ('entity-1', 'lix_key_value', NULL, 'current-version', '{"key": "foo"}')
ON CONFLICT (entity_id, schema_key, file_id, version_id) DO UPDATE SET
  snapshot_content = excluded.snapshot_content;
```

### Read Path

SELECT queries include untracked state with highest priority:

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id, file_id, version_id
    ORDER BY priority
  ) AS rn
  FROM (
    -- Priority 1: Untracked (wins over cache)
    SELECT *, 1 AS priority FROM lix_internal_state_untracked
    WHERE schema_key = 'lix_key_value'

    UNION ALL

    -- Priority 2: Cache
    SELECT *, 2 AS priority FROM lix_internal_state_cache_v1_lix_key_value
  )
) WHERE rn = 1
```

### Delete Path

DELETE with `untracked = 1` removes from untracked table directly (no tombstone):

```sql
-- Input
DELETE FROM lix_internal_state_vtable
WHERE entity_id = 'entity-1' AND untracked = 1

-- Rewritten
DELETE FROM lix_internal_state_untracked
WHERE entity_id = 'entity-1'
```

### Tasks

1. Route writes with `untracked = 1` to `lix_internal_state_untracked`
2. Skip change record generation for untracked writes
3. Skip constraint validation for untracked writes
4. Include untracked table in SELECT UNION with priority 1
5. Handle untracked DELETE as direct removal (no tombstone)

## Milestone 2: Cache Tables

Per-schema cache tables store the cached state for committed data. Each registered schema gets its own cache table. Changes are the source of truth; cache tables are derived and can be rebuilt.

### Table Structure

```sql
CREATE TABLE lix_internal_state_cache_v1_{schema_key} (
  entity_id TEXT NOT NULL,
  schema_key TEXT NOT NULL,
  file_id TEXT,
  version_id TEXT NOT NULL,
  snapshot_content BLOB,
  change_id TEXT NOT NULL,
  is_tombstone INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_id, file_id, version_id)
);
```

### Schema Registration

When a schema is registered, the engine creates a corresponding cache table:

```rust
fn register_schema(schema: &Schema, host: &impl HostBindings) -> Result<()> {
    let table_name = format!("lix_internal_state_cache_v1_{}", schema.key);

    let create_sql = format!(r#"
        CREATE TABLE IF NOT EXISTS {} (
            entity_id TEXT NOT NULL,
            schema_key TEXT NOT NULL,
            file_id TEXT,
            version_id TEXT NOT NULL,
            snapshot_content BLOB,
            change_id TEXT NOT NULL,
            is_tombstone INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (entity_id, file_id, version_id)
        )
    "#, table_name);

    host.execute(&create_sql, &[])?;
    Ok(())
}
```

### Tasks

1. Define cache table schema with required columns
2. Implement `register_schema()` to create cache tables dynamically
3. Handle schema key sanitization for table names
4. Create indexes for common query patterns (version_id, file_id)

## Milestone 3: Rewriting `lix_internal_state_vtable` SELECT Queries

> **Note:** RFC 001 determined that no transaction table is needed anymore. The database's native transaction handling provides isolation.

Thus, we only target two tables:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        lix_internal_state_vtable                            │
│                         (incoming SELECT query)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ rewrite to prioritized UNION
                                     │
                  ┌──────────────────┴──────────────────┐
                  │ priority 1                          │ priority 2
                  ▼                                     ▼
    ┌───────────────────────┐             ┌─────────────────────────┐
    │ lix_internal_state_   │             │ lix_internal_state_     │
    │ all_untracked         │             │ cache_v1_{schema_key}   │
    └───────────────────────┘             └─────────────────────────┘
```

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM lix_internal_state_vtable
WHERE schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id, file_id, version_id
    ORDER BY priority
  ) AS rn
  FROM (
    -- Priority 1: Untracked state
    SELECT *, 1 AS priority
    FROM lix_internal_state_untracked
    WHERE schema_key = 'lix_key_value'

    UNION ALL

    -- Priority 2: Materialized state from schema-specific table
    SELECT *, 2 AS priority
    FROM lix_internal_state_cache_v1_lix_key_value
  )
) WHERE rn = 1
```

### Tasks

1. Parse incoming SELECT statements targeting `lix_internal_state_vtable`
2. Extract WHERE clause predicates (especially `schema_key`)
3. Determine target cache table from `schema_key` value
4. Generate UNION query with priority ordering
5. Push down WHERE predicates to each UNION branch for performance

## Milestone 4: Rewriting `lix_internal_state_vtable` INSERT Queries

INSERT operations to the vtable need to be rewritten to:

1. Insert the snapshot content into `lix_internal_snapshot`
2. Create a change record in `lix_internal_change`
3. Update the cache table for the schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        lix_internal_state_vtable                            │
│                            (incoming INSERT)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ rewrite to multi-table write
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌─────────────────┐    ┌───────────────────────┐    ┌─────────────────────────┐
│ lix_internal_   │    │ lix_internal_change   │    │ lix_internal_state_     │
│ snapshot        │    │                       │    │ cache_v1_{schema_key}   │
│                 │    │ (references snapshot) │    │                         │
│ (content blob)  │    │                       │    │ (cached state)          │
└─────────────────┘    └───────────────────────┘    └─────────────────────────┘
```

### Query Rewriting Example

**Input query:**

```sql
INSERT INTO lix_internal_state_vtable (entity_id, schema_key, file_id, version_id, snapshot_content, ...)
VALUES ('entity-1', 'lix_key_value', 'file-1', 'version-1', '{"key": "foo", "value": "bar"}', ...)
```

**Rewritten query:**

```sql
-- 1. Insert snapshot content (content-addressed)
INSERT INTO lix_internal_snapshot (id, content)
VALUES ('snapshot-uuid', '{"key": "foo", "value": "bar"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Create change record
INSERT INTO lix_internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
VALUES ('change-uuid', 'entity-1', 'lix_key_value', '1', 'file-1', 'plugin-1', 'snapshot-uuid', '2024-01-01T00:00:00Z');

-- 3. Update cache table
INSERT INTO lix_internal_state_cache_v1_lix_key_value (entity_id, schema_key, file_id, version_id, snapshot_content, change_id, ...)
VALUES ('entity-1', 'lix_key_value', 'file-1', 'version-1', '{"key": "foo", "value": "bar"}', 'change-uuid', ...)
ON CONFLICT (entity_id, file_id, version_id) DO UPDATE SET
  snapshot_content = excluded.snapshot_content,
  change_id = excluded.change_id,
  updated_at = excluded.updated_at;
```

### Tasks

1. Parse incoming INSERT statements targeting `lix_internal_state_vtable`
2. Extract row values from VALUES clause
3. Generate snapshot ID (content-addressed hash or UUID)
4. Build multi-statement SQL: snapshot insert → change insert → cache upsert

## Milestone 5: Rewriting `lix_internal_state_vtable` UPDATE Queries

UPDATE operations can be partial (only some columns specified). To create a change record, we need the full row. The rewritten SQL must use a RETURNING clause to get the complete row after the update.

### Query Rewriting Example

**Input query:**

```sql
UPDATE lix_internal_state_vtable
SET snapshot_content = '{"key": "foo", "value": "updated"}'
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- 1. Update cache table and return the full row
UPDATE lix_internal_state_cache_v1_lix_key_value
SET snapshot_content = '{"key": "foo", "value": "updated"}',
    updated_at = '2024-01-01T00:00:00Z'
WHERE entity_id = 'entity-1' AND version_id = 'version-1'
RETURNING *;

-- 2. With the returned full row, insert snapshot and change record
-- (engine processes RETURNING result to build these)
INSERT INTO lix_internal_snapshot (id, content) VALUES (...);
INSERT INTO lix_internal_change (...) VALUES (...);
```

### Why RETURNING is Required

- UPDATE may only specify `snapshot_content`, but change records need all columns
- The full row state after update is needed to create the snapshot
- RETURNING gives us the complete row without an extra SELECT

### Tasks

1. Parse incoming UPDATE statements targeting `lix_internal_state_vtable`
2. Rewrite to UPDATE on cache table with RETURNING clause
3. Process returned rows to build snapshot and change records
4. Handle partial updates (merge with existing row data)

## Milestone 6: Rewriting `lix_internal_state_vtable` DELETE Queries

DELETE operations are represented as tombstone records (`is_tombstone = 1`, `snapshot_content = NULL`).

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM lix_internal_state_vtable
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- 1. Insert tombstone snapshot (special 'no-content' id)
-- (references existing 'no-content' snapshot row)

-- 2. Create change record with tombstone
INSERT INTO lix_internal_change (id, entity_id, schema_key, schema_version, file_id, plugin_key, snapshot_id, created_at)
VALUES ('change-uuid', 'entity-1', 'lix_key_value', '1', 'file-1', 'plugin-1', 'no-content', '2024-01-01T00:00:00Z');

-- 3. Update cache table with tombstone
UPDATE lix_internal_state_cache_v1_lix_key_value
SET is_tombstone = 1,
    snapshot_content = NULL,
    change_id = 'change-uuid',
    updated_at = '2024-01-01T00:00:00Z'
WHERE entity_id = 'entity-1' AND version_id = 'version-1';
```

### Tasks

1. Parse incoming DELETE statements targeting `lix_internal_state_vtable`
2. Create tombstone change records (snapshot_id = 'no-content')
3. Update cache table with `is_tombstone = 1` and `snapshot_content = NULL`
4. Ensure tombstones are correctly handled in SELECT rewriting (filtered out by default)

---

# Processing

## Milestone 7: In-Memory Row Representation

Before rewriting queries, we need an in-memory representation of the rows being mutated. This enables validation, plugin callbacks, and correct SQL generation.

> **Note:** The row representation below is illustrative, not fixed. Flexibility is expected as implementation details emerge.

**Input query:**

```sql
INSERT INTO lix_internal_state_vtable (entity_id, schema_key, file_id, version_id, snapshot_content)
VALUES
  ('entity-1', 'lix_key_value', 'file-1', 'version-1', '{"key": "foo", "value": "bar"}'),
  ('entity-2', 'lix_key_value', 'file-1', 'version-1', '{"key": "baz", "value": "qux"}')
```

**In-memory representation:**

```rust
vec![
  Row {
    entity_id: "entity-1",
    schema_key: "lix_key_value",
    file_id: "file-1",
    version_id: "version-1",
    snapshot_content: json!({"key": "foo", "value": "bar"}),
  },
  Row {
    entity_id: "entity-2",
    schema_key: "lix_key_value",
    file_id: "file-1",
    version_id: "version-1",
    snapshot_content: json!({"key": "baz", "value": "qux"}),
  },
]
```

### Pipeline

```rust
// 1. Parse the incoming SQL
let ast = parse(sql)?;
if !is_mutation(&ast) {
    return Ok(sql); // Pass through
}

// 2. Extract target table and mutation type
let mutation = extract_mutation(&ast)?;

// 3. Resolve values (handle subqueries, defaults, etc.)
let resolved_rows = resolve_row_values(&mutation, &host)?;
```

### Tasks

1. Implement AST traversal to extract column names and values
2. Handle `INSERT ... VALUES` with multiple value tuples
3. Handle `INSERT ... SELECT` by executing subquery via host callback
4. Apply default values for missing columns
5. Generate required values (id, created_at, etc.)

## Milestone 8: Generate Commit and Cached State

After extracting in-memory rows, we need to generate commit records and cached state for the cache tables.

See the current JS implementation: [generate-commit.ts](https://github.com/opral/monorepo/blob/2413bafee26554208ec674e2a52306fcf4b77bc4/packages/lix/sdk/src/state/vtable/generate-commit.ts)

### Pipeline (continued from Milestone 5)

```rust
// ... continued from Milestone 5

// 6. Generate commit and cached state
let commit_result = generate_commit(GenerateCommitArgs {
    timestamp: now(),
    changes: resolved_rows,
    versions: get_affected_versions(&resolved_rows, &host)?,
    generate_uuid: || uuid_v7(),
    active_accounts: get_active_accounts(&host)?,
});

// commit_result.changes = domain changes + meta changes (commit, version_tip, etc.)
// commit_result.cached_state = rows ready for cache insertion

// 7. Build final SQL
let sql = build_insert_sql(
    &commit_result.changes,          // -> lix_internal_change + lix_internal_snapshot
    &commit_result.cached_state       // -> lix_internal_state_cache_v1_*
);

host.execute(&sql)?;
```

### Tasks

1. Port `generateCommit()` logic to Rust
2. Generate commit snapshot with `change_ids`, `parent_commit_ids`
3. Generate `lix_version_tip` updates per version
4. Generate `lix_change_set_element` rows for domain changes
5. Return both raw changes and cached state for cache insertion

## Milestone 9: State Materialization

The materialization logic computes the correct state from the commit graph and change history. This is critical for ensuring reads return the correct data based on version inheritance and commit ancestry.

See the current JS implementation: [materialize-state.ts](https://github.com/opral/monorepo/blob/2413bafee26554208ec674e2a52306fcf4b77bc4/packages/lix/sdk/src/state/materialize-state.ts)

### Materialization Views

The JS implementation creates a chain of SQL views:

```
lix_internal_materialization_all_commit_edges
    │
    ▼
lix_internal_materialization_version_tips
    │
    ▼
lix_internal_materialization_commit_graph
    │
    ▼
lix_internal_materialization_latest_visible_state
    │
    ├─────────────────────────────────┐
    ▼                                 ▼
lix_internal_materialization_     lix_internal_state_materializer
version_ancestry                      (final output)
```

| View                   | Purpose                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `all_commit_edges`     | Union of edges from commit.parent_commit_ids and lix_commit_edge rows                                |
| `version_tips`         | Current tip commit per version                                                                       |
| `commit_graph`         | Recursive DAG traversal with depth from tips                                                         |
| `latest_visible_state` | Explodes commit.change_ids, joins with change table, deduplicates by (version, entity, schema, file) |
| `version_ancestry`     | Recursive inheritance chain per version                                                              |
| `state_materializer`   | Final state with inheritance resolution                                                              |

### Correctness Assurance

After Milestone 5, we should have tests that verify:

1. State reads match the JS implementation for the same change history
2. Version inheritance correctly resolves parent → child state visibility
3. Tombstones (deletions) are correctly handled
4. Commit graph traversal handles merge commits (multiple parents)
5. Cache tables are populated correctly from cached state

## Milestone 10: Deterministic Mode and Simulation Testing

To ensure correctness, we need deterministic execution and simulation testing that verifies the engine produces identical results under different conditions.

See the current JS implementation: [simulation-test.ts](https://github.com/opral/monorepo/blob/2413bafee26554208ec674e2a52306fcf4b77bc4/packages/lix/sdk/src/test-utilities/simulation-test/simulation-test.ts)

### Deterministic Mode

The engine should support deterministic mode where:

- UUIDs are generated from a seeded sequence
- Timestamps are controlled/fixed
- Results are reproducible given the same inputs

The engine queries `lix_deterministic_mode` from the key-value store on initialization and caches it in memory:

```rust
// Engine internally checks on init:
// SELECT * FROM lix_internal_state_vtable WHERE schema_key = 'lix_key_value' AND entity_id = 'lix_deterministic_mode'

struct Engine {
    deterministic_mode: Option<DeterministicConfig>,
    // ...
}

impl Engine {
    fn generate_uuid(&self) -> String {
        match &self.deterministic_mode {
            Some(config) => config.next_uuid(), // seeded sequence
            None => uuid_v7(),                   // real UUID
        }
    }

    fn now(&self) -> String {
        match &self.deterministic_mode {
            Some(config) => config.fixed_timestamp.clone(),
            None => Utc::now().to_rfc3339(),
        }
    }
}
```

### Simulation Tests

Simulation tests run the same test under different conditions to verify determinism:

| Simulation        | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `normal`          | Standard execution with cache                                            |
| `materialization` | Clears cache before every SELECT, forces re-materialization from changes |

### expectDeterministic()

The key testing primitive is `expectDeterministic()` which verifies values are identical across all simulations:

```rust
// This value must be identical in normal and materialization simulations
expect_deterministic(state_query_result);

// If values differ between simulations, the test fails with:
// "SIMULATION DETERMINISM VIOLATION: Values differ between simulations"
```

### Why This Matters

If materialization simulation produces different results than normal:

- The materialization logic has a bug
- Cache and source-of-truth (changes) are inconsistent

### Tasks

1. Implement deterministic UUID generation (seeded)
2. Implement fixed timestamp mode
3. Port simulation test framework to Rust
4. Implement materialization simulation (clear cache, repopulate from materializer)
5. Add `expectDeterministic` assertion helper

## Milestone 11: Engine Functions

The engine provides built-in functions that can be called from CEL expressions and SQL. These functions must respect deterministic mode.

### Function Registry

| Function                              | Purpose                      | Deterministic Behavior |
| ------------------------------------- | ---------------------------- | ---------------------- |
| `lix_uuid_v7()`                       | UUID v7 generation           | Seeded sequence        |
| `lix_nano_id(length?)`                | Short IDs (default 21 chars) | Seeded sequence        |
| `lix_human_id()`                      | Human-readable IDs           | Seeded sequence        |
| `lix_timestamp()`                     | Current timestamp            | Fixed timestamp        |
| `lix_random()`                        | Random float 0-1             | Seeded RNG             |
| `lix_next_sequence_number(namespace)` | Auto-incrementing sequence   | Deterministic counter  |

### Implementation

```rust
pub struct FunctionRegistry {
    deterministic_mode: Option<DeterministicConfig>,
    sequence_counters: HashMap<String, u64>,
}

impl FunctionRegistry {
    pub fn lix_uuid_v7(&mut self) -> String {
        match &mut self.deterministic_mode {
            Some(config) => config.next_uuid(),
            None => uuid::Uuid::now_v7().to_string(),
        }
    }

    pub fn lix_nano_id(&mut self, length: Option<usize>) -> String {
        let len = length.unwrap_or(21);
        match &mut self.deterministic_mode {
            Some(config) => config.next_nano_id(len),
            None => nanoid::nanoid!(len),
        }
    }

    pub fn lix_human_id(&mut self) -> String {
        // Format: adjective-noun-number (e.g., "happy-tiger-42")
        match &mut self.deterministic_mode {
            Some(config) => config.next_human_id(),
            None => generate_human_id(),
        }
    }

    pub fn lix_timestamp(&self) -> String {
        match &self.deterministic_mode {
            Some(config) => config.fixed_timestamp.clone(),
            None => chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn lix_random(&mut self) -> f64 {
        match &mut self.deterministic_mode {
            Some(config) => config.rng.gen(),
            None => rand::random(),
        }
    }

    pub fn lix_next_sequence_number(&mut self, namespace: &str) -> u64 {
        let counter = self.sequence_counters.entry(namespace.to_string()).or_insert(0);
        *counter += 1;
        *counter
    }
}
```

### SQL Function Registration

Functions are registered with SQLite so they can be called directly in SQL:

```sql
-- Can be used in INSERT statements
INSERT INTO state (entity_id, schema_key, snapshot_content)
VALUES (lix_uuid_v7(), 'my_schema', '{"seq": ' || lix_next_sequence_number('my_seq') || '}')
```

### Tasks

1. Implement `FunctionRegistry` with all built-in functions
2. Wire functions to deterministic mode (seeded values when enabled)
3. Register functions with SQLite connection
4. Expose functions to CEL evaluation context
5. Implement sequence number persistence (survives engine restart)
6. Add `lix_human_id` word lists (adjectives, nouns)

## Milestone 12: CEL Default Values

Schemas can define default values using CEL (Common Expression Language) expressions. When a row is inserted without a value for a field that has a CEL default, the engine must evaluate the expression.

See RFC 002 for the Rust library: [`cel-rust`](https://github.com/clarkmcc/cel-rust)

### Example Schema

```json
{
	"x-lix-key": "lix_message",
	"properties": {
		"id": {
			"type": "string",
			"x-lix-default": "lix_uuid_v7()"
		},
		"created_at": {
			"type": "string",
			"x-lix-default": "lix_get_timestamp()"
		}
	}
}
```

### Pipeline (continued)

```rust
// ... after resolving row values (Milestone 5)

// 4. Apply CEL default values
for row in &mut resolved_rows {
    let schema = get_schema(&row.schema_key)?;

    for (field, field_schema) in schema.properties {
        if row.snapshot_content.get(&field).is_none() {
            if let Some(cel_default) = field_schema.x_lix_default {
                let value = evaluate_cel(cel_default, &cel_context)?;
                row.snapshot_content.insert(field, value);
            }
        }
    }
}

// CEL context provides built-in functions:
// - lix_uuid_v7() -> deterministic or real UUID based on mode
// - lix_get_timestamp() -> deterministic or real timestamp based on mode
```

### Tasks

1. Integrate `cel-rust` library
2. Define CEL context with built-in functions (`lix_uuid_v7`, `lix_get_timestamp`)
3. Wire CEL functions to deterministic mode (use seeded values when enabled)
4. Parse `x-lix-default` from schema definitions
5. Evaluate CEL expressions for missing fields before validation

## Milestone 13: JSON Schema Validation

After applying CEL default values, the engine must validate `snapshot_content` against the JSON Schema defined for the `schema_key`. Validation happens in-memory before any SQL is executed.

See RFC 002 for the Rust library: [`jsonschema`](https://github.com/Stranger6667/jsonschema-rs)

### Pipeline (continued)

```rust
// ... after applying CEL defaults (Milestone 9)

// 5. Validate against JSON Schema
for row in &resolved_rows {
    let schema = get_schema(&row.schema_key)?;

    let compiled = JSONSchema::compile(&schema)?;

    if let Err(errors) = compiled.validate(&row.snapshot_content) {
        return Err(ValidationError {
            entity_id: row.entity_id,
            schema_key: row.schema_key,
            errors: errors.collect(),
        });
    }
}

// Continue to Milestone 6: Generate commit...
```

### Schema Storage

Schemas are stored in `lix_internal_state_vtable` with `schema_key = 'lix_schema'`:

```sql
SELECT snapshot_content
FROM lix_internal_state_vtable
WHERE schema_key = 'lix_schema'
  AND entity_id = 'lix_key_value'  -- the schema_key to validate against
```

The engine should cache compiled schemas in memory for performance.

### Tasks

1. Integrate `jsonschema` crate
2. Load and cache schemas from state on engine init
3. Compile JSON Schemas once and reuse
4. Validate `snapshot_content` before commit generation
5. Return clear error messages with path to invalid field

## Milestone 14: Constraint Validation via Query Rewriting

After JSON Schema validation, enforce relational constraints by rewriting INSERT/UPDATE queries to include constraint checks. This keeps the engine in control and avoids coupling to SQLite-specific constraint mechanisms.

### Constraint Types

| Extension           | Enforcement                                                           |
| ------------------- | --------------------------------------------------------------------- |
| `x-lix-primary-key` | Check uniqueness of key fields within version scope before INSERT     |
| `x-lix-unique`      | Check uniqueness of field combination within version scope            |
| `x-lix-foreign-key` | Check referenced row exists in target schema's cache table            |

### Rewriting Strategy

The engine rewrites mutations to include constraint validation as part of the same SQL statement. If validation fails, the entire statement aborts.

**Primary Key / Unique Check:**

```sql
-- Original
INSERT INTO state (entity_id, schema_key, snapshot_content)
VALUES ('msg-1', 'lix_message', '{"id": "msg-1", "thread_id": "t-1"}')

-- Rewritten: Check PK uniqueness BEFORE insert
SELECT CASE WHEN EXISTS (
  SELECT 1 FROM lix_internal_state_cache_v1_lix_message
  WHERE version_id = 'version-1'
    AND snapshot_content->>'id' = 'msg-1'
    AND is_tombstone = 0
) THEN RAISE(ABORT, 'Primary key constraint violated: lix_message.id') END;

-- Then insert
INSERT INTO lix_internal_state_cache_v1_lix_message (entity_id, version_id, snapshot_content, ...)
VALUES ('msg-1', 'version-1', '{"id": "msg-1", "thread_id": "t-1"}', ...);
```

**Foreign Key Check:**

```sql
-- Rewritten: Check FK exists BEFORE insert
SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM lix_internal_state_cache_v1_lix_thread
  WHERE version_id = 'version-1'
    AND snapshot_content->>'id' = 't-1'  -- referenced thread_id
    AND is_tombstone = 0
) THEN RAISE(ABORT, 'Foreign key constraint violated: lix_message.thread_id -> lix_thread.id') END;

-- Then insert
INSERT INTO lix_internal_state_cache_v1_lix_message (...)
VALUES (...);
```

### Benefits

1. **Database agnostic** - No reliance on SQLite-specific features (generated columns, native FK)
2. **Flexible error messages** - Engine controls the error text
3. **Version-scoped** - Constraints naturally scoped to version_id
4. **Tombstone-aware** - Easily exclude tombstones from constraint checks
5. **Future-proof** - Can add constraint modes (deferred, cascading) without schema changes

### Notes

- Constraints only apply to cached (committed) state, not untracked state
- The engine parses `x-lix-*` extensions from JSON Schema at schema registration time
- Constraint checks are part of the rewritten SQL, not separate preflight queries
- For bulk inserts, batch the constraint checks efficiently

### Tasks

1. Parse `x-lix-primary-key`, `x-lix-foreign-key`, `x-lix-unique` from schemas
2. Store parsed constraints in engine's schema registry
3. Generate constraint check SQL (WHERE NOT EXISTS / WHERE EXISTS) during query rewriting
4. Include RAISE statements for clear error messages on violation
5. Handle UPDATE constraints (check new values don't violate uniqueness)
6. Handle DELETE constraints (check no FK references exist, or cascade)

## Milestone 15: Writer Key

A writer key is a lightweight identity attached to state mutations. It lets UIs and services distinguish "my own writes" from external changes, enabling echo-suppression without polling.

### Design

- `writer_key` is an **optional column** on INSERT/UPDATE statements
- If provided, it's stored with the change record
- If not provided, defaults to `NULL` (treated as "external/unknown")
- Propagated through the transaction pipeline and emitted on `onStateCommit`

### SQL Interface

```sql
-- With writer key (editor knows its own writes)
INSERT INTO state (entity_id, schema_key, snapshot_content, writer_key)
VALUES ('entity-1', 'lix_message', '{"text": "hello"}', 'tiptap_session_abc123')

-- Without writer key (defaults to NULL)
INSERT INTO state (entity_id, schema_key, snapshot_content)
VALUES ('entity-1', 'lix_message', '{"text": "hello"}')
```

### Writer Key Storage

The writer key is stored in a separate table, keyed by the state row's composite key:

```sql
CREATE TABLE lix_internal_state_writer (
  file_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  schema_key TEXT NOT NULL,
  writer_key TEXT NOT NULL,  -- NOT nullable - row deleted if no writer
  PRIMARY KEY (file_id, version_id, entity_id, schema_key)
);
```

**Key behavior:** If no writer key is provided, the row is **deleted** from this table (not stored with NULL). This keeps the table sparse and efficient.

### Rewriting Example

**With writer key:**

```sql
-- Input
INSERT INTO state (entity_id, schema_key, snapshot_content, writer_key)
VALUES ('entity-1', 'lix_message', '{"text": "hello"}', 'tiptap_session_abc')

-- Rewritten (writer key provided)
-- 1. Insert snapshot, change, cached state (as before)
...

-- 2. UPSERT writer key
INSERT INTO lix_internal_state_writer (file_id, version_id, entity_id, schema_key, writer_key)
VALUES (NULL, 'version-1', 'entity-1', 'lix_message', 'tiptap_session_abc')
ON CONFLICT (file_id, version_id, entity_id, schema_key) DO UPDATE SET
  writer_key = excluded.writer_key;
```

**Without writer key (or NULL):**

```sql
-- Input
INSERT INTO state (entity_id, schema_key, snapshot_content)
VALUES ('entity-1', 'lix_message', '{"text": "hello"}')

-- Rewritten (no writer key)
-- 1. Insert snapshot, change, cached state (as before)
...

-- 2. DELETE any existing writer key row
DELETE FROM lix_internal_state_writer
WHERE file_id IS NULL
  AND version_id = 'version-1'
  AND entity_id = 'entity-1'
  AND schema_key = 'lix_message';
```

### Tasks

1. Create `lix_internal_state_writer` table (writer_key NOT NULL)
2. Extract `writer_key` from INSERT/UPDATE statements during parsing
3. If writer_key provided: UPSERT into writer table
4. If writer_key not provided or NULL: DELETE from writer table
5. Include `writer_key` in `onStateCommit` events by LEFT JOIN with writer table

## Milestone 16: onStateCommit Hook

After state changes are committed (written to cache tables + change records created), the engine must notify listeners. This enables reactive UI updates and downstream processing.

### Hook Interface

```rust
pub struct StateCommitChange {
    pub id: String,                    // change_id
    pub entity_id: String,
    pub schema_key: String,
    pub file_id: Option<String>,
    pub version_id: String,
    pub snapshot_content: Option<Value>, // null for deletions
    pub commit_id: String,
    pub untracked: bool,
    pub writer_key: Option<String>,    // for echo suppression
}

pub trait HostBindings {
    // ... existing methods ...

    /// Called after state changes are committed
    fn on_state_commit(&self, changes: &[StateCommitChange]) -> Result<()>;
}
```

### Engine Integration

```rust
pub fn execute(sql: &str, params: &[Value], host: &impl HostBindings) -> Result<Vec<Row>> {
    // ... mutation processing ...

    // After successful commit to cache tables
    if !committed_changes.is_empty() {
        host.on_state_commit(&committed_changes)?;
    }

    // ...
}
```

### Echo Suppression

The `writer_key` field allows listeners to filter out their own writes:

```typescript
// SDK side
lix.hooks.onStateCommit(({ changes }) => {
    const relevantChanges = changes.filter(c => c.writer_key !== myWriterKey);
    if (relevantChanges.length > 0) {
        // Handle changes from other writers
    }
});
```

### Tasks

1. Define `StateCommitChange` struct with all required fields
2. Add `on_state_commit` to `HostBindings` trait
3. Collect committed changes during mutation processing
4. Call `host.on_state_commit()` after successful commit
5. Include `writer_key` for echo suppression support

## Milestone 17: Observe API

The observe API enables reactive queries that automatically re-execute when relevant state changes. Built on top of the `onStateCommit` hook.

### API Design

```rust
/// Observe query results, re-executing when relevant state changes
pub fn observe(
    sql: &str,
    params: &[Value],
    callback: impl Fn(Vec<Row>) + 'static,
    host: &impl HostBindings
) -> Subscription;

pub struct Subscription {
    id: String,
}

impl Subscription {
    pub fn unsubscribe(self);
}
```

### Internal Schema Key Extraction

The engine parses the SQL to extract which `schema_key` values are being queried, so it can filter `onStateCommit` events internally:

```rust
fn extract_schema_keys(sql: &str) -> Vec<String> {
    // Parse SQL and extract schema_key values from WHERE clauses
    // e.g., "SELECT * FROM state WHERE schema_key = 'lix_message'"
    // returns ["lix_message"]
}

struct ObserveSubscription {
    id: String,
    sql: String,
    params: Vec<Value>,
    schema_keys: Vec<String>,  // extracted once at registration
    callback: Box<dyn Fn(Vec<Row>)>,
}
```

The engine maintains subscriptions internally and only invokes callbacks when `onStateCommit` includes changes matching the subscription's schema keys.

### SDK Usage

```typescript
const unsubscribe = lix.observe(
    "SELECT * FROM state WHERE schema_key = 'lix_message'",
    [],
    (rows) => {
        console.log("Messages updated:", rows);
    }
);

// Later...
unsubscribe();
```

### Tasks

1. Implement `extract_schema_keys()` to parse schema keys from SQL
2. Track active subscriptions in engine state (`ObserveSubscription`)
3. Filter `onStateCommit` events by relevant schema keys
4. Re-execute queries and invoke callbacks on relevant changes
5. Handle subscription cleanup on unsubscribe

---

# Versions

## Milestone 18: Active Version

The active version determines which version context is used for state operations. It is stored in the untracked table since it's local-only state that shouldn't be synced.

### Storage

```sql
-- Active version is stored as untracked state
INSERT INTO lix_internal_state_untracked (entity_id, schema_key, file_id, version_id, snapshot_content)
VALUES ('lix_active_version', 'lix_key_value', NULL, NULL, '{"value": "version-1"}')
```

### Read Path

```sql
-- Engine reads active version on init and caches it
SELECT json_extract(snapshot_content, '$.value') AS active_version
FROM lix_internal_state_untracked
WHERE entity_id = 'lix_active_version' AND schema_key = 'lix_key_value'
```

### Write Path

```sql
-- Switching active version
UPDATE lix_internal_state_untracked
SET snapshot_content = '{"value": "version-2"}'
WHERE entity_id = 'lix_active_version' AND schema_key = 'lix_key_value'
```

### Tasks

1. Store active version in untracked table on lix open
2. Cache active version in engine memory
3. Provide API to switch active version
4. Update cached value when active version changes

## Milestone 19: Version View (version_descriptor + version_tip)

The `version` view combines `lix_version_descriptor` and `lix_version_tip` to provide a unified view of versions with their current tip commits.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM version
WHERE id = 'version-1'
```

**Rewritten query:**

```sql
SELECT
  json_extract(vd.snapshot_content, '$.id') AS id,
  json_extract(vd.snapshot_content, '$.name') AS name,
  json_extract(vd.snapshot_content, '$.parent_version_id') AS parent_version_id,
  json_extract(vt.snapshot_content, '$.commit_id') AS tip_commit_id
FROM (
  -- version_descriptor from cache table
  SELECT * FROM lix_internal_state_cache_v1_lix_version_descriptor
  WHERE is_tombstone = 0
) vd
LEFT JOIN (
  -- version_tip from cache table
  SELECT * FROM lix_internal_state_cache_v1_lix_version_tip
  WHERE is_tombstone = 0
) vt ON json_extract(vd.snapshot_content, '$.id') = json_extract(vt.snapshot_content, '$.version_id')
WHERE json_extract(vd.snapshot_content, '$.id') = 'version-1'
```

### Tasks

1. Parse SELECT statements targeting `version` view
2. Rewrite to JOIN version_descriptor and version_tip cache tables
3. Project relevant fields from snapshot_content
4. Handle INSERT/UPDATE/DELETE by routing to appropriate underlying schema

## Milestone 20: Version Inheritance in SELECT Rewriting

State queries must respect version inheritance. When querying state for a version, if an entity doesn't exist in that version, the query should fall back to parent versions.

### Inheritance Chain

```
version-child (active)
    └── version-parent
            └── version-grandparent
```

When querying `state` for `version-child`, if an entity exists in `version-parent` but not `version-child`, it should be visible.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM state
WHERE schema_key = 'lix_key_value'
```

**Rewritten query (with inheritance):**

```sql
WITH RECURSIVE version_chain AS (
  -- Start with active version
  SELECT
    json_extract(snapshot_content, '$.id') AS version_id,
    json_extract(snapshot_content, '$.parent_version_id') AS parent_version_id,
    0 AS depth
  FROM lix_internal_state_cache_v1_lix_version_descriptor
  WHERE json_extract(snapshot_content, '$.id') = 'version-child'

  UNION ALL

  -- Walk up inheritance chain
  SELECT
    json_extract(vd.snapshot_content, '$.id'),
    json_extract(vd.snapshot_content, '$.parent_version_id'),
    vc.depth + 1
  FROM lix_internal_state_cache_v1_lix_version_descriptor vd
  JOIN version_chain vc ON json_extract(vd.snapshot_content, '$.id') = vc.parent_version_id
)
SELECT * FROM (
  SELECT s.*, vc.depth, ROW_NUMBER() OVER (
    PARTITION BY s.entity_id, s.file_id
    ORDER BY vc.depth ASC  -- Prefer closer versions
  ) AS rn
  FROM (
    -- Untracked + cached union
    SELECT *, 1 AS priority FROM lix_internal_state_untracked WHERE schema_key = 'lix_key_value'
    UNION ALL
    SELECT *, 2 AS priority FROM lix_internal_state_cache_v1_lix_key_value
  ) s
  JOIN version_chain vc ON s.version_id = vc.version_id
  WHERE s.is_tombstone = 0
) WHERE rn = 1
```

### Notes

- Version inheritance is resolved via recursive CTE
- Closer versions (lower depth) take priority
- Tombstones in child versions hide parent state
- `state_by_version` does NOT use inheritance (explicit version only)
- `state` uses inheritance based on active version

### Tasks

1. Implement recursive CTE for version inheritance chain
2. Join state queries with version chain
3. Prioritize by inheritance depth (closer = higher priority)
4. Handle tombstones correctly (child tombstone hides parent state)
5. Apply inheritance only to `state` view, not `state_by_version`

## Milestone 21: Active Account and Change Author

The active account determines which account context is used for change attribution. Like active version, it is stored in the untracked table. When changes are created, the engine generates change author records linking changes to accounts.

### Storage (Active Account)

```sql
-- Active account is stored as untracked state
INSERT INTO lix_internal_state_untracked (entity_id, schema_key, file_id, version_id, snapshot_content)
VALUES ('lix_active_account', 'lix_key_value', NULL, NULL, '{"value": "account-1"}')
```

### Read Path

```sql
-- Engine reads active account on init and caches it
SELECT json_extract(snapshot_content, '$.value') AS active_account
FROM lix_internal_state_untracked
WHERE entity_id = 'lix_active_account' AND schema_key = 'lix_key_value'
```

### Change Author Generation

When a change is created, the engine automatically generates a `lix_change_author` record linking the change to the active account:

```sql
-- On INSERT into lix_internal_change, also insert change author
INSERT INTO lix_internal_state_cache_v1_lix_change_author (entity_id, schema_key, version_id, snapshot_content, ...)
VALUES (
  'change-author-uuid',
  'lix_change_author',
  'version-1',
  '{"change_id": "change-uuid", "account_id": "account-1"}',
  ...
)
```

### Schema Definitions

```json
// LixAccount
{
  "x-lix-key": "lix_account",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" }
  }
}

// LixActiveAccount (singleton)
{
  "x-lix-key": "lix_active_account",
  "properties": {
    "id": { "type": "string", "x-lix-default": "'lix_active_account'" },
    "account_id": { "type": "string" }
  }
}

// LixChangeAuthor
{
  "x-lix-key": "lix_change_author",
  "properties": {
    "change_id": { "type": "string" },
    "account_id": { "type": "string" }
  },
  "x-lix-foreign-keys": [
    { "property": "change_id", "schema": "lix_change", "target": "id" },
    { "property": "account_id", "schema": "lix_account", "target": "id" }
  ]
}
```

### Tasks

1. Store active account in untracked table on lix open
2. Cache active account in engine memory
3. Provide API to switch active account
4. Auto-generate `lix_change_author` records when changes are created
5. Link change authors to the active account at time of change creation

---

# State Views

## Milestone 22: `state_by_version` SELECT Rewriting

The `state_by_version` view provides state scoped to a specific version. It builds on the vtable rewriting by adding version-specific filtering.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM state_by_version
WHERE schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
SELECT
  entity_id,
  schema_key,
  file_id,
  version_id,
  snapshot_content,
  change_id
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id, file_id
    ORDER BY priority
  ) AS rn
  FROM (
    -- Priority 1: Untracked
    SELECT *, 1 AS priority FROM lix_internal_state_untracked
    WHERE schema_key = 'lix_key_value' AND version_id = 'version-1'

    UNION ALL

    -- Priority 2: Materialized
    SELECT *, 2 AS priority FROM lix_internal_state_cache_v1_lix_key_value
    WHERE version_id = 'version-1'
  )
) WHERE rn = 1 AND is_tombstone = 0
```

### Tasks

1. Parse SELECT statements targeting `state_by_version`
2. Extract `version_id` from WHERE clause
3. Apply version filtering to both untracked and cache tables
4. Filter out tombstones by default

## Milestone 23: `state_by_version` INSERT Rewriting

INSERT operations on `state_by_version` write to the underlying vtable with explicit version scoping.

### Query Rewriting Example

**Input query:**

```sql
INSERT INTO state_by_version (entity_id, schema_key, version_id, snapshot_content)
VALUES ('entity-1', 'lix_key_value', 'version-1', '{"key": "foo"}')
```

**Rewritten query:**

```sql
-- Delegates to lix_internal_state_vtable INSERT rewriting (Milestone 4)
-- with version_id explicitly set
```

### Tasks

1. Parse INSERT statements targeting `state_by_version`
2. Validate `version_id` is provided
3. Delegate to vtable INSERT rewriting with version context

## Milestone 24: `state_by_version` UPDATE Rewriting

UPDATE operations on `state_by_version` modify state for a specific version.

### Query Rewriting Example

**Input query:**

```sql
UPDATE state_by_version
SET snapshot_content = '{"key": "updated"}'
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- Delegates to lix_internal_state_vtable UPDATE rewriting (Milestone 5)
-- with version_id explicitly set
```

### Tasks

1. Parse UPDATE statements targeting `state_by_version`
2. Extract `version_id` from WHERE clause
3. Delegate to vtable UPDATE rewriting with version context

## Milestone 25: `state_by_version` DELETE Rewriting

DELETE operations on `state_by_version` create tombstones for the specified version.

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM state_by_version
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- Delegates to lix_internal_state_vtable DELETE rewriting (Milestone 6)
-- Creates tombstone for the specific version
```

### Tasks

1. Parse DELETE statements targeting `state_by_version`
2. Extract `version_id` from WHERE clause
3. Delegate to vtable DELETE rewriting (tombstone creation)

## Milestone 26: `state` SELECT Rewriting

The `state` view provides state for the "current" version (typically the active version in the session). It wraps `state_by_version` with implicit version resolution.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM state
WHERE schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- First resolve current version from session/context
-- Then rewrite as state_by_version with that version_id
SELECT * FROM (
  -- Same as state_by_version rewriting with version_id = <current_version>
  ...
) WHERE rn = 1 AND is_tombstone = 0
```

### Tasks

1. Parse SELECT statements targeting `state`
2. Resolve current version from engine context
3. Delegate to `state_by_version` SELECT rewriting with resolved version
4. Handle cases where no version is active

## Milestone 27: `state` INSERT Rewriting

INSERT operations on `state` write to the current version.

### Query Rewriting Example

**Input query:**

```sql
INSERT INTO state (entity_id, schema_key, snapshot_content)
VALUES ('entity-1', 'lix_key_value', '{"key": "foo"}')
```

**Rewritten query:**

```sql
-- Resolve current version, then delegate to state_by_version INSERT
```

### Tasks

1. Parse INSERT statements targeting `state`
2. Resolve current version from engine context
3. Delegate to `state_by_version` INSERT rewriting with resolved version

## Milestone 28: `state` UPDATE Rewriting

UPDATE operations on `state` modify state for the current version.

### Query Rewriting Example

**Input query:**

```sql
UPDATE state
SET snapshot_content = '{"key": "updated"}'
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Resolve current version, then delegate to state_by_version UPDATE
```

### Tasks

1. Parse UPDATE statements targeting `state`
2. Resolve current version from engine context
3. Delegate to `state_by_version` UPDATE rewriting with resolved version

## Milestone 29: `state` DELETE Rewriting

DELETE operations on `state` create tombstones for the current version.

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM state
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Resolve current version, then delegate to state_by_version DELETE
```

### Tasks

1. Parse DELETE statements targeting `state`
2. Resolve current version from engine context
3. Delegate to `state_by_version` DELETE rewriting (tombstone creation)

## Milestone 30: `state_history` SELECT Rewriting (Read-Only)

The `state_history` view provides the full history of state changes across all versions. Unlike `state` and `state_by_version`, it does not deduplicate by entity—it returns all historical records.

> **Note:** `state_history` is read-only. INSERT/UPDATE/DELETE are not supported.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM state_history
WHERE schema_key = 'lix_key_value' AND entity_id = 'entity-1'
```

**Rewritten query:**

```sql
-- Query change history joined with snapshots
SELECT
  c.entity_id,
  c.schema_key,
  c.file_id,
  c.plugin_key,
  c.created_at,
  s.content AS snapshot_content
FROM lix_internal_change c
JOIN lix_internal_snapshot s ON c.snapshot_id = s.id
WHERE c.schema_key = 'lix_key_value' AND c.entity_id = 'entity-1'
ORDER BY c.created_at DESC
```

### Tasks

1. Parse SELECT statements targeting `state_history`
2. Rewrite to query `lix_internal_change` joined with `lix_internal_snapshot`
3. Include all historical records (no deduplication)
4. Order by creation time
5. Reject INSERT/UPDATE/DELETE with clear error message

---

# Entity Views

## Milestone 31: `entity_by_version` SELECT Rewriting

The `entity_by_version` view is a layer on top of `state_by_version` that filters by `entity_id`. It returns state for a specific entity in a specific version.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM entity_by_version
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- Delegates to state_by_version SELECT rewriting (Milestone 14)
-- with entity_id filter applied
SELECT * FROM (
  -- state_by_version rewriting...
) WHERE entity_id = 'entity-1'
```

### Tasks

1. Parse SELECT statements targeting `entity_by_version`
2. Extract `entity_id` from WHERE clause (required)
3. Delegate to `state_by_version` SELECT rewriting with entity_id filter

## Milestone 32: `entity_by_version` INSERT Rewriting

INSERT operations on `entity_by_version` delegate to `state_by_version` INSERT.

### Query Rewriting Example

**Input query:**

```sql
INSERT INTO entity_by_version (entity_id, schema_key, version_id, snapshot_content)
VALUES ('entity-1', 'lix_key_value', 'version-1', '{"key": "foo"}')
```

**Rewritten query:**

```sql
-- Delegates to state_by_version INSERT rewriting (Milestone 15)
```

### Tasks

1. Parse INSERT statements targeting `entity_by_version`
2. Validate `entity_id` and `version_id` are provided
3. Delegate to `state_by_version` INSERT rewriting

## Milestone 33: `entity_by_version` UPDATE Rewriting

UPDATE operations on `entity_by_version` delegate to `state_by_version` UPDATE.

### Query Rewriting Example

**Input query:**

```sql
UPDATE entity_by_version
SET snapshot_content = '{"key": "updated"}'
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- Delegates to state_by_version UPDATE rewriting (Milestone 16)
```

### Tasks

1. Parse UPDATE statements targeting `entity_by_version`
2. Extract `entity_id` and `version_id` from WHERE clause
3. Delegate to `state_by_version` UPDATE rewriting

## Milestone 34: `entity_by_version` DELETE Rewriting

DELETE operations on `entity_by_version` delegate to `state_by_version` DELETE.

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM entity_by_version
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value' AND version_id = 'version-1'
```

**Rewritten query:**

```sql
-- Delegates to state_by_version DELETE rewriting (Milestone 17)
```

### Tasks

1. Parse DELETE statements targeting `entity_by_version`
2. Extract `entity_id` and `version_id` from WHERE clause
3. Delegate to `state_by_version` DELETE rewriting

## Milestone 35: `entity` SELECT Rewriting

The `entity` view is a layer on top of `state` that filters by `entity_id`. It returns state for a specific entity in the current version.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM entity
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Delegates to state SELECT rewriting (Milestone 18)
-- with entity_id filter applied
SELECT * FROM (
  -- state rewriting...
) WHERE entity_id = 'entity-1'
```

### Tasks

1. Parse SELECT statements targeting `entity`
2. Extract `entity_id` from WHERE clause (required)
3. Delegate to `state` SELECT rewriting with entity_id filter

## Milestone 36: `entity` INSERT Rewriting

INSERT operations on `entity` delegate to `state` INSERT.

### Query Rewriting Example

**Input query:**

```sql
INSERT INTO entity (entity_id, schema_key, snapshot_content)
VALUES ('entity-1', 'lix_key_value', '{"key": "foo"}')
```

**Rewritten query:**

```sql
-- Delegates to state INSERT rewriting (Milestone 19)
```

### Tasks

1. Parse INSERT statements targeting `entity`
2. Validate `entity_id` is provided
3. Delegate to `state` INSERT rewriting

## Milestone 37: `entity` UPDATE Rewriting

UPDATE operations on `entity` delegate to `state` UPDATE.

### Query Rewriting Example

**Input query:**

```sql
UPDATE entity
SET snapshot_content = '{"key": "updated"}'
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Delegates to state UPDATE rewriting (Milestone 20)
```

### Tasks

1. Parse UPDATE statements targeting `entity`
2. Extract `entity_id` from WHERE clause
3. Delegate to `state` UPDATE rewriting

## Milestone 38: `entity` DELETE Rewriting

DELETE operations on `entity` delegate to `state` DELETE.

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM entity
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Delegates to state DELETE rewriting (Milestone 21)
```

### Tasks

1. Parse DELETE statements targeting `entity`
2. Extract `entity_id` from WHERE clause
3. Delegate to `state` DELETE rewriting

## Milestone 39: `entity_history` SELECT Rewriting (Read-Only)

The `entity_history` view is a layer on top of `state_history` that filters by `entity_id`. It returns all historical records for a specific entity.

> **Note:** `entity_history` is read-only. INSERT/UPDATE/DELETE are not supported.

### Query Rewriting Example

**Input query:**

```sql
SELECT * FROM entity_history
WHERE entity_id = 'entity-1' AND schema_key = 'lix_key_value'
```

**Rewritten query:**

```sql
-- Delegates to state_history SELECT rewriting (Milestone 22)
-- with entity_id filter applied
SELECT * FROM (
  -- state_history rewriting...
) WHERE entity_id = 'entity-1'
```

### Tasks

1. Parse SELECT statements targeting `entity_history`
2. Extract `entity_id` from WHERE clause (required)
3. Delegate to `state_history` SELECT rewriting with entity_id filter
4. Reject INSERT/UPDATE/DELETE with clear error message

---

# Filesystem

## Milestone 40: Filesystem INSERT (file_descriptor, directory)

INSERT operations on the `file` and `directory` virtual views need to be rewritten to write to the underlying physical tables: `lix_file_descriptor` and `lix_directory`.

> **Note:** This milestone handles file/directory metadata only. File content (`file.data`) and change detection are addressed in a later milestone.

### Query Rewriting Example (file)

**Input query:**

```sql
INSERT INTO file (id, path, metadata)
VALUES ('file-1', '/src/index.ts', '{"size": 1024}')
```

**Rewritten query:**

```sql
-- 1. Insert into file_descriptor cache table
INSERT INTO lix_internal_state_cache_v1_lix_file_descriptor (entity_id, schema_key, version_id, snapshot_content, ...)
VALUES ('file-1', 'lix_file_descriptor', 'current-version', '{"id": "file-1", "path": "/src/index.ts", "metadata": {"size": 1024}}', ...)
ON CONFLICT ...;

-- 2. Create change record and snapshot (as in Milestone 2)
INSERT INTO lix_internal_snapshot (...) VALUES (...);
INSERT INTO lix_internal_change (...) VALUES (...);
```

### Query Rewriting Example (directory)

**Input query:**

```sql
INSERT INTO directory (id, path)
VALUES ('dir-1', '/src')
```

**Rewritten query:**

```sql
-- 1. Insert into directory cache table
INSERT INTO lix_internal_state_cache_v1_lix_directory (entity_id, schema_key, version_id, snapshot_content, ...)
VALUES ('dir-1', 'lix_directory', 'current-version', '{"id": "dir-1", "path": "/src"}', ...)
ON CONFLICT ...;

-- 2. Create change record and snapshot
INSERT INTO lix_internal_snapshot (...) VALUES (...);
INSERT INTO lix_internal_change (...) VALUES (...);
```

### Tasks

1. Parse INSERT statements targeting `file` and `directory` views
2. Map virtual view columns to underlying schema fields
3. Generate snapshot_content JSON from insert values
4. Rewrite to INSERT on cache tables + change/snapshot records
5. Apply schema defaults and validation (Milestones 12-14)

## Milestone 41: Filesystem SELECT (file, directory)

SELECT operations on `file` and `directory` virtual views need to be rewritten to query the underlying cache tables with proper prioritization.

> **Note:** `file.data` is a computed column that requires materialization from changes. This milestone returns `NULL` for `file.data`; content materialization is addressed in Milestone 44.

### Query Rewriting Example (file without data)

**Input query:**

```sql
SELECT id, path, metadata FROM file
WHERE path LIKE '/src/%'
```

**Rewritten query:**

```sql
SELECT
  json_extract(snapshot_content, '$.id') AS id,
  json_extract(snapshot_content, '$.path') AS path,
  json_extract(snapshot_content, '$.metadata') AS metadata
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id
    ORDER BY priority
  ) AS rn
  FROM (
    -- Priority 1: Untracked
    SELECT *, 1 AS priority FROM lix_internal_state_untracked
    WHERE schema_key = 'lix_file_descriptor'

    UNION ALL

    -- Priority 2: Cache
    SELECT *, 2 AS priority FROM lix_internal_state_cache_v1_lix_file_descriptor
  )
) WHERE rn = 1 AND json_extract(snapshot_content, '$.path') LIKE '/src/%'
```

### Query Rewriting Example (directory)

**Input query:**

```sql
SELECT id, path FROM directory
```

**Rewritten query:**

```sql
SELECT
  json_extract(snapshot_content, '$.id') AS id,
  json_extract(snapshot_content, '$.path') AS path
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY entity_id
    ORDER BY priority
  ) AS rn
  FROM (
    SELECT *, 1 AS priority FROM lix_internal_state_untracked
    WHERE schema_key = 'lix_directory'

    UNION ALL

    SELECT *, 2 AS priority FROM lix_internal_state_cache_v1_lix_directory
  )
) WHERE rn = 1
```

### Tasks

1. Parse SELECT statements targeting `file` and `directory` views
2. Rewrite column references to json_extract on snapshot_content
3. Apply prioritized UNION pattern (untracked > cache)
4. Handle `file.data` column specially (NULL in this milestone)
5. Push down WHERE predicates where possible

## Milestone 42: Filesystem UPDATE (file_descriptor, directory)

UPDATE operations on `file` and `directory` views need to be rewritten with RETURNING to capture the full row for change records.

### Query Rewriting Example

**Input query:**

```sql
UPDATE file
SET metadata = '{"size": 2048}'
WHERE id = 'file-1'
```

**Rewritten query:**

```sql
-- 1. Update cache table and return full row
UPDATE lix_internal_state_cache_v1_lix_file_descriptor
SET snapshot_content = json_set(snapshot_content, '$.metadata', '{"size": 2048}')
WHERE entity_id = 'file-1' AND version_id = 'current-version'
RETURNING *;

-- 2. With returned row, create snapshot and change records
INSERT INTO lix_internal_snapshot (...) VALUES (...);
INSERT INTO lix_internal_change (...) VALUES (...);
```

### Tasks

1. Parse UPDATE statements targeting `file` and `directory` views
2. Rewrite SET clauses to json_set operations on snapshot_content
3. Use RETURNING to get full row for change record generation
4. Handle partial updates (merge with existing snapshot_content)

## Milestone 43: Filesystem DELETE (file_descriptor, directory)

DELETE operations create tombstone records.

### Query Rewriting Example

**Input query:**

```sql
DELETE FROM file WHERE id = 'file-1'
```

**Rewritten query:**

```sql
-- 1. Create tombstone change record
INSERT INTO lix_internal_change (id, entity_id, schema_key, snapshot_id, ...)
VALUES ('change-uuid', 'file-1', 'lix_file_descriptor', 'no-content', ...);

-- 2. Update cache with tombstone
UPDATE lix_internal_state_cache_v1_lix_file_descriptor
SET is_tombstone = 1, snapshot_content = NULL, change_id = 'change-uuid'
WHERE entity_id = 'file-1' AND version_id = 'current-version';
```

### Tasks

1. Parse DELETE statements targeting `file` and `directory` views
2. Create tombstone change records (snapshot_id = 'no-content')
3. Update cache with is_tombstone = 1, snapshot_content = NULL
4. Ensure SELECT rewriting filters out tombstones

## Milestone 44: File Data Materialization and Change Detection

Once file descriptors can be written and read, we need to handle `file.data` - the actual file content. This requires:

1. **Materialization**: Computing `file.data` by applying changes via plugins
2. **Change Detection**: When `file.data` is written, detecting entity changes via plugins

### File Data Materialization

When a SELECT includes `file.data`, the engine must materialize the file content by:

1. Querying the file descriptor
2. Finding the matching plugin via `detectChangesGlob`
3. Querying entities (changes) for that file
4. Calling `host.apply_changes(plugin_key, file, changes)` → `plugin.applyChanges()`
5. Returning the cached fileData

```rust
fn materialize_file_data(file_id: &str, version_id: &str, host: &impl HostBindings) -> Result<Vec<u8>> {
    // 1. Get file descriptor
    let descriptor = host.execute(
        "SELECT * FROM lix_internal_state_cache_v1_lix_file_descriptor WHERE entity_id = ?",
        &[file_id]
    )?;

    // 2. Find matching plugin via glob
    let plugins = host.get_all_plugins()?;
    let plugin = plugins.iter()
        .find(|p| matches_glob(&p.detect_changes_glob, &descriptor.path))?;

    // 3. Query entities for this file
    let entities = host.execute(
        "SELECT * FROM state_by_version WHERE plugin_key = ? AND file_id = ? AND version_id = ?",
        &[&plugin.key, file_id, version_id]
    )?;

    // 4. Call plugin.applyChanges via host
    let file_data = host.apply_changes(&plugin.key, &descriptor, &entities)?;

    Ok(file_data)
}
```

### Change Detection (file.data writes)

When INSERT/UPDATE includes `file.data`:

1. Parse the file content
2. Find matching plugin via glob
3. Call `host.detect_changes(plugin_key, file, before, after)` → `plugin.detectChanges()`
4. Plugin returns entity changes to write

```rust
fn detect_file_changes(
    file: &FileDescriptor,
    before: Option<&[u8]>,
    after: &[u8],
    host: &impl HostBindings
) -> Result<Vec<EntityChange>> {
    // Find matching plugin
    let plugins = host.get_all_plugins()?;
    let plugin = plugins.iter()
        .find(|p| matches_glob(&p.detect_changes_glob, &file.path))?;

    // Call plugin.detectChanges via host
    let changes = host.detect_changes(&plugin.key, file, before, after)?;

    Ok(changes)
}
```

### Host Bindings (extended)

```rust
pub trait HostBindings {
    fn execute(&self, sql: &str, params: &[Value]) -> Result<Vec<Row>>;

    // Plugin callbacks
    fn get_all_plugins(&self) -> Result<Vec<Plugin>>;
    fn apply_changes(&self, plugin_key: &str, file: &FileDescriptor, changes: &[Entity]) -> Result<Vec<u8>>;
    fn detect_changes(&self, plugin_key: &str, file: &FileDescriptor, before: Option<&[u8]>, after: &[u8]) -> Result<Vec<EntityChange>>;
}
```

### Tasks

1. Extend HostBindings with plugin callback methods
2. Implement glob matching for plugin selection
3. Implement materialize_file_data for SELECT queries with file.data
4. Implement detect_file_changes for INSERT/UPDATE with file.data
5. Wire plugin callbacks through the WASM host interface
6. Handle the "unknown file" plugin fallback

## Milestone 45: Lazy Working Commit Materialization

When a query references a commit that is the current `working_commit_id` of a version, the engine must lazily materialize its change set before the query can proceed.

### Detection

The engine detects queries that reference working commits:

```rust
fn execute_query(sql: &str, host: &impl HostBindings) -> Result<Vec<Row>> {
    let ast = parse(sql)?;

    // Extract commit_id references from query
    let referenced_commits = extract_commit_references(&ast);

    for commit_id in referenced_commits {
        // Check if this commit is a working commit of any version
        if is_working_commit(&commit_id, host)? {
            materialize_working_commit(&commit_id, host)?;
        }
    }

    // Proceed with query execution
    // ...
}
```

### Materialization

When materializing a working commit:

1. **Collect changes** - Gather all changes referencing this commit
2. **Generate change set** - Create `lix_change_set` and `lix_change_set_element` records
3. **Handle tombstones** - Ensure deletions are properly recorded in the change set

```sql
-- 1. Create change set
INSERT INTO lix_internal_state_cache_v1_lix_change_set (...)
VALUES ('change-set-uuid', ...);

-- 2. Link changes to change set
INSERT INTO lix_internal_state_cache_v1_lix_change_set_element (...)
SELECT ... FROM lix_internal_change WHERE commit_id = 'working-commit-id';

-- 3. Update commit to reference change set
UPDATE lix_internal_state_cache_v1_lix_commit
SET snapshot_content = json_set(snapshot_content, '$.change_set_id', 'change-set-uuid')
WHERE entity_id = 'working-commit-id';
```

### Tasks

1. Implement `is_working_commit()` check against `lix_version_tip.working_commit_id`
2. Implement `extract_commit_references()` to find commit_id values in queries
3. Implement `materialize_working_commit()` to generate change set on demand
4. Handle tombstone changes correctly during materialization

## Milestone 46: Create Checkpoint

Explicit checkpoint creation that converts the working commit into an immutable checkpoint and creates a new working commit.

### Tasks

1. Materialize working commit change set (via Milestone 45)
2. Apply checkpoint label (if configured)
3. Create new empty working commit with parent = old working commit
4. Update `lix_version_tip`: `commit_id` = old working, `working_commit_id` = new empty

---

## Bonus Milestone: Better SQLite3 on node js

## Bonus Milestone: Target PostgreSQL as environment (embedded Postgres or pglite)

## Bonus Milestone: Rust SDK
