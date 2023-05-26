---
"vs-code-extension": minor
---

The VSCode extension should now work for the majority of projects.

We fixed a problem that blocked the VSCode extension for months. The extension transpiles ESM under the hood to CJS now because Electron, and thus VSCode, do not support ESM.
