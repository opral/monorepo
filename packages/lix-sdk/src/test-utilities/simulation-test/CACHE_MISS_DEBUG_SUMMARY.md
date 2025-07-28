# Cache Miss Simulation Test Debugging Summary

## Overview
The cache-miss simulation test is failing with a determinism violation. The test produces different results than the normal simulation - specifically, 21 change set element (CSE) entries are missing in the cache-miss simulation.

## Test Failure Details
- **Normal simulation**: 96 cache entries
- **Cache-miss simulation**: 75 cache entries  
- **Missing entries**: 21 CSE entries with entity_id pattern `test_0000000050::*` and `version_id = 'global'`

## How Cache-Miss Simulation Works
The cache-miss simulation (in `cache-miss-simulation.ts`):
1. Wraps all SELECT queries to clear the cache before execution
2. Forces re-materialization from the change table on every query
3. Tests that state can be correctly reconstructed without relying on cached data

## Root Cause Analysis

### What's Happening
1. During commit, when changes are made to a version:
   - A new changeset is created (e.g., `test_0000000050`)
   - An edge is created from the old changeset to the new one
   - CSE entries are created for all changes in the changeset
   - The version is updated to point to the new changeset

2. In normal operation, these CSE entries are cached and persist

3. In cache-miss simulation, when the cache is cleared and rebuilt:
   - The CSE entries created during commit (`test_0000000050::*`) are not being materialized
   - The raw changes exist in the database but aren't picked up by materialization views

### Key Findings
1. **Edge exists**: The edge from `boot_0000000003` to `test_0000000050` is correctly created and exists in the change table
2. **Lineage is correct**: The lineage view correctly includes `test_0000000050` for the global version
3. **Raw changes exist**: The CSE entries (`test_0000000050::*`) exist in the change table
4. **Materialization fails**: These CSE entries are not included in the final materialized state

### The Architecture Issue
The materialization views have a fundamental design issue with CSE elements:
- The `internal_materialization_cse` view treats CSE elements as metadata to find OTHER entities
- The `internal_materialization_leaf_snapshots` view uses this metadata but doesn't materialize CSE elements themselves
- CSE elements ARE entities that need to be in the state, not just metadata

## Changes Made During Debugging

### 1. Fixed Version Roots Query (in `materialize-state.ts`)
Changed from timestamp-based to edge-based approach:
```sql
-- Old: relied on timestamps
WHERE v.created_at >= (SELECT MAX(created_at) FROM ...)

-- New: uses graph edges
WHERE NOT EXISTS (
  SELECT 1 FROM internal_materialization_all_changes edge
  WHERE edge.schema_key = 'lix_change_set_edge'
    AND json_extract(edge.snapshot_content,'$.parent_id') = json_extract(v.snapshot_content,'$.change_set_id')
)
```

### 2. Fixed getVersionRecordByIdOrThrow (in `get-version-record-by-id-or-throw.ts`)
Added check for uncommitted changes in transaction table:
```typescript
// First check the transaction table for uncommitted changes
let [versionRecord] = executeSync({
  lix: { sqlite },
  query: db
    .selectFrom("internal_change_in_transaction")
    .where("schema_key", "=", "lix_version")
    .where("entity_id", "=", version_id)
    .where("snapshot_content", "is not", null)
    .orderBy("created_at", "desc")
    .limit(1)
    .select(sql`json(snapshot_content)`.as("content")),
}) as [{ content: string } | undefined];
```

### 3. Fixed Commit Logic (in `commit.ts`)
Ensured global version is processed after other versions to pick up their changes:
```typescript
// First pass: Create changesets for non-global versions
for (const [version_id, versionChanges] of changesByVersion) {
  if (version_id !== "global") {
    const changesetId = createChangesetForTransaction(...);
    changesetIdsByVersion.set(version_id, changesetId);
  }
}

// Second pass: Handle global version
if (changesetIdsByVersion.size > 0 || changesByVersion.has("global")) {
  // Re-query to get version updates from first pass
  const globalChanges = executeSync({...});
  if (globalChanges.length > 0) {
    const globalChangesetId = createChangesetForTransaction(...);
    changesetIdsByVersion.set("global", globalChangesetId);
  }
}
```

### 4. Fixed Materializer View (in `materialize-state.ts`)
Updated to handle entities appearing in multiple versions without duplicates:
```sql
-- Uses entity_versions CTE to determine which version an entity belongs to
-- Entities in multiple versions are assigned to 'global'
-- Prefers changes from the global version for multi-version entities
```

## What Still Needs to Be Fixed

The core issue remains: CSE elements created during commit are not being properly materialized in the cache-miss simulation. This requires a fundamental redesign of how the materialization views handle CSE elements.

### Potential Solutions
1. **Include CSE elements directly in leaf snapshots**: Modify the views to treat CSE elements as first-class entities, not just metadata
2. **Separate CSE materialization**: Create a dedicated materialization path for CSE elements
3. **Fix the CSE view**: Redesign how the CSE view works to ensure CSE elements themselves are materialized

## Test Status
- The cache-miss simulation test is still failing
- All unit tests for individual fixes are passing
- The issue is reproducible and well-understood

## Next Steps
1. Decide on the architectural approach for CSE element materialization
2. Redesign the materialization views to properly handle CSE elements
3. Ensure CSE elements are treated as entities throughout the materialization pipeline
4. Verify the fix resolves the cache-miss simulation test failure

## Relevant Files
- `/packages/lix-sdk/src/test-utilities/simulation-test/cache-miss-simulation.test.ts` - The failing test
- `/packages/lix-sdk/src/test-utilities/simulation-test/cache-miss-simulation.ts` - The simulation implementation
- `/packages/lix-sdk/src/state/materialize-state.ts` - Materialization views
- `/packages/lix-sdk/src/state/commit.ts` - Commit logic
- `/packages/lix-sdk/src/state/get-version-record-by-id-or-throw.ts` - Version record retrieval
- `/packages/lix-sdk/src/state/commit.test.ts` - Unit tests for commit logic

## Debug Commands
```bash
# Run the failing test
pnpm exec vitest run cache-miss-simulation.test.ts -t "cache miss simulation produces correct query results"

# Run commit tests
pnpm exec vitest run commit.test.ts

# Check for TypeScript errors
pnpm exec tsc --noEmit
```