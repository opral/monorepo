# Architecture

This document explains Lix's technical design, state materialisation algorithm, and data model constraints. For a practical operational guide, see [How Lix Works](/docs/how-lix-works).

## Data Structures

Lix represents all data through four fundamental concepts that build upon each other:

1. **Change** – the atomic unit of modification
2. **Change set** – groups related changes together
3. **Commit** – forms a graph of change sets that define state
4. **Version** – points to a specific state by referencing a commit

```mermaid
graph RL
    subgraph Change
        direction TB
        C1["c1: name=Sam"]:::change
        C2["c2: email=sam@lix.dev"]:::change
    end

    subgraph ChangeSet
        CS["cs42"]:::changeset
    end

    subgraph Commit
        CM["commit a1"]:::commit
    end

    subgraph Version
        V["version main"]:::version
    end

    CS --> C1
    CS --> C2
    CM --> CS
    V --> CM

    classDef change fill:#f8bbd0,stroke:#c2185b,color:#000;
    classDef changeset fill:#bbdefb,stroke:#1976d2,color:#000;
    classDef commit fill:#c8e6c9,stroke:#388e3c,color:#000;
    classDef version fill:#fff9c4,stroke:#fbc02d,color:#000;
```

In this example, two changes (`c1`, `c2`) serve as atomic units—enabling fine-grained diffing and cherry-picking—while the change set `cs42` groups them together, signaling they belong together while preserving their individual atomicity. The commit `a1` materializes this change set into state, forming a point in time that can be referenced, traversed, and compared. The version `main` acts as a named pointer to this commit, defining what state is currently visible.

## The Commit Graph

State is expressed by the commit graph. Each commit packages a change set and links to parent commits, forming a directed acyclic graph (DAG) that records how state evolved over time.

### Graph Structure

```mermaid
graph RL
    %% Commits
    C4["Commit z2\n{c7,c8}"] --> C2["Commit x1\n{c3,c4}"]
    C3["Commit y2\n{c5,c6}"] --> C2
    C2 --> C1["Commit r0\n{c1,c2}"]

    %% Versions
    V1["Version: main"] -.-> C3
    V2["Version: feature-x"] -.-> C4
    V3["Version: experiment"] -.-> C2

    style V1 fill:#e1f5fe
    style V2 fill:#f3e5f5
    style V3 fill:#e8f5e9
```

**Key properties:**

- The graph is global—all versions share the same commit graph
- Versions are named pointers into the graph
- Moving a version pointer changes which commit's state is visible
- Any version can walk parent commits to understand how another version reached its state

### Divergent Versions

Multiple versions can point at different commits, creating divergent histories that remain isolated until merged.

```mermaid
graph RL
    CS3["{c5, c6}"] --> CS2["{c3, c4}"] --> CS1["{c1, c2}"]
    CS4["{c7, c8}"] --> CS2

    C3["Commit m2"] --> C2["Commit m1"] --> C1["Commit m0"]
    C4["Commit n2"] --> C2

    V1["Version A"] -.-> C3
    V2["Version B"] -.-> C4
```

Here, Versions A and B share commit `m1` and then diverge. Each version maintains its own pointer until changes are reviewed and merged.

### Historical Queries

Any commit in the DAG can be materialized, even if no version currently points at it. This enables querying historical state.

```mermaid
graph RL
    C3["Commit m2"] --> C2["Commit m1"] --> C1["Commit m0"]
    V["Version"] -.-> C3
    H["Historical Query"] -.-> C2
```

Inspecting history means selecting a commit and rehydrating the state that existed there. The `file_history` and `state_history` views use `lixcol_root_commit_id` to walk backwards from any commit.

## State Materialisation

Lix does not persist full snapshots. Instead it stores:

- Raw changes with their payload
- Membership of each change in a change set
- Commits that materialize change sets and point to parents
- A lightweight pointer from each version to its tip commit (plus the working commit used for drafts)

When you request state, the engine walks the commit graph, gathers the change sets that are reachable from the target commit, and applies the newest change for every entity. The traversal is cached internally so queries stay fast without materializing full snapshots.

