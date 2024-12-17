---
"@lix-js/sdk": patch
---

fix: duplicate version changes

Closes https://github.com/opral/lix-sdk/issues/217 by making version changes have a unique (entity_id, file_id, schema_key).

Sync was buggy because the sync process is an async process. A client received multiple version changes for the same entity and inserted them https://github.com/opral/lix-sdk/issues/217#issuecomment-2549545901 without checking if the version change for the entity already exists.
