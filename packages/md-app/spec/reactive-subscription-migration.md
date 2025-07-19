# Reactive Subscription Migration Specification

## Overview

This specification defines the migration from polling-based state management to reactive subscription-based architecture in the md-app package. The goal is to replace manual polling intervals with automatic subscriptions that react to database changes in real-time.

## Current Architecture (Polling-based)

### Problems with Current Approach

1. **Performance Overhead**: Components poll the database at fixed intervals (e.g., every second)
2. **Resource Waste**: Unnecessary queries even when data hasn't changed
3. **Latency**: Updates only occur on polling intervals, not immediately
4. **Complex State Management**: Manual coordination between polling and UI updates
5. **Jotai Dependency**: Heavy reliance on `withPollingAtom` for state updates

### Current Implementation

```typescript
// Current polling pattern
export const withPollingAtom = atom(Date.now());

export const filesAtom = atom(async (get) => {
  get(withPollingAtom); // Triggers re-evaluation on polling
  const lix = await get(lixAtom);
  if (!lix) return [];
  return await lix.db.selectFrom("file").selectAll().execute();
});
```

## Target Architecture (Reactive Subscriptions)

### Benefits of Reactive Approach

1. **Real-time Updates**: Components update immediately when data changes
2. **Performance Efficiency**: Only query when data actually changes
3. **Automatic Cleanup**: Subscriptions are automatically cleaned up on unmount
4. **Simplified State**: No need for manual polling coordination
5. **Better UX**: Instant feedback for user actions

### New Implementation Pattern

```typescript
// New reactive pattern
function useFiles() {
  return useQuery(async (lix) => {
    return await lix.db.selectFrom("file").selectAll().execute();
  });
}
```

## Migration Strategy

### Phase 1: Foundation (Completed)
- ✅ Migrate from `openLixInMemory` to `openLix` with `OpfsStorage`
- ✅ Remove `saveLixToOpfs` helper function and manual persistence
- ✅ Create reactive hooks infrastructure (`useQuery`, `useKeyValue`)

### Phase 2: Component Migration (In Progress)
- Replace Jotai atoms with reactive hooks in components
- Update components to use `useQuery` instead of polling atoms
- Remove `withPollingAtom` dependency

### Phase 3: Cleanup (Future)
- Remove unused Jotai atoms
- Remove polling infrastructure
- Optimize query patterns

## Reactive Hooks API

### `useQuery<T>(queryFn: (lix: Lix) => Promise<T>)`

Basic reactive query hook that automatically updates when database changes.

**Usage:**
```typescript
function MyComponent() {
  const { data: files, loading, error } = useQuery(async (lix) => {
    return await lix.db.selectFrom("file").selectAll().execute();
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{files.length} files</div>;
}
```

### `useQuery<T>(queryFn: (lix: Lix) => Promise<T>): T`

Suspense-compatible reactive query hook for concurrent rendering.

**Usage:**
```typescript
function MyComponent() {
  const files = useQuery(async (lix) => {
    return await lix.db.selectFrom("file").selectAll().execute();
  });
  
  return <div>{files.length} files</div>;
}
```

### `useKeyValue<T>(key: string)`

Reactive key-value store for shared state across components.

**Usage:**
```typescript
function MyComponent() {
  const { value: activeTab, setValue: setActiveTab } = useKeyValue<string>('activeTab');
  
  return (
    <button onClick={() => setActiveTab('files')}>
      Current tab: {activeTab}
    </button>
  );
}
```

## Migration Examples

### Before: Polling-based File List

```typescript
// atoms.ts
export const filesAtom = atom(async (get) => {
  get(withPollingAtom); // Manual polling trigger
  const lix = await get(lixAtom);
  if (!lix) return [];
  return await lix.db.selectFrom("file").selectAll().execute();
});

// Component.tsx
function FilesComponent() {
  const files = useAtomValue(filesAtom);
  // Component re-renders on polling interval
}
```

### After: Reactive Subscriptions

```typescript
// Component.tsx
function FilesComponent() {
  const { data: files, loading } = useQuery(async (lix) => {
    return await lix.db.selectFrom("file").selectAll().execute();
  });
  
  // Component re-renders only when files change
  if (loading) return <div>Loading...</div>;
  return <div>{files.length} files</div>;
}
```

