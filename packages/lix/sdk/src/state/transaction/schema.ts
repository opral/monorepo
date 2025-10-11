import type { Selectable, Insertable, Generated } from "kysely";
import type { LixEngine } from "../../engine/boot.js";

export function applyTransactionStateSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
  CREATE TABLE IF NOT EXISTS lix_internal_transaction_state (
    id TEXT PRIMARY KEY DEFAULT (lix_uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    version_id TEXT NOT NULL,
    writer_key TEXT NULL,
    snapshot_content BLOB,
    metadata BLOB,
    created_at TEXT NOT NULL,
    untracked INTEGER NOT NULL DEFAULT 0,
    UNIQUE(entity_id, file_id, schema_key, version_id)
  ) STRICT;

  CREATE INDEX IF NOT EXISTS ix_txn_v_f_s_e
    ON lix_internal_transaction_state(version_id, file_id, schema_key, entity_id);
`);
}

export type InternalTransactionState =
	Selectable<InternalTransactionStateTable>;
export type NewInternalTransactionState =
	Insertable<InternalTransactionStateTable>;
export type InternalTransactionStateTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	version_id: string;
	writer_key: string | null;
	snapshot_content: Record<string, any> | null;
	metadata: Record<string, any> | null;
	created_at: Generated<string>;
	untracked: number;
};

// Kysely typing for the new view with lixcol_* naming
// No separate view – the table above is the source of truth.
