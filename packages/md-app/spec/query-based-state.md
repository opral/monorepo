# MD-App State Refactoring: Jotai → Query-Based Architecture

This document describes the refactoring of MD-App's state management from Jotai atoms to a query-based architecture inspired by the prosemirror example.

## Overview

The refactoring replaces complex Jotai atom chains with simple, direct database queries using a polling-based approach. This results in:

- **Simpler architecture**: Direct query functions instead of atom dependencies
- **Better performance**: Configurable polling intervals and reduced overhead
- **Easier testing**: Pure functions that can be tested independently
- **Cleaner code**: Eliminates complex atom interdependencies

## New Architecture

### Core Components

1. **`useQuery` Hook** (`src/hooks/useQuery.ts`)
   - Polls a query function at configurable intervals
   - Manages loading states, error handling, and data comparison
   - Returns `[data, loading, error, refetch]`

2. **Query Functions** (`spec/queries.ts`)
   - Pure functions that query the Lix database directly
   - No React dependencies - can be tested independently
   - Handle all database operations and business logic

3. **React Hooks** (`spec/state-queries.ts`)
   - Combines `useQuery` with query functions
   - Provides convenient React hooks for components
   - Manages polling intervals appropriate for each data type

4. **Demo Components** (`spec/QueryStateDemo.tsx`)
   - Shows how to use the new system
   - Provides migration examples
   - Demonstrates best practices

## Migration Guide

### Before (Jotai)

```typescript
// Old approach
import { useAtom } from 'jotai';
import { activeFileAtom, loadedMdAtom, withPollingAtom } from '../state';

function MyComponent() {
  const [polling] = useAtom(withPollingAtom);
  const [file] = useAtom(activeFileAtom);
  const [markdown] = useAtom(loadedMdAtom);
  
  // Complex dependencies, hard to test
  return <div>{file?.path}: {markdown?.length} chars</div>;
}
```

### After (Query-based)

```typescript
// New approach
import { useActiveFile, useLoadedMarkdown } from '../spec/state-queries';

function MyComponent() {
  const { file, loading: fileLoading, error } = useActiveFile();
  const { markdown, loading: markdownLoading } = useLoadedMarkdown();
  
  if (fileLoading || markdownLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{file?.path}: {markdown?.length} chars</div>;
}
```

## Available Hooks

### Core State Hooks

| Hook | Description | Polling Interval |
|------|-------------|------------------|
| `useLix()` | Main Lix instance | 250ms |
| `useActiveVersion()` | Current version | 250ms |
| `useActiveFile()` | Currently selected file | 250ms |
| `useLoadedMarkdown()` | Markdown content | 250ms |

### Data Hooks

| Hook | Description | Polling Interval |
|------|-------------|------------------|
| `useFiles()` | All files | 500ms |
| `useVersions()` | All versions | 1000ms |
| `useAccounts()` | All accounts | 1000ms |
| `useActiveAccount()` | Current account | 500ms |

### Change Tracking Hooks

| Hook | Description | Polling Interval |
|------|-------------|------------------|
| `useCheckpointChangeSets()` | Checkpoint history | 500ms |
| `useWorkingChangeSet()` | Current working changes | 250ms |
| `useIntermediateChanges()` | Pending changes | 250ms |

### Utility Hooks

| Hook | Description | Polling Interval |
|------|-------------|------------------|
| `useIsSyncing()` | Sync status | 1000ms |
| `useCurrentLixName()` | Current Lix filename | 1000ms |
| `useAvailableLixes()` | Available Lix files | 1000ms |

### URL Parameter Hooks

| Hook | Description | Polling Interval |
|------|-------------|------------------|
| `useFileIdFromUrl()` | File ID from URL | 100ms |
| `useLixIdFromUrl()` | Lix ID from URL | 100ms |
| `useThreadFromUrl()` | Thread ID from URL | 100ms |

### Dynamic Hooks

```typescript
// Hooks that take parameters
const { threads } = useThreads(changeSetId);
const { diffs } = useChangeDiffs(changeSetId, beforeChangeSetId);
```

## Query Functions

All query functions are pure and can be used independently:

