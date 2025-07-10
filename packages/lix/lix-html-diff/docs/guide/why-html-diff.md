# Why HTML Diff?

The core idea is to diff the _rendered HTML output_ instead of source data structures, given that anything is rendered as HTML anyway. This bypasses the need for custom diff implementations.

**Legend:**

- 🟧 Custom development effort required
- 🟩 No custom development required (reusable)
- ⚪ Unused in the diffing process

```mermaid
graph TD
    subgraph "HTML Diff"
        UH_DocBefore[Before] --> UH_Renderer1[Rendered HTML]
        UH_DocAfter[After] --> UH_Renderer2[Rendered HTML]
        UH_Renderer1 --> UH_HTMLDiffer[HTML Diff Logic]
        UH_Renderer2 --> UH_HTMLDiffer
        UH_HTMLDiffer --> UH_DiffView[Diff View]
    end

    subgraph "Custom Diff"
        CB_DocBefore[Before] --> CB_Renderer1[Rendered HTML]
        CB_DocBefore --> CB_CustomDiffLogic[Custom Diff Logic]

        CB_DocAfter[After] --> CB_Renderer2[Rendered HTML]
        CB_DocAfter --> CB_CustomDiffLogic

        CB_CustomDiffLogic --> CB_Renderer[Custom Diff Renderer]
        CB_Renderer --> CB_DiffView[Diff View]
    end

    %% Styling
    style CB_CustomDiffLogic fill:orange,stroke:#333,stroke-width:2px,color:black
    style CB_Renderer fill:orange,stroke:#333,stroke-width:2px,color:black
    style UH_HTMLDiffer fill:lightgreen,stroke:#333,stroke-width:2px,color:black

    %% Lower opacity for unused Rendered HTML in Custom Diff but keep text black
    style CB_Renderer1 fill:#f9f9f9,stroke:#aaa,stroke-width:1px,color:black,opacity:0.5
    style CB_Renderer2 fill:#f9f9f9,stroke:#aaa,stroke-width:1px,color:black,opacity:0.5
```

## Comparison

### Custom Diff Approach (🟧)

- Creates a new "diff" AST specific to what should be diffed
- Requires modifying the renderer to understand the custom diff
- One-off solution not generalizable to other document types

### HTML Diff Approach (🟩)

- requires no adjustments from developers (!) in terms of creating a diffed AST and adjusting the renderer
- generalizes across any app UI that renders to HTML (leveraging the "HTML trick" that most apps ultimately produce HTML)