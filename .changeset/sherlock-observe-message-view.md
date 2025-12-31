---
"vs-code-extension": patch
---

Switch the Sherlock message sidebar from a polling loop to the new `lix.observe` API so bundle updates stream in immediately without hammering the database during activation.
