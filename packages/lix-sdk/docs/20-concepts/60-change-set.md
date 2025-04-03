# Change Set

## Purpose

Change sets provide a unified way to group changes that can be referenced by various other concepts.

## Description  

**Change sets serve as a fundamental building block in the Lix system.** 

Many features need to express a set of changes. Change sets provide a unified way to do this and avoid the duplication of logic. 

> [!NOTE]
> By modeling Lix after set theory, Lix offers a simple mental model for complex operations. Set theory provides a mathematical foundation that eases reasoning about changes and features like merging, diffing, and change proposals.

## Diagrams

```mermaid
graph TD
    cs[Change Set] --> A[Change A]
    cs --> B[Change B]
    cs --> C[Change C]
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    
    class cs changeSet;
    class A,B,C change;
```

## Use Cases

Change sets enable various use cases:

1. **Discussions** - Attaching comments and feedback to a specific set of changes
2. **Tags** - Labeling sets of changes for easier querying and history tracking
3. **Change Proposals** - Proposing changes from one context to another
4. **Release Notes/Change Logs** - Documenting changes included in a release
5. **Versions** - Filtering applied changes in a specific development context


```mermaid
graph TD
    CS[Change Set] --> C1[Change 1]
    CS --> C2[Change 2]
    CS --> C3[Change 3]
    
    D[Discussion] --> CS
    L[Label] --> CS
    CP[Change Proposal] --> CS
    RL[Release Log] --> CS
    V[Version] --> CS
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    classDef feature fill:#bfb,stroke:#333,stroke-width:2px;
    
    class CS changeSet;
    class C1,C2,C3 change;
    class D,L,CP,RL,V feature;
```

## Change Sets and Set Theory

Change sets in Lix follow the principles of mathematical set theory, making reasoning about changes simple and intuitive. This approach enables powerful operations through familiar set operations.

### Union (A ∪ B)

The union of two change sets contains all changes from both sets.

```mermaid
graph TD
    subgraph "Change Set A"
    A1[Change 1]
    A2[Change 2]
    end
    
    subgraph "Change Set B"
    B2[Change 2]
    B3[Change 3]
    end
    
    subgraph "Union (A ∪ B)"
    U1[Change 1]
    U2[Change 2]
    U3[Change 3]
    end
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    
    class A1,A2,B2,B3,U1,U2,U3 change;
```

**Use case:** Combining changes from multiple sources, such as merging changes from different versions.

### Intersection (A ∩ B)

The intersection of two change sets contains only the changes present in both sets.

```mermaid
graph TD
    subgraph "Change Set A"
    A1[Change 1]
    A2[Change 2]
    end
    
    subgraph "Change Set B"
    B2[Change 2]
    B3[Change 3]
    end
    
    subgraph "Intersection (A ∩ B)"
    I2[Change 2]
    end
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    
    class A1,A2,B2,B3,I2 change;
```

**Use case:** Finding common changes between two versions.

### Difference (A - B)

The difference contains changes that are in set A but not in set B.

```mermaid
graph TD
    subgraph "Change Set A"
    A1[Change 1]
    A2[Change 2]
    end
    
    subgraph "Change Set B"
    B2[Change 2]
    B3[Change 3]
    end
    
    subgraph "Difference (A - B)"
    D1[Change 1]
    end
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    
    class A1,A2,B2,B3,D1 change;
```

**Use case:** Identifying changes unique to a version, proposal, or merge.

### Symmetric Difference (A △ B)

The symmetric difference contains changes that are in either set but not in both.

```mermaid
graph TD
    subgraph "Change Set A"
    A1[Change 1]
    A2[Change 2]
    end
    
    subgraph "Change Set B"
    B2[Change 2]
    B3[Change 3]
    end
    
    subgraph "Symmetric Difference (A △ B)"
    S1[Change 1]
    S3[Change 3]
    end
    
    classDef changeSet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef change fill:#bbf,stroke:#333,stroke-width:1px;
    
    class A1,A2,B2,B3,S1,S3 change;
```

**Use case:** Creating change proposals by identifying changes that need to be merged from one version to another.

## Relationship to Other Concepts

- **[Changes](./50-change.md)**: Change sets group multiple changes together.
- **[Discussions](./110-discussion.md)**: Discussions can reference change sets to facilitate conversations about specific changes.
- **[Labels](./40-label.md)**: Labels can reference change sets for easier querying and history tracking.
- **[Change Proposals](./80-change-proposal.md)**: Change proposals use change sets to represent the source, target, and proposed changes.
- **[Merge](./70-merge.md)**: Merging typically involves combining changes from different change sets.