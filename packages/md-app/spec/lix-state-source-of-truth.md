# Specification: Decouple lix-plugin-md and Plate by Using Lix State as Source of Truth

## Overview

This specification outlines the implementation to decouple lix-plugin-md and Plate editor by making lix state the single source of truth, eliminating the circular dependency through markdown file serialization.

## Current Architecture Issues

### Problem Statement

The current architecture has circular dependencies where both systems treat markdown files as the source of truth:

```
Plate AST → Markdown String → File → lix-plugin-md → lix entities → lix-plugin-md → File → Markdown String → Plate AST
```

**Key Issues:**
1. **ID Loss**: Plate editor strips `<!-- id: xyz -->` comments during editing
2. **Unstable IDs**: Auto-generated IDs change with content modifications
3. **Roundtrip Performance**: Unnecessary serialization/deserialization cycles
4. **Schema Limitations**: Current block schema too simple for complex markdown
5. **No Real-time Sync**: Editor changes don't immediately reflect in lix entities

### Current Data Flow Analysis

**md-app (Plate Editor):**
- Loads markdown from `file.data` as plain string
- Converts to Plate JSON structure via ExtendedMarkdownPlugin
- Debounced save serializes back to markdown string
- Loses HTML comment IDs during editing

**lix-plugin-md:**
- Parses markdown string into simple blocks (text, type, id)
- Uses `btoa(markdown) + position` for auto-generated IDs
- Stores in `state.snapshot_content` as JSON
- Materializes file from entities via `applyChanges()`

## Proposed Architecture

### New Data Flow

```
Plate AST ↔ Markdown AST ↔ lix entities (with preserved IDs)
                    ↓
              Markdown File Export (on demand)
```

### Core Architectural Principles

1. **Single Source of Truth**: Lix state contains the authoritative document structure
2. **AST-Based**: Use unified/remark AST format as standard interchange format
3. **ID Preservation**: Maintain HTML comment IDs throughout the entire pipeline
4. **Direct Sync**: Plate changes directly update lix entities without file roundtrips
5. **Backward Compatibility**: Maintain existing plugin API and file-based workflows

## Technical Implementation

### Phase 1: Enhanced lix-plugin-md Schema

#### 1.1 Enhanced Markdown AST Schema

Update the existing markdown plugin schema to support rich AST structure while maintaining the same plugin key:

**Enhanced Schema (MarkdownBlockSchemaV1 - Updated):**
```typescript
{
  "x-lix-key": "lix_plugin_md_block",
  "x-lix-version": "1.0",
  properties: {
    id: { type: "string" },                    // Plate nanoid(10) format: e.g., "V1StGXR8_Z"
    type: { type: "string" },                  // AST node type (paragraph, heading, text, etc.)
    value: { type: "string", optional: true }, // Text content for leaf nodes
    children: { 
      type: "array", 
      items: { type: "string" },               // Child entity IDs (Plate nanoid format)
      optional: true 
    },
    attributes: { 
      type: "object", 
      optional: true,
      properties: {
        depth: { type: "number", optional: true },     // Heading level
        ordered: { type: "boolean", optional: true },  // List type
        url: { type: "string", optional: true },       // Link URL
        alt: { type: "string", optional: true },       // Image alt text
        lang: { type: "string", optional: true },      // Code language
        // ... other node-specific attributes
      }
    },
    position: {
      type: "object",
      optional: true,
      properties: {
        start: { type: "object", properties: { line: { type: "number" }, column: { type: "number" } } },
        end: { type: "object", properties: { line: { type: "number" }, column: { type: "number" } } }
      }
    }
  }
}
```

#### 1.2 Updated parseMdBlocks Implementation

**File:** `packages/lix-plugin-md/src/utilities/parseMdBlocks.ts`

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { Root, Node } from 'mdast';
import { visit } from 'unist-util-visit';

// New AST-based parsing function
export function parseMarkdownToAstEntities(markdown: string): Block[] {
  const ast = unified().use(remarkParse).parse(markdown);
  const entities: Block[] = [];
  
  visit(ast, (node: Node, index: number, parent: Node) => {
    // Extract or generate ID from HTML comments
    const id = extractIdFromNode(node) || generateStableId(node, parent, index);
    
    // Convert AST node to entity
    const entity: Block = {
      id,
      type: node.type,
      value: 'value' in node ? node.value : undefined,
      children: 'children' in node ? node.children?.map(child => extractIdFromNode(child) || generateStableId(child, node, 0)) : undefined,
      attributes: extractNodeAttributes(node),
      position: node.position
    };
    
    entities.push(entity);
  });
  
  return entities;
}

