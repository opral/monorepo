# Lix Inspector 

Dev tool to analyze and debug Lix'es. 

## User experience

- Shadow DOM (does not interfere with your apps CSS) 
- Floating windows (does not interfere with your apps DOM)
- Keyboard shortcuts (⌘⇧o to toggle inspector)
  
## Usage

```ts
import { initLixInspector } from "@lix-js/inspector";

initLixInspector({ lix });

```

## Best practices

- Ship the inspector in production. It lazy-loads on first toggle, so initial bundles stay lean while users can capture precise snapshots for bug reports.
- Read the `--lix-inspector-offset` CSS variable on `:root` (e.g. `padding-top: var(--lix-inspector-offset)`) to keep your chrome aligned when the inspector is visible.
