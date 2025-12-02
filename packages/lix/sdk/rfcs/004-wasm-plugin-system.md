# WASM plugin system

## Goal

Define the smallest `wit` surface so plugins can be authored in any language, compiled to a WASM component, and called by Lix hosts (JS, Python, Rust). The Rust engine keeps its existing host callbacks; hosts load the component and forward calls.

## WIT draft

```wit
package lix:plugin

/// Minimal plugin ABI for Lix file/entity plugins.
world plugin {
  // Called when file content changes. Returns entity mutations to persist.
  detect_changes: func(
    file: file_descriptor,
    before: option<string>, // UTF-8
    after: string,          // UTF-8
  ) -> result<list<entity_change>, plugin_error>

  // Called to materialize file content from accumulated entity changes.
  apply_changes: func(
    file: file_descriptor,
    changes: list<entity>,
  ) -> result<string, plugin_error> // UTF-8

  // Basic metadata used for routing (e.g., glob matching).
  metadata: func() -> plugin_metadata
}

record file_descriptor {
  id: string,
  path: string,
  metadata: option<string>, // JSON string; host may parse.
}

record entity {
  schema_key: string,
  entity_id: string,
  version_id: string,
  snapshot_content: string, // UTF-8 JSON string
}

record entity_change {
  schema_key: string,
  entity_id: string,
  version_id: string,
  snapshot_content: string, // UTF-8 JSON string; empty string means tombstone
  is_tombstone: bool,
}

record plugin_metadata {
  key: string,          // plugin identifier
  glob: list<string>,   // file globs this plugin handles
  version: string,      // plugin version string
}

enum plugin_error {
  invalid_input,
  unsupported,
  internal,
}
```

## Notes

- Uses preview2-friendly types (records, lists, variants), no custom codecs.
- `snapshot-content` is treated as opaque UTF-8 JSON; hosts/engine can parse as needed.
- `metadata.glob` enables the host to route files to the right plugin.
- Errors are kept coarse; hosts can log more detail out-of-band.