// Convert entities back to markdown AST
export function astEntitiesToMarkdown(entities: Block[]): string {
  const ast = reconstructAstFromEntities(entities);
  return unified().use(remarkStringify).stringify(ast);
}

function extractIdFromNode(node: Node): string | null {
  // Look for preceding HTML comment with ID
  if (node.type === 'html' && node.value?.includes('<!-- id:')) {
    const match = node.value.match(/<!-- id:\s*([^-]+)\s*-->/);
    return match?.[1]?.trim() || null;
  }
  return null;
}

function generatePlateCompatibleId(): string {
  // Generate Plate-compatible nanoid(10) format
  return nanoid(10);
}
```

#### 1.3 Updated detectChanges and applyChanges

**File:** `packages/lix-plugin-md/src/detectChanges.ts`

```typescript
export function detectChanges(options: DetectChangesOptions): Change[] {
  const { before, after } = options;
  
  // Parse both versions to AST entities
  const beforeEntities = parseMarkdownToAstEntities(before);
  const afterEntities = parseMarkdownToAstEntities(after);
  
  // Compare entity structures
  return detectEntityChanges(beforeEntities, afterEntities);
}

function detectEntityChanges(before: Block[], after: Block[]): Change[] {
  const changes: Change[] = [];
  
  // Create lookup maps
  const beforeMap = new Map(before.map(entity => [entity.id, entity]));
  const afterMap = new Map(after.map(entity => [entity.id, entity]));
  
  // Detect additions, modifications, deletions
  for (const [id, afterEntity] of afterMap) {
    const beforeEntity = beforeMap.get(id);
    
    if (!beforeEntity) {
      // New entity
      changes.push({
        type: 'insert',
        entity_id: id,
        snapshot_content: afterEntity
      });
    } else if (!deepEqual(beforeEntity, afterEntity)) {
      // Modified entity
      changes.push({
        type: 'update',
        entity_id: id,
        snapshot_content: afterEntity
      });
    }
  }
  
  // Detect deletions
  for (const [id] of beforeMap) {
    if (!afterMap.has(id)) {
      changes.push({
        type: 'delete',
        entity_id: id
      });
    }
  }
  
  return changes;
}
```

**File:** `packages/lix-plugin-md/src/applyChanges.ts`

```typescript
export function applyChanges(args: ApplyChangesArgs): ApplyChangesResult {
  const { changes, file } = args;
  
  // Convert state entities to AST entities
  const entities = changes.map(change => ({
    id: change.entity_id,
    ...JSON.parse(change.snapshot_content)
  }));
  
  // Reconstruct markdown from AST entities
  const markdown = astEntitiesToMarkdown(entities);
  const data = new TextEncoder().encode(markdown);
  
  return {
    id: file.id,
    path: file.path,
    data
  };
}
```

### Phase 2: Plate Integration Bridge

#### 2.1 Create Plate ↔ Markdown AST Bridge

**New File:** `packages/md-app/src/components/editor/lix-plate-bridge.ts`

```typescript
import { PlateEditor, TElement, TText } from '@udecode/plate-common';
import { Root, Node } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

export interface PlateToAstOptions {
  preserveIds?: boolean;
  idPrefix?: string;
}

export interface AstToPlateOptions {
  editorId?: string;
}

// Convert Plate value directly to lix entities using existing node IDs
export function plateValueToEntities(plateValue: TElement[]): LixEntity[] {
  const entities: LixEntity[] = [];
  
  function processNode(node: TElement | TText, parentId?: string): void {
    // Skip text nodes - they'll be included as values in parent entities
    if ('text' in node) return;
    
    // Use existing Plate node ID or generate one if missing
    const entityId = node.id || nanoid(10);
    
    // Extract text content from children
    const textContent = node.children
      ?.filter(child => 'text' in child)
      ?.map(child => (child as TText).text)
      ?.join('') || '';
    
    // Create entity from Plate node
    const entity: LixEntity = {
      id: entityId,
      type: mapPlateTypeToAst(node.type),
      value: textContent || undefined,
      children: node.children
        ?.filter(child => !('text' in child))
        ?.map(child => (child as TElement).id || nanoid(10)),
      attributes: extractPlateAttributes(node),
      position: undefined // Will be calculated during serialization
    };
    
    entities.push(entity);
    
    // Process child elements recursively
    node.children?.forEach(child => {
      if (!('text' in child)) {
        processNode(child as TElement, entityId);
      }
    });
  }
  
  plateValue.forEach(node => processNode(node));
  return entities;
}

