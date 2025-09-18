# Architecture

## Core Concepts

Lix represents all data through four fundamental concepts that build upon each other.

Changes are the atomic units, which are grouped in change sets, which form a graph, and the graph defines state. This simple hierarchy enables powerful features like [versioning](./versions.mdx) (branching), merging, and time-travel queries.

**Change** A single modification (e.g., `c1`).

```mermaid
graph LR
    C1["c1"]
```

**Change Set** A collection of related changes (e.g., `{c1, c2}`).

```mermaid
graph LR
    CS1["{c1, c2}"]
```

**Change Set Graph** Multiple change sets linked together showing evolution.

```mermaid
graph RL
    CSG2["{c3, c4}"] --> CSG1["{c1, c2}"]
```

**Version** A pointer to a specific change set in the graph.

```mermaid
graph RL
    CSG2["{c3, c4}"] --> CSG1["{c1, c2}"]
    V["Version"] -.-> CSG2
```

## Advanced Concepts

### Divergent Versions

Multiple versions can point to different change sets, creating divergent versions which can be merged later:

```mermaid
graph RL
    CS3["{c5, c6}"] --> CS2["{c3, c4}"] --> CS1["{c1, c2}"]
    CS4["{c7, c8}"] --> CS2
    V1["Version A"] -.-> CS3
    V2["Version B"] -.-> CS4
```

Here, Version A and Version B diverge after CS2, each with their own subsequent changes. This enables:

- Parallel development workflows
- Feature branches
- Experimental changes without affecting other versions

### Historical State

History in Lix is simply pointing to a specific change set in the graph and materializing the state up to that change set. Any change set in the graph can be queried, not just those pointed to by versions.

```mermaid
graph RL
    CS3["{c5, c6}"] --> CS2["{c3, c4}"] --> CS1["{c1, c2}"]
    V["Version"] -.-> CS3
    H["Historical Query"] -.-> CS2
```

In this example, the "Historical Query" points to change set `{c3, c4}`, allowing access to the exact state at that point in time, even though no version currently points there.

## On Demand State Materialization

Rather than storing state for every version and historical point, which would require large amounts of storage, Lix stores only the changes. State is then materialized on-demand in a cache by traversing the change set graph and applying the relevant changes.

This approach provides significant storage efficiency: instead of storing multiple complete copies of data, Lix stores each change only once. When state is needed (whether current or historical), it's computed by traversing the graph backward from a change set and applying all leaf changes in the lineage.

```mermaid
graph RL
    CSG2["{c3, c4}"] --> CSG1["{c1, c2}"]
    V["Version"] -.-> CSG2
```

### Materializing Logic

State materialization can be simplified to the process of taking the union of all change sets in the lineage and filtering for leaf changes. Leaf changes are the latest change for each entity, ensuring that only the most recent modifications are applied.

Consider this example with two entities (`e1`, `e2`). The lineage of change sets might look like this:

```mermaid
graph RL
    CS3["CS3 { e2: 'gunther' }"] --> CS2["CS2 { e1: 'julia' }"] --> CS1["CS1 { e1: 'benn' }"]
```

1. The union of all change sets in the lineage is taken:

   `CS1 ∪ CS2 ∪ CS3 = { e1: "benn", e1: "julia", e2: "gunther" }`

2. Filter for leaf changes, which are the latest changes for each entity:
   - For `e1`, the latest change is `"julia"` from `CS2`.
   - For `e2`, the latest change is `"gunther"` from `CS3`.

3. The resulting state is:

   `State = { e1: "julia", e2: "gunther" }`

### Transactions and commit path

During a transaction, Lix stages state mutations and then commits them in a single pass. The writer identity (`writer_key`) is carried through the pipeline — from the internal transaction staging table to the commit generator and into the materialized state — without per‑row lookups. This enables reliable attribution for echo suppression and external‑change detection. For usage patterns and pitfalls, see the Writer Key guide: [/guide/writer-key](/guide/writer-key).

## Global Change Set Graph

The change set graph in Lix is global and shared across all versions. By having a global graph, all versions share the same understanding of history—each version may have a different lineage, but they all agree on what that lineage contains. If the change set graph were version-scoped, versions couldn't agree on what the history of another version is.

```mermaid
graph RL
    %% Change sets in the global graph
    CS6["{c11, c12}"] --> CS4["{c7, c8}"]
    CS5["{c9, c10}"] --> CS3["{c5, c6}"]
    CS4 --> CS2["{c3, c4}"]
    CS3 --> CS2
    CS2 --> CS1["{c1, c2}"]

    %% Version pointers
    V1["Version: main"] -.-> CS5
    V2["Version: feature-x"] -.-> CS6
    V3["Version: experiment"] -.-> CS3

    %% Style the versions differently
    style V1 fill:#e1f5fe
    style V2 fill:#f3e5f5
    style V3 fill:#e8f5e9
```

In the global change set graph above:

- All versions can see and reference any change set
- Version "main" can query the history of Version "feature-x" by traversing from CS6
- Historical queries can point to any change set, even those not currently pointed to by a version (like CS4)

## Foreign Keys

Lix supports foreign key constraints to maintain referential integrity between entities.

For simplicity, Lix only allows foreign keys on entities in the same version scope, with the exception of references to changes themselves. This design choice avoids global cascading effects and acknowledges that changes are versionless - they exist outside the version system as the immutable source of truth.

| Rule                                                  | Rationale                                                                        | Engine behaviour                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **1. Version‑scoped → change**                        | Changes live outside any version, so the reference is valid across all versions. | Validator skips the `version_id = ?` check when the target schema is `lix_change`. |
| **2. Version‑scoped → version‑scoped (same version)** | Keeps each version self‑contained and makes deletes cheap.                       | Current logic stands: both rows must share the same `version_id`.                  |
| **3. Change → version‑scoped**                        | Would immediately violate Rule 2.                                                | Disallowed at schema‑registration time.                                            |

> **Result:** An example_entity, comment or change‑set element lives inside a specific version, but can freely point at any `lix_change.id` without special handling.
