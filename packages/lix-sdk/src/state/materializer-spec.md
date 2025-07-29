# State Materializer Specification

## Overview

The state materializer reconstructs the current state of entities from the event log (changes) by walking commit history and applying inheritance rules. This document specifies the exact behavior and design decisions for the materialization process.

## Core Concepts

### 1. Event Log
- All state changes are stored as immutable events in the `change` table
- Each change belongs to a change set, which belongs to a commit
- Commits form a directed acyclic graph (DAG) through parent-child relationships

### 2. Versions
- Versions are branches in the system that can inherit from parent versions
- Each version points to a tip commit that represents its current state
- Versions can inherit state from parent versions (multi-level inheritance supported)

### 3. State Resolution
- The materializer walks from tip commits backwards through history
- First occurrence of an entity wins (closest to tip)
- Inheritance allows child versions to see parent state unless overridden

## Design Decisions

### 1. No Timestamp Dependency
**Decision**: Find version tips by commits with no children, not by timestamps.

**Rationale**: Timestamps can diverge between systems causing non-deterministic results.

### 2. Tombstone-Based Deletions
**Decision**: Deletions are represented as changes with `snapshot_content = NULL`.

**Rationale**: 
- Allows deletions to participate in inheritance
- Enables "undelete" when child version creates the entity again
- Maintains consistency with the event sourcing pattern

### 3. Minimum Depth for Merge Commits
**Decision**: When a commit is reachable via multiple paths, use the minimum depth.

**Rationale**: The shortest path from tip represents the most recent view of that commit.

### 4. No Global Version Assignment
**Decision**: Entities remain in their actual versions, no synthetic "global" version.

**Rationale**: 
- Maintains data provenance
- Avoids complex aggregation logic
- Consumers can create their own unified views if needed

### 5. Multi-Level Inheritance
**Decision**: Support inheritance chains of arbitrary depth (A → B → C).

**Rationale**: Required for correct version branching semantics.

## Implementation Architecture

### View 1: `internal_materialization_version_tips`
**Purpose**: Find the tip commit for each version without using timestamps.

**Logic**:
```sql
SELECT version WHERE NOT EXISTS (commit_edge WHERE parent = version.commit)
```

### View 2: `internal_materialization_commit_graph` 
**Purpose**: Build commit ancestry with depth from tip.

**Logic**:
- Recursive CTE starting from tips at depth 0
- Walk parent edges incrementing depth
- Group by (version_id, commit_id) taking MIN(depth) for merge commits

### View 3: `internal_materialization_latest_visible_state`
**Purpose**: Find the latest change for each entity using "first seen wins".

**Logic**:
- Join commit graph to changes via change sets
- Use ROW_NUMBER() partitioned by entity, ordered by depth
- First occurrence (closest to tip) is the latest state
- Include tombstones (NULL snapshots) for deletion tracking

### View 4: `internal_materialization_version_ancestry`
**Purpose**: Resolve multi-level version inheritance chains.

**Logic**:
- Recursive CTE to find all ancestors of each version
- Track inheritance depth for proper override precedence
- Include cycle detection via path tracking

### View 5: `internal_state_materializer`
**Purpose**: Combine direct and inherited state for final output.

**Logic**:
- Join version ancestry with latest visible state
- Use ROW_NUMBER() by inheritance depth (0 = direct, 1+ = inherited)
- Closest ancestor wins for each entity

## Edge Cases

### 1. Merge Commits
**Scenario**: Commit C is reachable from tip via paths of depth 3 and 7.

**Resolution**: Use depth 3 (minimum).

### 2. Deletion and Undeletion
**Scenario**: Parent deletes entity, child recreates it.

**Resolution**: Child's creation overrides parent's deletion tombstone.

### 3. Diamond Inheritance
**Scenario**: Version D inherits from B and C, which both inherit from A.

**Resolution**: D sees A's state via whichever path has minimum depth.

### 4. Cyclic Inheritance
**Scenario**: Version A inherits from B, B inherits from A.

**Resolution**: Detect via path tracking and stop recursion.

## Performance Considerations

### 1. Indexing Strategy
- Create indexes on frequently used JSON extractions
- Consider generated columns for `parent_id`, `child_id` lookups

### 2. Materialization Options
- Views can be materialized into temporary tables on cache miss
- Recursive CTEs can be limited to reasonable depths (e.g., 100)

### 3. Incremental Updates
- Future optimization: only recompute affected entities on new commits
- Current approach: full materialization on cache miss

## Testing Strategy

### 1. Unit Tests per View
- Test each view in isolation with known inputs/outputs
- Focus on edge cases for each transformation

### 2. Integration Tests
- End-to-end scenarios with complex commit graphs
- Verify inheritance chains and deletion semantics

### 3. Property-Based Tests
- Invariants that must hold regardless of input
- Example: An entity can only have one state per version

## Future Enhancements

### 1. Performance Optimizations
- Generated columns for JSON fields
- Materialized views for expensive computations
- Incremental materialization

### 2. Additional Features  
- Point-in-time queries (state at specific commit)
- Conflict detection for concurrent changes
- Provenance tracking (which commit introduced each state)

## References

- Original implementation: `/src/state/materialize-state.ts`
- Test suite: `/src/state/materialize-state.test.ts`
- Database schema: `/src/state/schema.ts`