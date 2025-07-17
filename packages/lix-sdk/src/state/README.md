# State Architecture

## Overview

The Lix state system manages all entity changes through a [SQLite virtual table](https://www.sqlite.org/vtab.html). This virtual table serves as the single entry point for all mutations, ensuring consistent change tracking, changeset creation, and state persistence.

## State Mutation Flow

All state mutations flow through a SQLite virtual table that orchestrates the three-stage lifecycle:

```
     User SQL Operations
            │
            v
    ┌─────────────────────┐
    │ State Virtual Table │  <── Entry point for ALL mutations
    └───────┬─────────────┘
            │
            v
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    MUTATION     │ --> │   TRANSACTION    │ --> │     COMMIT      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        v                        v                         v
   Validate & Track        Group Changes           Persist to
      Changes              in Changesets          SQLite Tables
```

The virtual table:

- Intercepts INSERT, UPDATE, and DELETE operations
- Tracks every change for audit and history
- Groups related changes into changesets during transactions
- Delegates to regular SQLite tables for actual storage

### Stage Characteristics

#### 1. MUTATION Stage

- **Purpose**: Handle individual state changes
- **Scope**: Single entity operation
- **Storage**: None (passes through)
- **Rollback**: Not applicable

#### 2. TRANSACTION Stage

- **Purpose**: Accumulate multiple mutations
- **Scope**: Multiple entities, single version
- **Storage**: Temporary (`internal_change_in_transaction`)
- **Rollback**: Automatic on error or explicit rollback

#### 3. COMMIT Stage

- **Purpose**: Persist changes permanently
- **Scope**: All pending changes across versions
- **Storage**: Permanent (`internal_change`, `internal_snapshot`)
- **Rollback**: Not possible after commit

## Virtual Table Architecture

The virtual table acts as a facade over the actual storage mechanism:

```
┌─────────────────────────────────────────────────┐
│              User SQL Queries                   │
│  (SELECT, INSERT, UPDATE, DELETE on entities)   │
└─────────────────────┬───────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────┐
│           State Virtual Table                   │
│                                                 │
│  • Intercepts all operations                    │
│  • Maintains change history                     │
│  • Ensures transactional consistency            │
│  • Manages cache coherency                      │
└─────────────────────┬───────────────────────────┘
                      │
                      v
┌─────────────────────────────────────────────────┐
│         Regular SQLite Tables                   │
│                                                 │
│  • internal_change_in_transaction               │
│  • internal_state_cache                         │
│  • internal_change                              │
│  • internal_snapshot                            │
└─────────────────────────────────────────────────┘
```

The virtual table provides:

- **Transparent change tracking** - Users work with entities naturally while all changes are tracked
- **ACID guarantees** - Leverages SQLite's transactional properties
- **Performance optimization** - Maintains caches and indexes automatically
- **Version isolation** - Each version sees its own consistent view of the data
