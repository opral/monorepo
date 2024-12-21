---
"csv-app": minor
---

improve: clears the OPFS in case the lix file can't be loaded.

If the lix schema changed, loading existing lix'es breaks with no possibility for users to fix the situation. Auto clearing the OPFS ledas to the creation of a new lix file with the new schema.