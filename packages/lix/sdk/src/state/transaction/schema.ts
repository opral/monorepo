import type { Selectable, Insertable, Generated } from "kysely";
import type { LixRuntime } from "../../runtime/boot.js";

export function applyTransactionStateSchema(args: {
	runtime: Pick<LixRuntime, "sqlite">;
}): void {
	args.runtime.sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_transaction_state (
    id TEXT PRIMARY KEY DEFAULT (lix_uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    lixcol_version_id TEXT NOT NULL,
    snapshot_content BLOB,
    created_at TEXT NOT NULL,
    lixcol_untracked INTEGER NOT NULL DEFAULT 0,
    UNIQUE(entity_id, file_id, schema_key, lixcol_version_id)
  ) STRICT;
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
	lixcol_version_id: string;
	snapshot_content: Record<string, any> | null;
	created_at: Generated<string>;
	lixcol_untracked: number;
};

// Kysely typing for the new view with lixcol_* naming
// No separate view – the table above is the source of truth.