// Convert lix entities back to Plate value maintaining node IDs
export function entitiesToPlateValue(entities: LixEntity[]): TElement[] {
  // Build entity lookup map
  const entityMap = new Map(entities.map(entity => [entity.id, entity]));
  
  // Find root-level entities (those not referenced as children)
  const allChildIds = new Set(
    entities.flatMap(entity => entity.children || [])
  );
  const rootEntities = entities.filter(entity => !allChildIds.has(entity.id));
  
  // Convert entities to Plate nodes
  function entityToPlateNode(entity: LixEntity): TElement {
    const plateType = mapAstTypeToPlate(entity.type);
    
    const plateNode: TElement = {
      id: entity.id, // Preserve entity ID as Plate node ID
      type: plateType,
      children: []
    };
    
    // Apply attributes
    applyAttributesToPlateNode(plateNode, entity.attributes);
    
    // Add text content as text node children
    if (entity.value) {
      plateNode.children.push({ text: entity.value });
    }
    
    // Add child element nodes
    if (entity.children) {
      const childElements = entity.children
        .map(childId => entityMap.get(childId))
        .filter(Boolean)
        .map(childEntity => entityToPlateNode(childEntity!));
      
      plateNode.children.push(...childElements);
    }
    
    return plateNode;
  }
  
  return rootEntities.map(entity => entityToPlateNode(entity));
}

function convertPlateNodeToAst(node: TElement | TText, preserveIds: boolean, idPrefix: string): Node {
  // Handle text nodes
  if ('text' in node) {
    return {
      type: 'text',
      value: node.text
    };
  }
  
  // Handle element nodes
  const astNode: any = {
    type: mapPlateTypeToAst(node.type)
  };
  
  // Preserve or generate ID
  if (preserveIds && node.id) {
    astNode.data = astNode.data || {};
    astNode.data.id = node.id;
  }
  
  // Handle attributes
  if (node.type === 'h1' || node.type === 'h2' || node.type === 'h3' || node.type === 'h4' || node.type === 'h5' || node.type === 'h6') {
    astNode.depth = parseInt(node.type.slice(1));
  }
  
  if (node.type === 'a') {
    astNode.url = node.url;
  }
  
  // Convert children
  if (node.children && node.children.length > 0) {
    astNode.children = node.children.map(child => convertPlateNodeToAst(child, preserveIds, idPrefix));
  }
  
  return astNode;
}

function convertAstNodeToPlate(node: Node): TElement | TText {
  // Handle text nodes
  if (node.type === 'text') {
    return {
      text: (node as any).value || ''
    };
  }
  
  // Handle element nodes
  const plateType = mapAstTypeToPlate(node.type);
  const plateNode: any = {
    type: plateType,
    children: []
  };
  
  // Extract ID from data
  if ((node as any).data?.id) {
    plateNode.id = (node as any).data.id;
  }
  
  // Handle specific node attributes
  if (node.type === 'heading') {
    plateNode.type = `h${(node as any).depth}`;
  }
  
  if (node.type === 'link') {
    plateNode.url = (node as any).url;
  }
  
  // Convert children
  if ('children' in node && node.children) {
    plateNode.children = node.children.map(child => convertAstNodeToPlate(child));
  }
  
  return plateNode;
}

function mapPlateTypeToAst(plateType: string): string {
  const typeMap: Record<string, string> = {
    'p': 'paragraph',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'ul': 'list',
    'ol': 'list',
    'li': 'listItem',
    'a': 'link',
    'strong': 'strong',
    'em': 'emphasis',
    'code': 'inlineCode',
    'blockquote': 'blockquote'
  };
  
  return typeMap[plateType] || plateType;
}

function mapAstTypeToPlate(astType: string): string {
  const typeMap: Record<string, string> = {
    'paragraph': 'p',
    'heading': 'h1', // Will be overridden by depth
    'list': 'ul',    // Will be overridden by ordered
    'listItem': 'li',
    'link': 'a',
    'strong': 'strong',
    'emphasis': 'em',
    'inlineCode': 'code',
    'blockquote': 'blockquote'
  };
  
  return typeMap[astType] || astType;
}

