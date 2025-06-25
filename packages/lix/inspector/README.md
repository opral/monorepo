# Lix Inspector 

Dev tool to analyze and debug Lix'es. 

## User experience

- Shadow DOM (does not interfere with your apps CSS) 
- Floating windows (does not interfere with your apps DOM)
- Keyboard shortcuts (⌘⇧o to toggle inspector)
  
## Usage

```ts
import { initLixInspector } from "@lix-js/inspector";

// optionally only add in development
if (import.meta.env.DEV){
  // pass the lix to the inspector 
  initLixInspector({ lix });
}

```