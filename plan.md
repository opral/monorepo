# Query Compiler Plan

## Problem

The vtable approach for SELECT queries leads to severe performance degration:

- filters like `json_extract` are not pushed down leading the vtable to return all rows which sqlite filters afterwards. that bypasses indexes alltogether.
- the SQLite query planner is unoptimized because vtable's are a boundary
- the vtable has parsing overhead from bridging JS <-> WASM evident by countless xFilter calls
- the cache solution can't be materialized because SQLite enforces static columns

## Solution

Implement a query processor which takes SQL and routes it to the underlying tables. That bypasses the vtable(s) for SELECT queries, enabling materialized cache, avoiding JS <-> WASM bridgeing, and the full SQLite query planner.

### TODOs

- [ ] compile internal_state_cache to optimized routes
- [ ] compile internal_resolved_state_all to optimized routes
- [ ] compile state, state_all, state_with_tombstones into optimized route
- [ ] create entity views with optimized routes
- [ ] verify no more vtable's on read queries
- [ ] implement materialized cache
