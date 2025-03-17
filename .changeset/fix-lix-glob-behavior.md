---
"@lix-js/sdk": patch
---

Fix glob pattern behavior in file queue by removing prepending slash and add proper null checks for `plugin.detectChangesGlob`. 

Also update the error message explanation for file paths to correctly state why paths need to start with a root slash.