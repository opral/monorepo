select json_extract(snapshot_content, '$.value') as "value" 
from "lix_internal_state_vtable" 
where "entity_id" = ? 
and "schema_key" = ? 
and "version_id" = ? 
and "snapshot_content" is not null

[
  "lix_state_cache_stale",
  "lix_key_value",
  "global",
]