// Preserve IDs from existing AST when updating Plate content
export function preserveIdsFromAst(plateValue: TElement[], existingAst: Root): TElement[] {
  const idMap = new Map<string, string>();
  
  // Extract existing IDs from AST
  visit(existingAst, (node: Node) => {
    if ((node as any).data?.id) {
      const contentKey = generateContentKey(node);
      idMap.set(contentKey, (node as any).data.id);
    }
  });
  
  // Apply IDs to matching Plate nodes
  function applyIds(nodes: (TElement | TText)[]): (TElement | TText)[] {
    return nodes.map(node => {
      if ('text' in node) return node;
      
      const contentKey = generateContentKeyFromPlate(node);
      const existingId = idMap.get(contentKey);
      
      if (existingId) {
        node.id = existingId;
      }
      
      if (node.children) {
        node.children = applyIds(node.children);
      }
      
      return node;
    });
  }
  
  return applyIds(plateValue) as TElement[];
}

function generateContentKey(node: Node): string {
  // Generate a content-based key for matching nodes
  let key = node.type;
  if ('value' in node && node.value) key += ':' + node.value;
  if ('children' in node && node.children) key += ':' + node.children.length;
  return key;
}

function generateContentKeyFromPlate(node: TElement): string {
  let key = node.type;
  if (node.children) {
    const textContent = node.children
      .filter(child => 'text' in child)
      .map(child => (child as TText).text)
      .join('');
    if (textContent) key += ':' + textContent;
    key += ':' + node.children.length;
  }
  return key;
}
```

#### 2.2 Updated Plate Editor Integration

**File:** `packages/md-app/src/components/editor/plate-editor.tsx`

```typescript
import { useLixState } from '../hooks/use-lix-state';
import { plateValueToEntities, entitiesToPlateValue } from './lix-plate-bridge';

export function PlateEditor({ fileId }: { fileId: string }) {
  const { entities, updateEntities } = useLixState(fileId);
  const [plateValue, setPlateValue] = useState<TElement[]>([]);
  
  // Load plate value from lix entities
  useEffect(() => {
    if (entities.length > 0) {
      // Convert entities directly to Plate value, preserving IDs
      const newPlateValue = entitiesToPlateValue(entities.map(e => e.snapshot_content));
      setPlateValue(newPlateValue);
    }
  }, [entities]);
  
  // Handle Plate editor changes
  const handleValueChange = useCallback(
    debounce((newValue: TElement[]) => {
      try {
        // Convert Plate value directly to entities using existing Plate node IDs
        const newEntities = plateValueToEntities(newValue);
        
        // Update lix state with new entities
        updateEntities(newEntities);
      } catch (error) {
        console.error('Failed to sync Plate changes to lix state:', error);
      }
    }, 300),
    [entities, updateEntities]
  );
  
  return (
    <Plate
      value={plateValue}
      onChange={handleValueChange}
      plugins={[
        // ... existing plugins
      ]}
    />
  );
}
```

#### 2.3 Lix State Hook

**New File:** `packages/md-app/src/hooks/use-lix-state.ts`

```typescript
import { useEffect, useState, useCallback } from 'react';
import { useActiveLix } from './use-active-lix';

export interface LixEntity {
  entity_id: string;
  snapshot_content: any;
}

