# Change Graph 

```mermaid
graph TB
    G["Change G"] --> F["Change D"]
    F --> B["Change B"]
    F --> C["Change C"]
    B --> A["Change A"]
    C --> A
```

## Purpose

Represent the relationships and history of changes. 

## Examples

### Dependencies

Change B depends on Change A.

```mermaid
graph TB
    G["Change G"]:::unhighlight --> F["Change D"]
    F["Change D"]:::unhighlight
    F --> B["Change B"]
    F --> C["Change C"]:::unhighlight
    B --> A["Change A"]
    C --> A
  
classDef unhighlight, opacity:0.5;
```

### Merges

Change C is the result of Change A and Change B.

```mermaid
graph TB
    G["Change G"]:::unhighlight --> F["Change D"]
    F["Change D"]
    F --> B["Change B"]
    F --> C["Change C"]
    B --> A["Change A"]
    C --> A:::unhighlight
  
classDef unhighlight, opacity:0.5;
```

### History

Change G is the result of Changes D, B, C, and A.

```mermaid
graph TB
    G["Change G"] --> F["Change D"]
    F["Change D"]
    F --> B["Change B"]
    F --> C["Change C"]
    B --> A["Change A"]
    C --> A
```

## FAQ 

### Why not call it change history?

A lix change graph provides more than history.

The term "history" implies a linear sequence of changes. That holds true in most apps like Google Docs that provide a "history" feature. In lix however, changes are tracked as graph. The graph includes the history but also includes the relationships between changes, such as dependencies and merges.
