# Comparison to Git

> [!INFO]
> Lix is not a git replacement, nor is it designed for software engineering. The goal is to enable change-related workflows like CI/CD, open source, or AI agents in industries other than software engineering.

Traditional version control systems like Git are designed for text files and source code. While Git excels at tracking code, it falls short for structured data, binary formats, and embedded application use:

| Aspect | Git | Lix |
|--------|-----|-----|
| **Change Granularity** | Line-based | Entity-based (semantic) |
| **Data Understanding** | Opaque text | Format-aware via plugins |
| **Query Interface** | CLI commands | SQL queries |
| **Runtime** | Separate tool | Embedded JavaScript SDK |
| **Persistence** | `.git` directory | Portable `.lix` blob (SQLite) |
| **Primary Use Case** | Source code | Structured data + AI agents |

## Why Git Falls Short for Structured Data

**Line-by-line diffing loses semantic meaning:**
Git sees line changes without understanding the data structure. In JSON, CSV, or databases, this makes it hard to track *what* actually changed semantically.

**No support for binary formats:**
Excel, design files, and PDFs are opaque blobs to Git—you can't query "what changed in cell C45?"

**Not designed to run inside applications:**
Git is a CLI tool, not an SDK. There's no way to embed Git in a browser app, query change history with SQL, or build custom workflows programmatically.

## What Makes Lix Different

**1. Entity-Level Change Tracking**

Lix tracks changes at an [entity level](/docs/data-model), not text lines. This makes Lix semantically aware of *what* changes:

- **JSON**: Each property path is an entity (`/sku_124/price`)
- **CSV**: Each row is an entity
- **Markdown**: Paragraphs, headings, code blocks are entities

This enables fine-grained diffs, precise commenting at the entity level, and smart merging when different entities on the same line change.

**2. Embedded JavaScript SDK**

Lix runs *inside* your application—in browsers, Node.js, or Web Workers. The portable `.lix` blob format (SQLite binary) can be stored anywhere:

- Browser OPFS (persistent, non-blocking)
- Node.js filesystem
- Object storage (S3, GCS)
- Database columns (Postgres bytea)
- In-memory for tests

**3. SQL Query Engine**

Query changes programmatically instead of parsing CLI output:

```typescript
// Time-travel: query file state history
const history = await lix.db
  .selectFrom("file_state_history")
  .where("file_id", "=", "catalog.json")
  .orderBy("lixcol_depth", "asc")
  .execute();

// Attribution: who changed what in a file
const changes = await lix.db
  .selectFrom("change")
  .innerJoin("account", "change.author_id", "account.id")
  .where("change.file_id", "=", "catalog.json")
  .where("change.entity_id", "=", "/sku_124/price")
  .execute();

// Cross-version file comparison
const diff = await lix.db
  .selectFrom("file_state as v1")
  .innerJoin("file_state as v2", "v1.file_id", "v2.file_id")
  .where("v1.lixcol_version_id", "=", versionA)
  .where("v2.lixcol_version_id", "=", versionB)
  .where("v1.file_id", "=", "catalog.json")
  .execute();
```

**4. Plugin System for Any Format**

Plugins teach Lix to understand file formats by defining:
- What constitutes an entity (a cell, a row, a JSON path)
- How to detect changes between versions
- How to serialize entities back to the original format

Official plugins support JSON, CSV, and Markdown. Custom plugins can handle Excel, design files, or proprietary formats.

**5. Built for AI Agents**

Lix enables safe, auditable AI workflows:

- **Sandboxed experimentation**: Agents work in isolated [versions](/docs/versions) without touching production
- **Structured diffs**: Agents can query exactly what they changed and self-correct
- **Human approval gates**: [Change proposals](/docs/change-proposals) require review before merging
- **Full audit trails**: Every change is attributed to a specific agent or human with timestamps
- **Parallel testing**: Run competing agents in separate versions, compare results, promote the winner

**6. On-Demand State Materialization**

Unlike Git's full snapshots, Lix stores only raw changes and materializes state on-demand:
1. Collect reachable change sets from target commit
2. Take union of all underlying changes
3. Select latest change per entity

This reduces storage footprint while maintaining fast query performance through internal caching.

## Git vs Lix (real diff output)

Git shows line replacements, which is noisy for structured data:

```diff
{
  "sku_123": { "price": 100, "name": "Red Chair" },
-  "sku_124": { "price": 200, "name": "Blue Sofa" }
+  "sku_124": { "price": 250, "name": "Blue Sofa" }
}
```

Why this hurts:
- Hard to query: you can't easily answer "who changed `price` on `sku_124`?"—it's just line churn.
- Merge pain: splitting JSON across lines creates frequent conflicts when multiple editors touch nearby fields.
- No semantics: Git cannot tell if the line move is a rename, a deletion, or just reformatting.

Lix diff rows are structured (real shape from `selectVersionDiff` / `selectWorkingDiff` with snapshots joined from the `change` table). The built-in JSON plugin emits one entity per JSON Pointer, so a price change is reported like this:

```json
{
  "entity_id": "/sku_124/price",
  "schema_key": "plugin_json_pointer_value",
  "file_id": "catalog.json",
  "status": "modified",
  "before_change_id": "chg_price_200",
  "after_change_id": "chg_price_250",
  "before_snapshot": { "path": "/sku_124/price", "value": 200 },
  "after_snapshot": { "path": "/sku_124/price", "value": 250 }
}
```

Because Lix diffs carry entity IDs, schema keys, and before/after snapshots, review UIs can highlight just the changed field and keep JSON valid, instead of showing raw line noise.