export function useLixState(fileId: string) {
  const lix = useActiveLix();
  const [entities, setEntities] = useState<LixEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load entities from lix state
  const loadEntities = useCallback(async () => {
    if (!lix) return;
    
    try {
      setIsLoading(true);
      const result = await lix.db
        .selectFrom('state')
        .select(['entity_id', 'snapshot_content'])
        .where('file_id', '=', fileId)
        .where('schema_key', '=', 'lix_plugin_md_block')
        .execute();
      
      const parsedEntities = result.map(row => ({
        entity_id: row.entity_id,
        snapshot_content: JSON.parse(row.snapshot_content as string)
      }));
      
      setEntities(parsedEntities);
    } catch (error) {
      console.error('Failed to load entities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lix, fileId]);
  
  // Update entities in lix state
  const updateEntities = useCallback(async (newEntities: any[]) => {
    if (!lix) return;
    
    try {
      // TODO: Implement proper change detection and batch updates
      // For now, replace all entities for the file
      
      // Delete existing entities
      await lix.db
        .deleteFrom('state')
        .where('file_id', '=', fileId)
        .where('schema_key', '=', 'lix_plugin_md_block')
        .execute();
      
      // Insert new entities
      if (newEntities.length > 0) {
        await lix.db
          .insertInto('state')
          .values(
            newEntities.map(entity => ({
              entity_id: entity.id,
              file_id: fileId,
              schema_key: 'lix_plugin_md_block',
              plugin_key: 'lix_plugin_md',
              snapshot_content: JSON.stringify(entity),
              schema_version: '1.0',
              version_id: 'main', // TODO: Get current version
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          )
          .execute();
      }
      
      // Reload entities to reflect changes
      await loadEntities();
    } catch (error) {
      console.error('Failed to update entities:', error);
    }
  }, [lix, fileId, loadEntities]);
  
  // Load entities on mount and when dependencies change
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);
  
  return {
    entities,
    updateEntities,
    isLoading,
    reload: loadEntities
  };
}
```

### Phase 3: Integration and Compatibility

#### 3.1 Seamless Integration

The enhanced system integrates seamlessly with existing infrastructure:

1. **Plugin API**: Same `detectChanges` and `applyChanges` interface
2. **File System**: Files are still materialized on demand via `file.data`
3. **Schema Enhancement**: Enhanced existing schema without version bumping
4. **Plate Compatibility**: Uses native Plate node IDs for perfect alignment

#### 3.2 Export Functionality

**File:** `packages/md-app/src/components/ui/export-toolbar-button.tsx`

```typescript
import { useLixState } from '../../hooks/use-lix-state';
import { astEntitiesToMarkdown } from '@lix-js/plugin-md';

export function ExportToolbarButton({ fileId }: { fileId: string }) {
  const { entities } = useLixState(fileId);
  
  const handleExport = useCallback(() => {
    try {
      // Convert entities directly to markdown
      const markdown = astEntitiesToMarkdown(entities.map(e => e.snapshot_content));
      
      // Create download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [entities]);
  
  return (
    <button onClick={handleExport}>
      Export Markdown
    </button>
  );
}
```

## Implementation Benefits

### 1. Performance Improvements
- **Eliminated Roundtrips**: Direct AST ↔ Plate conversion
- **Reduced Serialization**: No markdown string intermediates
- **Faster Sync**: Real-time entity updates

### 2. Data Consistency
- **Single Source of Truth**: Lix state contains authoritative data
- **Preserved IDs**: HTML comment IDs maintained throughout pipeline
- **Structural Integrity**: Full AST representation prevents data loss

### 3. Collaboration Features
- **Real-time Updates**: Entity-level change tracking
- **Conflict Resolution**: AST-based merge strategies
- **Version Control**: Built-in lix versioning support

### 4. Extensibility
- **Plugin Architecture**: Multiple editors can work with same document
- **Rich Formatting**: Full markdown feature support
- **Custom Extensions**: Easy to add new node types

## Testing Strategy

### 3.1 Updated E2E Test

The existing e2e test demonstrates the core functionality and will be updated to use the new AST schema:

```typescript
test("programmatically mutating entities should be reflected in the file and Plate editor", async () => {
  // Initialize with enhanced markdown plugin
  const lix = await openLix({
    providePlugins: [plugin],
  });

  // Insert markdown with Plate-compatible IDs (using nanoid format)
  const initialMarkdown = `<!-- id: V1StGXR8_Z -->
# Main Title

<!-- id: 3BqYGqeRws -->
This paragraph has **bold text** and [a link](https://example.com).`;

  await lix.db.insertInto("file").values({
    id: "file1",
    path: "/test.md",
    data: new TextEncoder().encode(initialMarkdown),
  }).execute();

  // Mutate heading entity using enhanced AST schema
  await lix.db.updateTable("state_by_version")
    .set({
      snapshot_content: JSON.stringify({
        id: "V1StGXR8_Z",
        type: "heading",
        value: "Updated Main Title",
        attributes: { depth: 1 }
      })
    })
    .where("entity_id", "=", "V1StGXR8_Z")
    .where("schema_key", "=", "lix_plugin_md_block")
    .execute();

  // Mutate paragraph entity
  await lix.db.updateTable("state_by_version")
    .set({
      snapshot_content: JSON.stringify({
        id: "3BqYGqeRws",
        type: "paragraph",
        value: "This paragraph has **updated bold text** and [a new link](https://updated.com)."
      })
    })
    .where("entity_id", "=", "3BqYGqeRws")
    .where("schema_key", "=", "lix_plugin_md_block")
    .execute();

  // Verify file reflects the changes
  const updatedFile = await lix.db
    .selectFrom("file")
    .where("path", "=", "/test.md")
    .selectAll()
    .executeTakeFirstOrThrow();

  const updatedMarkdown = new TextDecoder().decode(updatedFile.data);
  
  expect(updatedMarkdown).toContain("# Updated Main Title");
  expect(updatedMarkdown).toContain("**updated bold text**");
  expect(updatedMarkdown).toContain("[a new link](https://updated.com)");
  
  // Verify Plate editor would load with correct IDs
  const entities = await lix.db
    .selectFrom("state_by_version")
    .where("file_id", "=", "file1")
    .where("schema_key", "=", "lix_plugin_md_block")
    .select(["entity_id", "snapshot_content"])
    .execute();
    
  const plateValue = entitiesToPlateValue(entities.map(e => JSON.parse(e.snapshot_content)));
  
  // Verify that Plate nodes have the same IDs as entities
  expect(plateValue[0].id).toBe("V1StGXR8_Z");
  expect(plateValue[1].id).toBe("3BqYGqeRws");
});
```

### 3.2 Performance Benchmarks

Track performance improvements:
- **Plate Editor Load Time**: AST direct loading vs markdown parsing
- **Change Propagation**: Entity updates to editor reflection
- **Memory Usage**: AST storage vs string-based blocks
- **Collaborative Editing**: Multiple concurrent editors

## Migration Timeline

### Phase 1: Foundation (Week 1-2)
- Implement new AST schema
- Update lix-plugin-md parsing logic
- Create basic Plate bridge utilities

### Phase 2: Integration (Week 3-4)  
- Update md-app editor to use lix state
- Implement useLixState hook
- Add comprehensive test coverage

### Phase 3: Optimization (Week 5-6)
- Performance optimizations
- Advanced conflict resolution
- Production readiness testing

### Phase 4: Deployment (Week 7-8)
- Gradual rollout with feature flags
- Monitor performance metrics
- User feedback integration

## Risk Mitigation

### 1. Data Loss Prevention
- **Comprehensive Testing**: All existing workflows verified
- **Backup Strategy**: Automatic markdown export before migration
- **Rollback Plan**: Schema version fallback mechanism

### 2. Performance Monitoring
- **Metrics Collection**: Editor load times, change propagation speed
- **Memory Profiling**: AST storage efficiency
- **User Experience**: Latency measurements

### 3. Compatibility Issues
- **API Versioning**: Both schema versions supported
- **External Tools**: HTML comment IDs maintained
- **Plugin Ecosystem**: Backward compatibility preserved

## Key Benefits

**Perfect ID Alignment:**
- Plate node IDs = Entity IDs (no conversion needed)
- New paragraphs created in Plate automatically get nanoid(10) IDs
- Direct entity updates reflect immediately in editor

**Simplified Architecture:**
- No markdown AST intermediates
- Direct Plate ↔ Entity transformation
- Existing plugin infrastructure unchanged

**Enhanced Collaboration:**
- Real-time entity-level change tracking
- Structural editing with preserved relationships
- Multi-editor support on same document

## Update: MD-AST Integration Implementation

**Status:** ✅ **IMPLEMENTED** as of [current date]

The concepts outlined in this specification have been successfully implemented through direct MD-AST integration. See `md-ast-integration.md` for the actual implementation details.

**Key Implementation Highlights:**
- Direct MD-AST entity queries replace file-based loading
- Plate editor uses preserved mdast_id properties as node IDs
- Real-time sync between editor and lix state via `useMdAstState` hook
- Optimistic updates with conflict resolution
- Backward compatibility maintained for file export

**Performance Results:**
- Eliminated expensive file materialization roundtrips
- Stable ID preservation throughout edit operations
- Real-time entity-level change tracking
- Foundation for advanced collaboration features

## Conclusion

This specification provided the conceptual foundation for the actual MD-AST integration implementation. The core principle of using lix state as the single source of truth has been successfully realized through direct entity manipulation rather than enhanced file-based schemas.

The implemented solution demonstrates that treating lix entities as the authoritative document representation, combined with proper ID preservation, creates a robust foundation for real-time collaborative editing while maintaining full compatibility with the existing lix-plugin-md infrastructure.