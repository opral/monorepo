State API: writer_key — Short Requirements

- Add writer_key (virtual column) on internal_state_vtable and expose it on state, state_all, and state_with_tombstones views (types included).
- Store writer_key as untracked metadata in a dedicated persistent table internal_state_writer WITHOUT ROWID, keyed by (file_id, version_id, entity_id, schema_key), columns: writer_key TEXT NULL.
- Statement-scoped setter: use the Kysely helper `.with(...writerKey(:writer))` to set the writer for the following DML statement (INSERT/UPDATE/DELETE). The engine stamps writer_key; do not set it directly in DML.
- Vtable integration: reads of writer_key are forwarded to internal_state_writer; writer writes occur during the vtable commit phase (same transaction).

Writer Semantics
- For each DML statement, the writer is determined by the presence/value of `writerKey(:writer)` applied via `.with(...)`.
- INSERT/UPDATE with setter (writer != NULL): UPSERT into internal_state_writer (pk, writer_key).
- INSERT/UPDATE with setter (writer = NULL) or no setter: DELETE writer row for that pk (do not store NULLs).
- DELETE with setter (writer != NULL): stamp tombstone with that writer (UPSERT writer row for pk).
- DELETE with setter (writer = NULL) or no setter: DELETE writer row for that pk (tombstone shows NULL writer).
- Read: writer_key column returns the value from internal_state_writer if present; otherwise NULL.

Notes
- Client filter (SQLite): writer_key IS NOT :ME.
- Indexes: PK on (file_id, version_id, entity_id, schema_key); optional secondary (file_id, version_id, writer_key) for pushdown filtering.

Decisions (Locked)
- Clients pass writer via the helper only: `.with(...writerKey(:writer)) … DML …`. Do not set writer_key directly in DML.
- Record writer only at commit phase (authoritative), not during pending transaction stage.
- Tracked and untracked writes share the same commit path for writer persistence.
- Inheritance: when a child row is inherited from a parent version, expose the parent’s writer_key in the child. Implementation: vtable read falls back to the writer of inherited_from_version_id if no local writer row exists.
- Deletes: keep writer rows across deletes/recreates (writer overwritten on the next write). If a delete is issued without writer_key, the writer row is removed (tombstone will appear with NULL writer).
- If writer not provided on any mutation: delete writer row (no NULL storage).

Schema Shape
- internal_state_writer (persistent, WITHOUT ROWID)
  - PK: (file_id, version_id, entity_id, schema_key)
  - Columns: writer_key TEXT NULL
  - Index (optional): (file_id, version_id, writer_key)
