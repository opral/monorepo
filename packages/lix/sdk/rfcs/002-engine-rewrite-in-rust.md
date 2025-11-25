# Implement the Lix Engine in Rust

## Summary

[RFC 001](./001-preprocess-writes.md) proposes extending the SQL preprocessor to handle writes. This RFC proposes implementing the **Lix Engine** - the core layer responsible for SQL preprocessing, validation, and rewriting - in Rust.

## Goals

1. **Leverage existing Rust libraries** - Rust has production-grade SQL parsers (`sqlparser-rs`), CEL evaluators (`cel-rust`), and JSON Schema validators that don't exist in JS. Our custom JS SQL parser is fragile and limited.

2. **Portable engine for multi-language bindings** - A Rust engine can be exposed to JS (NAPI-RS, WASM), Python (PyO3), and other languages. Implementing in Rust now means the core is written once.

## Non-Goals

- **Deviate from SQLite dialect** - SQLite is the target for now. While `sqlparser-rs` supports multiple dialects, the initial implementation strictly targets SQLite.

## Context

RFC 001 establishes that:

1. Lix is moving to a preprocessor-driven architecture that rewrites SQL against virtual tables into SQL against physical tables.
2. The preprocessor must handle both reads and writes, including parsing SQL, extracting mutations, validating schemas/constraints, and emitting optimized SQL.
3. A custom JS SQL parser is a source of fragility.

The question is: **implement this in JavaScript or Rust?**

## Proposal

Implement the Lix Engine in Rust.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SDK (JS/TS, Python, etc.)               │
│  - High-level API (openLix, lix.db.select, etc.)            │
│  - Owns SQLite connection (WASM or native)                  │
│  - Provides execute callback to engine                      │
└─────────────────────────────┬───────────────────────────────┘
                              │ engine.execute(sql, params)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Engine (Rust)                           │
│  - SQL parsing & rewriting (sqlparser-rs)                   │
│  - Schema validation (JSON Schema, CEL)                     │
│  - Calls host.execute(sql) via callback                     │
│  - Calls host.detectChanges() for plugins                   │
└─────────────────────────────┬───────────────────────────────┘
                              │ callback: host.execute(sql)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 SQL Database (SQLite)                       │
│  - Physical storage                                         │
│  - Transaction management
|  - Index/query execution                                │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- SDK owns SQLite - no bundling concerns in the engine
- Engine controls flow - can run multiple queries internally via host callback
- Preprocessing is internal - SDK never sees intermediate SQL

### Engine API

From the SDK's perspective:

```typescript
const engine = createEngine({
	execute: (sql: string, params: unknown[]) => sqlite.exec(sql, params),
	detectChanges: (pluginId: string, before: Uint8Array, after: Uint8Array) =>
		plugin.detectChanges({ before, after }),
});

const result = engine.execute("INSERT INTO messages ...", [params]);
```

The Rust engine exposes bindings via:

- **NAPI-RS** for Node.js (native addon)
- **WASM** for browser environments
- **C FFI** for other languages (Python via PyO3, etc.)

### Implementation

The engine uses these Rust libraries:

#### 1. SQL Parsing - `sqlparser-rs`

```rust
use sqlparser::dialect::SQLiteDialect;
use sqlparser::parser::Parser;

let dialect = SQLiteDialect {};
let statements = Parser::parse_sql(&dialect, sql)?;

for statement in statements {
    match statement {
        Statement::Query(query) => { /* rewrite SELECT */ }
        Statement::Insert(_) => { /* rewrite INSERT */ }
        Statement::Update(_) => { /* rewrite UPDATE */ }
        Statement::Delete(_) => { /* rewrite DELETE */ }
        other => { /* passthrough PRAGMA, etc. */ }
    }
}
```

#### 2. CEL Validation - `cel-rust`

```rust
use cel_interpreter::{Context, Program};

let program = Program::compile("data.amount > 0 && data.amount < 1000")?;
let mut context = Context::default();
context.add_variable("data", row_data);
let result = program.execute(&context)?;
```

#### 3. JSON Schema Validation - `jsonschema`

```rust
use jsonschema::JSONSchema;

let schema = serde_json::from_str(schema_json)?;
let compiled = JSONSchema::compile(&schema)?;
compiled.validate(&row_data)?;
```

#### 4. Host Plugin Callbacks

```rust
pub trait HostBindings {
    fn execute(&self, sql: &str, params: &[Value]) -> Result<Vec<Row>>;
    fn detect_changes(&self, plugin_id: &str, before: &[u8], after: &[u8]) -> Result<Vec<Change>>;
}

// During file mutations, call back to host for plugin logic
fn detect_file_changes(rows: &[MutationRow], host: &impl HostBindings) -> Result<Vec<Change>> {
    for row in rows.iter().filter(|r| r.schema_key == "lix_file") {
        let changes = host.detect_changes(&row.plugin_id, &row.before, &row.after)?;
        // ... collect changes
    }
}
```

### Pseudocode: Full Pipeline

```rust
pub fn execute(sql: &str, params: &[Value], host: &impl HostBindings) -> Result<Vec<Row>> {
    let statements = Parser::parse_sql(&SQLiteDialect {}, sql)?;

    for statement in statements {
        match statement {
            Statement::Insert(_) | Statement::Update(_) | Statement::Delete(_) => {
                // 1. Extract mutation details
                let mutation = extract_mutation(statement)?;

                // 2. Materialize rows (resolve subqueries via host.execute)
                let rows = materialize_rows(&mutation, host)?;

                // 3. Validate in-memory (JSON Schema + CEL)
                validate_rows(&rows, &schemas, &cel_env)?;

                // 4. Detect file changes via host plugin callback
                let plugin_changes = detect_file_changes(&rows, host)?;

                // 5. Rewrite to physical tables and execute
                let rewritten_sql = build_write_sql(&rows, &plugin_changes)?;
                host.execute(&rewritten_sql, &[])?;
            }
            Statement::Query(query) => {
                // Rewrite vtable references to physical tables
                let rewritten = rewrite_select(query)?;
                return host.execute(&rewritten.to_string(), params);
            }
            other => {
                // Passthrough (PRAGMA, etc.)
                return host.execute(&other.to_string(), params);
            }
        }
    }
}
```
