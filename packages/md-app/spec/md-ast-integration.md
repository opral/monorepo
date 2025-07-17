# MD-AST Integration Specification

## Overview

This specification describes the integration of MD-AST (Markdown Abstract Syntax Tree) entities from lix-plugin-md directly into the md-app Plate editor, eliminating the need for expensive file materialization and preserving mdast_id properties throughout the editing workflow.

## Motivation

### Previous Architecture Issues

**File-Based Approach:**
```
Plate Editor → Markdown String → File → lix-plugin-md → lix entities → File → Markdown String → Plate Editor
```

**Problems:**
- Expensive file materialization on every edit
- Loss of mdast_id properties during editing
- No real-time sync between editor and lix entities
- Roundtrip performance issues
- Instability of auto-generated IDs

### New Architecture Benefits

**AST-Based Approach:**
```
Plate Editor ↔ MD-AST Entities (with preserved mdast_id) ↔ lix state
```

**Improvements:**
- Direct AST ↔ Plate conversion (no file intermediate)
- Preserved mdast_id properties for consistent tracking
- Real-time entity-level sync
- Reduced database materialization calls
- Stable ID management

## Technical Implementation

### 1. Core Components

#### A. Query Functions (`src/queries.ts`)

**New MD-AST Query Functions:**
```typescript
// Select MD-AST entities for active file
export async function selectMdAstEntities(): Promise<MdAstEntity[]>

// Select document order
export async function selectMdAstDocumentOrder(): Promise<string[]>

// Combined document selection
export async function selectMdAstDocument(): Promise<{
  entities: MdAstEntity[];
  order: string[];
}>

// Update entities (placeholder - needs proper change detection)
export async function updateMdAstEntities(entities: MdAstEntity[], order: string[]): Promise<void>
```

**MdAstEntity Interface:**
```typescript
export interface MdAstEntity {
  entity_id: string;
  mdast_id: string;
  type: string;
  children?: MdAstEntity[] | string[]; // Inline entities or references
  value?: string;
  depth?: number;
  ordered?: boolean;
  url?: string;
  alt?: string;
  title?: string;
  lang?: string;
  meta?: string;
  align?: Array<"left" | "right" | "center" | null>;
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
}
```

#### B. MD-AST Plate Bridge (`src/components/editor/mdast-plate-bridge.ts`)

**Core Conversion Functions:**
```typescript
// Convert entities to Plate nodes with ID preservation
export function mdastEntitiesToPlateValue(
  entities: MdAstEntity[], 
  order: string[]
): Descendant[]

// Convert Plate nodes to entities with ID preservation
export function plateValueToMdastEntities(
  plateValue: Descendant[]
): { entities: MdAstEntity[], order: string[] }

// Serialize entities to markdown with ID comments
export function serializeMdastEntities(
  entities: MdAstEntity[], 
  order: string[], 
  options?: { skipIdComments?: boolean }
): string
```

**ID Preservation Strategy:**
- Uses mdast_id as Plate node ID for perfect alignment
- Preserves HTML comment format: `<!-- mdast_id = {id} -->`
- Generates nanoid(10) compatible IDs for new nodes
- Maintains ID stability across edit operations

#### C. State Management Hook (`src/hooks/useMdAstState.ts`)

**Main Hook Interface:**
```typescript
export function useMdAstState(): {
  state: MdAstState;
  updateEntities: (entities: MdAstEntity[], order: string[]) => Promise<void>;
  reload: () => void;
}
```

**Features:**
- Optimistic updates for responsive UI
- Automatic conflict resolution
- Error handling with fallback
- Real-time sync with lix state

**Utility Hooks:**
```typescript
export function useMdAstDocument() // Read-only document access
export function useMdAstAvailability() // Check document state
```

#### D. Updated Plate Editor (`src/components/editor/plate-editor.tsx`)

**Key Changes:**
- Replaced `selectLoadedMarkdown()` with `selectMdAstDocument()`
- Uses `mdastEntitiesToPlateValue()` for loading content
- Uses `plateValueToMdastEntities()` for saving changes
- Implements controlled editor pattern with ID preservation
- Real-time entity updates via `useMdAstState` hook

### 2. Data Flow

#### Loading Sequence
1. `useMdAstState()` queries `selectMdAstDocument()`
2. `mdastEntitiesToPlateValue()` converts entities to Plate nodes
3. Plate editor loads with preserved mdast_id as node IDs
4. User sees content with stable IDs

#### Saving Sequence
1. User edits content in Plate editor
2. `plateValueToMdastEntities()` converts Plate nodes to entities
3. `updateEntities()` optimistically updates state
4. Hook saves entities to lix state
5. `saveLixToOpfs()` persists changes