```typescript
import { 
  selectActiveFile, 
  selectLoadedMarkdown, 
  selectCheckpointChangeSets 
} from '../spec/queries';

// Use directly in tests or server-side code
const file = await selectActiveFile();
const markdown = await selectLoadedMarkdown();
const checkpoints = await selectCheckpointChangeSets();
```

## Key Benefits

### 1. Simplified Architecture
- **Before**: Complex atom chains with interdependencies
- **After**: Direct database queries with clear data flow

### 2. Better Performance
- **Before**: Single polling interval for all data (via `withPollingAtom`)
- **After**: Configurable intervals per data type (100ms for URL params, 1000ms for rarely-changing data)

### 3. Easier Testing
- **Before**: Required atom store setup and complex mocking
- **After**: Pure query functions can be tested independently

### 4. Cleaner Error Handling
- **Before**: Errors buried in atom chains
- **After**: Each hook provides explicit error states

### 5. Better Developer Experience
- **Before**: Hard to understand atom dependencies
- **After**: Clear, direct function calls

## Implementation Details

### Polling Strategy

Different data types use different polling intervals:

- **High-frequency (100-250ms)**: URL params, active file, current content
- **Medium-frequency (500ms)**: File lists, account info, change sets
- **Low-frequency (1000ms)**: Rarely-changing data like versions, sync status

### Error Handling

Each hook provides error states:

```typescript
const { data, loading, error, refetch } = useActiveFile();

if (error) {
  console.error('Failed to load file:', error);
  // Show error UI or retry
}
```

### Memory Management

The `useQuery` hook includes proper cleanup:
- Cancels polling when component unmounts
- Prevents state updates on unmounted components
- Efficient data comparison to prevent unnecessary re-renders

## Migration Checklist

### Phase 1: Setup ✅
- [x] Copy `useQuery` and `useKeyValue` hooks
- [x] Create query functions (`queries.ts`)
- [x] Create React hooks (`state-queries.ts`)
- [x] Create demo components

### Phase 2: Component Updates
- [ ] Update components to use new hooks
- [ ] Replace `useAtom` calls with query-based hooks
- [ ] Remove Jotai store references
- [ ] Test component functionality

### Phase 3: Cleanup
- [ ] Remove old `state.ts` and `state-active-file.ts`
- [ ] Remove Jotai dependencies
- [ ] Update imports across codebase
- [ ] Run tests and verify functionality

## Testing

### Query Functions
```typescript
import { selectActiveFile } from '../spec/queries';

test('selectActiveFile returns markdown files', async () => {
  // Mock Lix instance
  const result = await selectActiveFile();
  expect(result.path).toMatch(/\.md$/);
});
```

### React Hooks
```typescript
import { renderHook } from '@testing-library/react';
import { useActiveFile } from '../spec/state-queries';

test('useActiveFile hook', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useActiveFile());
  
  expect(result.current.loading).toBe(true);
  await waitForNextUpdate();
  expect(result.current.file).toBeDefined();
});
```

## Performance Considerations

### Optimizations Included

1. **Data Comparison**: Only triggers re-renders when data actually changes
2. **Configurable Intervals**: Different polling rates for different data types
3. **Cleanup**: Proper resource cleanup on unmount
4. **Error Boundaries**: Isolated error handling per hook

### Best Practices

1. **Use appropriate polling intervals**: Don't poll frequently-changing data slowly or vice versa
2. **Handle loading states**: Always show loading indicators for better UX
3. **Implement error recovery**: Provide retry mechanisms for failed queries
4. **Test with real data**: Ensure queries work with actual Lix databases

## Conclusion

This refactoring significantly simplifies the MD-App architecture while improving performance and maintainability. The query-based approach aligns with modern React patterns and makes the codebase easier to understand and extend.

The new system provides:
- Clear separation of concerns
- Easier testing and debugging
- Better performance characteristics
- Improved developer experience
- Future-proof architecture that can easily accommodate new features

## Files Created

1. **`src/hooks/useQuery.ts`** - Core polling hook
2. **`src/hooks/useKeyValue.ts`** - Key-value storage hook
3. **`spec/queries.ts`** - Pure query functions
4. **`spec/state-queries.ts`** - React hooks
5. **`spec/QueryStateDemo.tsx`** - Demo components
6. **`spec/README.md`** - This documentation