---
"@inlang/sdk": minor
---

The SDK now writes `.meta.json` with the highest SDK version that has touched a
project and uses it to safely handle forward migrations.

On load, if the stored version is older, metadata + generated files are refreshed without exporting;if it's newer, they are left untouched to avoid downgrades.

Directory change:

```txt
project.inlang/
  settings.json
  README.md
  .gitignore
  .meta.json   <-- new
```
