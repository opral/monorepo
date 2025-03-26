---
"@lix-js/sdk": patch
"@lix-js/host": patch
---

- Rename `lix-server-api` to `lix-server-protocol` for improved clarity and consistent naming. All functionality remains backward compatible. The following changes were made:
  - Renamed server-api-handler directory to server-protocol-handler
  - Renamed server endpoints from /lsa/ to /lsp/
  - Updated imports in all affected files
  - Added backward compatibility aliases to ensure existing code continues to work