## Implementation Guidelines

### 1. Query Function Patterns

**File Queries:**
```typescript
const { data: files } = useQuery(async (lix) => {
  return await lix.db.selectFrom("file").selectAll().execute();
});
```

**Active File Query:**
```typescript
const { data: activeFile } = useQuery(async (lix) => {
  const fileId = getFileIdFromUrl();
  if (!fileId) return null;
  
  return await lix.db
    .selectFrom("file")
    .where("id", "=", fileId)
    .executeTakeFirst();
});
```

**Checkpoint Queries:**
```typescript
const { data: checkpoints } = useQuery(async (lix) => {
  return await selectCheckpointChangeSets(); // Reuse existing query functions
});
```

### 2. Error Handling

```typescript
function MyComponent() {
  const { data, loading, error } = useQuery(queryFunction);
  
  if (error) {
    console.error('Query failed:', error);
    return <div>Failed to load data</div>;
  }
  
  if (loading) return <div>Loading...</div>;
  return <div>Data: {JSON.stringify(data)}</div>;
}
```

### 3. Dependency Management

```typescript
// Avoid creating new functions on every render
const queryFunction = useCallback(async (lix: Lix) => {
  return await lix.db.selectFrom("file").selectAll().execute();
}, []);

const { data } = useQuery(queryFunction);
```

### 4. Shared State Management

```typescript
// Replace Jotai atoms with reactive key-value pairs
const { value: expandedChangeSet, setValue: setExpandedChangeSet } = 
  useKeyValue<string>('expandedChangeSet');

const { value: activeDiffTab, setValue: setActiveDiffTab } = 
  useKeyValue<'diff' | 'threads'>('activeDiffTab');
```

## Performance Considerations

### 1. Subscription Lifecycle
- Subscriptions are created when component mounts
- Automatic cleanup when component unmounts
- No memory leaks from forgotten cleanup

### 2. Query Optimization
- Observers only trigger when relevant data changes
- No unnecessary re-renders on unrelated database changes
- Efficient database query patterns

### 3. Batching Updates
- Multiple rapid changes are batched automatically
- UI updates smoothly without flickering
- Consistent state across components

## Testing Strategy

### 1. Unit Tests
- Test reactive hooks in isolation
- Mock lix database for predictable tests
- Verify subscription cleanup

### 2. Integration Tests
- Test component updates with real database changes
- Verify cross-component state synchronization
- Test error handling scenarios

### 3. Performance Tests
- Compare polling vs reactive performance
- Measure subscription overhead
- Verify memory usage patterns

## Migration Timeline

### Immediate (Phase 1) - ✅ Completed
- [x] Core migration to `openLix` + `OpfsStorage`
- [x] Remove `saveLixToOpfs` dependencies
- [x] Create reactive hooks infrastructure

### Short-term (Phase 2) - In Progress
- [ ] Migrate key components to reactive hooks
- [ ] Replace polling in sidebar components
- [ ] Update file management components
- [ ] Migrate editor state management

### Medium-term (Phase 3) - Future
- [ ] Remove Jotai dependency entirely
- [ ] Optimize query patterns
- [ ] Performance benchmarking
- [ ] Documentation updates

## Breaking Changes

### For Developers

1. **New Hook Dependencies**: Components must use new reactive hooks
2. **Query Function Patterns**: Async functions must return promises
3. **Error Handling**: Different error handling patterns required

### For Users

1. **Improved Performance**: Faster, more responsive UI
2. **Real-time Updates**: Immediate feedback on actions
3. **Better Reliability**: Reduced chance of stale data

## Future Considerations

### 1. Advanced Patterns
- Optimistic updates for better UX
- Offline synchronization support
- Complex query joins and relationships

### 2. Developer Experience
- DevTools integration for debugging subscriptions
- Performance monitoring and metrics
- Query caching strategies

### 3. Scalability
- Subscription batching for large datasets
- Memory optimization for long-running sessions
- Background synchronization improvements

## Conclusion

The reactive subscription migration represents a significant architectural improvement for the md-app package. By replacing polling with reactive subscriptions, we achieve better performance, real-time updates, and a more maintainable codebase. The migration follows a phased approach to minimize disruption while delivering immediate benefits.