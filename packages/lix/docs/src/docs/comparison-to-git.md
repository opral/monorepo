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
// Time-travel: query file history from a specific commit
const history = await lix.db
  .selectFrom("file_history")
  .where("path", "=", "/catalog.json")
  .where(
    "lixcol_root_commit_id",
    "=",
    lix.db
      .selectFrom("active_version")
      .innerJoin("version", "active_version.version_id", "version.id")
      .select("version.commit_id")
  )
  .orderBy("lixcol_depth", "asc")
  .execute();

// Cross-version file comparison
const diff = await lix.db
  .selectFrom("file_history as v1")
  .innerJoin("file_history as v2", "v1.id", "v2.id")
  .where("v1.lixcol_root_commit_id", "=", versionACommit)
  .where("v1.lixcol_depth", "=", 0)
  .where("v2.lixcol_root_commit_id", "=", versionBCommit)
  .where("v2.lixcol_depth", "=", 0)
  .where("v1.path", "=", "/catalog.json")
  .select([
    "v1.path",
    "v1.data as versionAData",
    "v2.data as versionBData"
  ])
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

**6. SQL-Native Change Queries**

Lix keeps every change addressable through SQL, so you can:
- Query per-entity history (`state_history`) and per-file history (`file_history`) with depth-scoped filters
- Join changes with authors, labels, or conversations to build custom review/blame UIs
- Materialize just the entities you need instead of reconstructing whole files

The engine still stores raw changes and materializes state on demand, but the real benefit is the fine-grained querying surface that makes change data first-class.

## Git vs Lix (querying changes directly)

Instead of line churn, Lix lets you query exactly who changed what at the entity level:

```ts
// Blame-style history for one JSON property
const priceHistory = await lix.db
  .selectFrom("state_history")
  .innerJoin("change_author", "change_author.change_id", "state_history.change_id")
  .innerJoin("account", "account.id", "change_author.account_id")
  .where("entity_id", "=", "/sku_124/price")
  .where("schema_key", "=", "plugin_json_pointer_value")
  .where("lixcol_root_commit_id", "=", versionCommit)
  .orderBy("lixcol_depth", "asc") // depth 0 = current
  .select([
    "state_history.change_id",
    "state_history.snapshot_content",
    "state_history.lixcol_depth",
    "account.display_name"
  ])
  .execute();

// Shape you render (no line diff needed)
// [
//   { change_id: "chg_price_200", snapshot_content: { value: 200 }, lixcol_depth: 2, display_name: "Ari" },
//   { change_id: "chg_price_250", snapshot_content: { value: 250 }, lixcol_depth: 0, display_name: "Bea" }
// ]
```

You get depth-scoped history, per-entity granularity, and authors in one query—something line-based diffs can't provide.
