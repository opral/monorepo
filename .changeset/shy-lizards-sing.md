---
"lix-file-manager": patch
"@lix-js/plugin-csv": patch
"@lix-js/sdk": patch
---

@lix-js/sdk:
- define UiDiffComponent type
- diff components can now consume multiple diffs

@lix-js/plugin-csv:
- update to use new diff component type
- display multiple diffs in a single component
- add rowId to snapshot content
- group diffs by rowId

lix-file-manager:
- add checkpoint timeline instead of change list
- refactor API diff component rendering
- refactor queries to use new UiDiffComponent type

PR URL:
https://github.com/opral/monorepo/pull/3377
