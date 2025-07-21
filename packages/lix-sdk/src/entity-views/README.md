# Entity Views

## Overview

Entity views are SQL views that provide a typed, structured interface over the underlying `state` table. They transform the generic state storage into domain-specific entity tables, making it easy to work with entities using standard SQL operations while maintaining version control and change tracking.

## Architecture

Entity views are "merely a view over the state table" - they don't store any data themselves but provide a convenient interface:

```
┌─────────────────────────────────────────────────┐
│             User SQL Queries                    │
│   (SELECT, INSERT, UPDATE, DELETE on entities)  │
└─────────────────────┬───────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────┐
│              Entity Views                       │
│                                                 │
│  • Extract JSON properties as columns           │
│  • Add operational metadata (lixcol_*)          │
│  • Provide CRUD operations via triggers         │
└─────────────────────┬───────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────┐
│          State Virtual Table                    │
│                                                 │
│  • Generic entity storage                       │
│  • Version control                              │
│  • Change tracking                              │
└─────────────────────────────────────────────────┘
```

## Example: Views as Filters

Entity views are essentially filters over the generic state table. Here's how it works:

### What's in the state_all table

```sql
state_all:
┌─────────────┬─────────────────┬──────────┬───────────────────────────────────┐
│ entity_id   │ schema_key      │ file_id  │ snapshot_content                  │
├─────────────┼─────────────────┼──────────┼───────────────────────────────────┤
│ greeting    │ lix:key_value   │ file1    │ {"key":"greeting","value":"hello"}│
│ farewell    │ lix:key_value   │ file1    │ {"key":"farewell","value":"bye"}  │
│ user123     │ lix:account     │ lix      │ {"id":"user123","name":"Alice"}   │
│ config1     │ lix:key_value   │ file2    │ {"key":"config1","value":"true"}  │
└─────────────┴─────────────────┴──────────┴───────────────────────────────────┘
```

### What the key_value view returns

```sql
SELECT * FROM key_value;

┌──────────┬───────┬─────────────────┬──────────────────┐
│ key      │ value │ lixcol_file_id  │ lixcol_change_id │
├──────────┼───────┼─────────────────┼──────────────────┤
│ greeting │ hello │ file1           │ change-123       │
│ farewell │ bye   │ file1           │ change-124       │
│ config1  │ true  │ file2           │ change-125       │
└──────────┴───────┴─────────────────┴──────────────────┘
```

The view:

- **Filters** rows where `schema_key = 'lix:key_value'`
- **Extracts** JSON properties (`key`, `value`) as columns
- **Excludes** entities with different schemas (like `lix:account`)
- **Adds** operational columns prefixed with `lixcol_`

## Three Types of Entity Views

For each entity schema, three views are created:

### 1. Primary View (e.g., `key_value`)

- **Purpose**: Work with entities in the active version only
- **Based on**: `state` view (filtered to current version)
- **Features**:
  - Hides `lixcol_version_id` to prevent cross-version accidents
  - Full CRUD support via INSTEAD OF triggers
  - Most commonly used for application logic

### 2. All-Versions View (e.g., `key_value_all`)

- **Purpose**: Work with entities across all versions
- **Based on**: `state_all` virtual table
- **Features**:
  - Exposes `lixcol_version_id` for version-specific queries
  - Full CRUD support with explicit version control
  - Used for cross-version operations and migrations

### 3. History View (e.g., `key_value_history`)

- **Purpose**: Read historical states and track changes
- **Based on**: `state_history` table
- **Features**:
  - Read-only (no CRUD triggers)
  - Includes depth information for blame functionality
  - Used for audit trails and debugging

## How Entity Views Work

### JSON Property Extraction

Entity properties are stored as JSON in the state table's `snapshot_content` column. Views extract these as proper columns:

```sql
-- State table stores generic JSON
snapshot_content: {"value": "hello", "description": "greeting"}

-- Entity view exposes as columns
SELECT value, description FROM key_value
-- Returns: value='hello', description='greeting'
```

### Operational Columns (lixcol\_\*)

Entity views add metadata columns prefixed with `lixcol_`:

- `lixcol_file_id` - Links entity to a file
- `lixcol_created_at` - When entity was created in this version
- `lixcol_updated_at` - When entity was last updated in this version
- `lixcol_change_id` - Links to the change that created/modified the entity
- `lixcol_untracked` - Bypasses change tracking (for UI state)
- `lixcol_inherited_from_version_id` - Tracks entity lineage across branches
- `lixcol_version_id` - Version ID (only in `_all` views)

### INSTEAD OF Triggers

Entity views use SQLite's INSTEAD OF triggers to intercept CRUD operations and redirect them to the state table:

```sql
-- User writes to entity view
INSERT INTO key_value (key, value) VALUES ('greeting', 'hello')

-- Trigger converts to state table operation
INSERT INTO state_all (
  entity_id: 'greeting',
  schema_key: 'lix:key_value',
  snapshot_content: '{"key": "greeting", "value": "hello"}'
  -- ... other metadata
)
```

## Type Safety

The TypeScript type system ensures compile-time safety:

```typescript
// Schema definition
type KeyValue = {
	key: string;
	value: string;
	description?: string;
};

// Generated types for queries
type KeyValueRow = State<KeyValue>; // For SELECT from key_value
type NewKeyValueRow = NewState<KeyValue>; // For INSERT into key_value
```

## Usage Examples

### Working with Active Version

```sql
-- Insert a new entity (goes through state virtual table)
INSERT INTO key_value (key, value) VALUES ('greeting', 'hello');

-- Update an entity
UPDATE key_value SET value = 'hi' WHERE key = 'greeting';

-- Delete an entity
DELETE FROM key_value WHERE key = 'greeting';

-- Query entities
SELECT * FROM key_value WHERE value LIKE 'h%';
```

### Working Across Versions

```sql
-- Query specific version
SELECT * FROM key_value_all WHERE lixcol_version_id = 'version-123';

-- Insert into specific version
INSERT INTO key_value_all (key, value, lixcol_version_id)
VALUES ('greeting', 'hello', 'version-123');
```

### Viewing History

```sql
-- See all historical states of an entity
SELECT * FROM key_value_history WHERE key = 'greeting' ORDER BY depth;

-- Find who changed an entity
SELECT * FROM key_value_history
WHERE key = 'greeting' AND lixcol_change_id IS NOT NULL;
```

## Benefits

1. **Natural SQL Interface** - Work with entities using familiar SQL
2. **Type Safety** - Full TypeScript types for all operations
3. **Version Control** - Built-in branching and merging support
4. **Change Tracking** - Automatic audit trail for all modifications
5. **Performance** - Leverages SQLite's query optimizer
6. **Flexibility** - JSON storage allows schema evolution