```mermaid
graph RL
    C0["Commit m0"] --> C1["Commit m1"] --> C2["Commit m2"]
    V["Version"] -.-> C2
```

### Materialisation Algorithm

Conceptually, materialisation follows three steps:

1. Collect every change set reachable from the target commit
2. Take the union of the underlying changes along that path
3. Select the leaf change per entity/schema/file so only the most recent edit survives

Consider this example with two entities (`e1`, `e2`). The lineage of change sets might look like this:

```mermaid
graph RL
    CS3["CS3 { e2: 'gunther' }"] --> CS2["CS2 { e1: 'julia' }"] --> CS1["CS1 { e1: 'benn' }"]
```

**Step 1:** The union of all change sets in the lineage is taken:

```
CS1 ∪ CS2 ∪ CS3 = { e1: "benn", e1: "julia", e2: "gunther" }
```

**Step 2:** Filter for leaf changes, which are the latest changes for each entity:
- For `e1`, the latest change is `"julia"` from `CS2`
- For `e2`, the latest change is `"gunther"` from `CS3`

**Step 3:** The resulting state is:

```
State = { e1: "julia", e2: "gunther" }
```

### Performance Characteristics

**Cache behavior:**
- The engine caches commit graph traversals internally
- Repeated queries to the same version are fast
- No need to materialize full snapshots on disk

**Trade-offs:**
- First query to a version requires graph traversal
- Subsequent queries benefit from cached traversal
- Storage efficient—only changes are stored, not full snapshots
- Query performance scales with graph depth, not total data size

## Constraints and Design Decisions

### Foreign Keys

Lix supports foreign key constraints to maintain referential integrity between entities.

For simplicity, Lix only allows foreign keys on entities in the same version scope, with the exception of references to changes themselves. This avoids cascading effects across versions and acknowledges that changes are versionless—they live outside the version system as the immutable source of truth tracked by commits.

| Rule                                                  | Rationale                                                                        | Engine behaviour                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **1. Version‑scoped → change**                        | Changes live outside any version, so the reference is valid across all versions. | Validator skips the `version_id = ?` check when the target schema is `lix_change`. |
| **2. Version‑scoped → version‑scoped (same version)** | Keeps each version self‑contained and makes deletes cheap.                       | Current logic stands: both rows must share the same `version_id`.                  |
| **3. Change → version‑scoped**                        | Would immediately violate Rule 2.                                                | Disallowed at schema‑registration time.                                            |

> **Result:** An entity or comment lives inside a specific version, but can freely point at any `lix_change.id` without special handling. System metadata like commits and change-set elements stay in the global scope and follow the same rules when they reference `lix_change`.

### Version Isolation

Versions are isolated by design:

- Each version sees only its own entities plus inherited state from parent commits
- Changes in one version don't affect other versions until merged
- Deletions in a version are cheap—no cascade across versions needed
- Enables safe parallel development without conflicts

## Integration Points

### How Plugins Integrate

Plugins produce changes that feed into this architecture:

1. Plugin's `detectChanges` returns `DetectedChange[]`
2. Engine creates `change` records with entity snapshots
3. Changes are grouped into a change set
4. Change set is committed to the commit graph
5. Version pointer updated to new commit

Plugins don't need to understand commits, versions, or the graph—they just report entity-level changes.

### Query Interface

The engine exposes this architecture through SQL views:

- `file`, `state` - Current state at active version's commit
- `file_history`, `state_history` - Historical states via graph traversal
- `change` - Individual change records
- `commit` - Commit graph nodes
- `version` - Named pointers into the graph

Applications query these views without needing to understand state materialisation or graph traversal—the engine handles that complexity.

## Next Steps

- **[How Lix Works](/docs/how-lix-works)** - Practical guide to using Lix and understanding operational mechanics
- **[Plugins](/docs/plugins)** - Learn how to build plugins that integrate with this architecture
- **[Data Model](/docs/data-model)** - Understand entities, schemas, and how they relate to this architecture
