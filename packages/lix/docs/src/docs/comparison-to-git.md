# Comparison to Git

**Lix is not a Git replacement.** It's designed for files other than source code and built to be embedded in applications.

The fundamental difference between Git and Lix:

- **Git**: "line 5 changed"
- **Lix**: "price changed from $10 to $12"

Git tracks text line-by-line. Lix is schema-aware - it understands data structure. This means tracking specific fields (price, email, status) instead of arbitrary line numbers.

| Git              | Lix                          |
| :--------------- | :--------------------------- |
| Line-based diffs | Schema-aware change tracking |
| CLI tool         | Embeddable SDK               |
| Text files       | Any file format via plugins  |

## When to Use Git vs Lix

**Use Git for source code.** Git is purpose-built for software engineering and developer workflows.

**Use Lix for everything else.** Applications that need change control for structured data, non-code files, or embedded change control.

## Key Differences

### 1. Schema-Aware Change Tracking

**Git** tracks changes line-by-line without understanding data structure. A JSON property change appears as "line 5 modified" with no semantic context.

**Lix** is schema-aware. It can track:

- **JSON**: Individual properties (`/product/price` changed from $10 to $12)
- **CSV**: Specific cells or rows
- **Excel**: Individual cells with row/column context

This enables:

- **Precise diffs**: "price field changed from $10 to $12" instead of line numbers
- **Granular queries**: SQL queries like "show all email changes in the last week"
- **Smarter conflict resolution**: Schema-aware merging reduces conflicts

```typescript
// Query history of a single JSON property
const priceHistory = await lix.db
  .selectFrom("state_history")
  .innerJoin(
    "change_author",
    "change_author.change_id",
    "state_history.change_id",
  )
  .innerJoin("account", "account.id", "change_author.account_id")
  .where("entity_id", "=", "/sku_124/price")
  .where("schema_key", "=", "plugin_json_pointer_value")
  .orderBy("lixcol_depth", "asc") // depth 0 = current
  .select([
    "state_history.change_id",
    "state_history.snapshot_content", // { value: 250 }
    "account.display_name",
  ])
  .execute();
```

### 2. Plugin System for Any File Format

**Git** treats binary files as opaque blobs. You can't query "what changed in cell C45?" for Excel or "which layer was modified?" for design files.

**Lix** uses plugins to understand file formats. Each plugin defines:

- What constitutes a trackable unit (a cell, a row, a JSON property)
- How to detect changes between versions
- How to reconstruct files from changes

Plugins can handle JSON, CSV, Excel, PDFs, design files, or proprietary formats.

### 3. Embeddable with SQL Queries

**Git** is an external CLI tool. Integrating it into applications requires shelling out to commands and parsing text output.

**Lix** is an embeddable JavaScript library that runs directly in your application:

- **Runs anywhere**: Browsers, Node.js, edge functions, Web Workers
- **SQL queries**: Query change history programmatically instead of parsing CLI output
- **Portable storage**: `.lix` files (SQLite) can be stored in OPFS, S3, database columns, or in-memory

```typescript
// Time-travel: query file history from a specific commit
const history = await lix.db
  .selectFrom("file_history")
  .where("path", "=", "/catalog.json")
  .where("lixcol_root_commit_id", "=", versionCommit)
  .orderBy("lixcol_depth", "asc")
  .execute();

// Cross-version file comparison
const diff = await lix.db
  .selectFrom("file_history as v1")
  .innerJoin("file_history as v2", "v1.id", "v2.id")
  .where("v1.lixcol_root_commit_id", "=", versionACommit)
  .where("v2.lixcol_root_commit_id", "=", versionBCommit)
  .where("v1.lixcol_depth", "=", 0)
  .where("v2.lixcol_depth", "=", 0)
  .select(["v1.path", "v1.data as versionAData", "v2.data as versionBData"])
  .execute();
```