#### ID Preservation Flow
```
lix entity.mdast_id → Plate node.id → edit operations → Plate node.id → lix entity.mdast_id
```

### 3. Schema Compatibility

The implementation uses existing lix-plugin-md schemas:

**Node Schema (`lix_plugin_md_node`):**
- Compatible with MarkdownNodeSchemaV1
- Preserves all mdast properties
- Maintains mdast_id for tracking

**Root Schema (`lix_plugin_md_root`):**
- Uses existing order tracking
- Compatible with MarkdownRootSchemaV1

### 4. Performance Optimizations

#### Reduced Database Calls
- Direct entity queries vs file materialization
- Batch entity updates
- Optimistic state updates

#### Memory Efficiency
- Reuse entity objects
- Minimize JSON serialization
- Efficient ID lookups with Maps

#### Edit Performance
- Stable IDs prevent unnecessary re-renders
- Direct AST transformations
- Debounced saves with optimistic updates

## Integration Points

### A. Backward Compatibility

**File Export:** 
```typescript
// Export markdown from entities
const markdown = serializeMdastEntities(entities, order);
```

**Legacy Components:**
- `selectLoadedMarkdown()` still available for migration
- Fallback to file-based saves on error
- Gradual migration path

### B. Plugin Ecosystem

**lix-plugin-md Integration:**
- Uses existing detectChanges/applyChanges interface
- Compatible with current change detection
- Maintains plugin API surface

**Plate Plugin Compatibility:**
- Works with existing Plate plugins
- Preserves plugin-specific attributes
- Maintains serialization pipeline

### C. Real-time Collaboration

**Entity-Level Tracking:**
- Each mdast_id represents a trackable entity
- Supports fine-grained conflict resolution
- Enables operational transformation

**Change Propagation:**
- Real-time entity updates
- Optimistic UI updates
- Automatic sync resolution

## Migration Guide

### Phase 1: Enable MD-AST Queries
1. Add new query functions to `queries.ts`
2. Test entity loading with existing documents
3. Verify schema compatibility

### Phase 2: Implement Bridge Layer
1. Create MD-AST ↔ Plate conversion functions
2. Test ID preservation across transformations
3. Validate roundtrip consistency

### Phase 3: Update Editor Integration
1. Replace file-based loading with entity loading
2. Implement controlled editor pattern
3. Add optimistic state management

### Phase 4: Production Deployment
1. Monitor performance improvements
2. Validate data consistency
3. Gradual rollout with feature flags

## Testing Strategy

### Unit Tests
```typescript
describe('MD-AST Integration', () => {
  test('preserves IDs through roundtrip', () => {
    const entities = [/* test entities */];
    const plateValue = mdastEntitiesToPlateValue(entities, order);
    const { entities: newEntities } = plateValueToMdastEntities(plateValue);
    
    expect(newEntities.map(e => e.mdast_id))
      .toEqual(entities.map(e => e.mdast_id));
  });
  
  test('converts complex markdown structures', () => {
    // Test tables, lists, code blocks, etc.
  });
  
  test('handles empty documents', () => {
    // Test edge cases
  });
});
```

### Integration Tests
- Editor loading with real lix data
- Save operations update lix state correctly
- Optimistic updates work properly
- Error handling and fallbacks

### Performance Tests
- Compare loading times vs file-based approach
- Memory usage during editing
- Database query efficiency
- Real-time sync latency

## Future Enhancements

### Advanced Features
1. **Conflict Resolution:** Smart merging of concurrent edits
2. **Incremental Updates:** Only sync changed entities
3. **Offline Support:** Local state with sync queues
4. **Version Control:** Entity-level history tracking

### Developer Experience
1. **DevTools:** MD-AST inspector and debugger
2. **Type Safety:** Stronger typing for entity transformations
3. **Error Reporting:** Better error messages and recovery
4. **Performance Monitoring:** Real-time metrics dashboard

## Conclusion

The MD-AST integration provides a robust foundation for real-time collaborative editing while maintaining backward compatibility and improving performance. The preserved mdast_id properties enable stable tracking across the entire pipeline, from Plate editor to lix entities.

Key benefits:
- ✅ **Performance:** Reduced file materialization overhead
- ✅ **Consistency:** Stable ID tracking throughout editing
- ✅ **Real-time:** Direct entity-level synchronization
- ✅ **Compatibility:** Works with existing lix-plugin-md
- ✅ **Extensibility:** Foundation for advanced collaboration features

This implementation demonstrates the power of treating lix state as the single source of truth while providing seamless integration with modern editing interfaces.