import type { Selectable, Insertable, Generated } from "kysely";
import type { Lix } from "../../lix/open-lix.js";

export function applyTransactionStateSchema(lix: Pick<Lix, "sqlite">): void {
	lix.sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_change_in_transaction (
    id TEXT PRIMARY KEY DEFAULT (lix_uuid_v7()),
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    version_id TEXT NOT NULL,
    snapshot_content BLOB,
    created_at TEXT NOT NULL,
    untracked INTEGER NOT NULL DEFAULT 0,
    --- NOTE schema_key must be unique per entity_id and file_id in the transaction
    UNIQUE(entity_id, file_id, schema_key, version_id)
  ) STRICT;
`);
}

export type InternalChangeInTransaction =
	Selectable<InternalChangeInTransactionTable>;
export type NewInternalChangeInTransaction =
	Insertable<InternalChangeInTransactionTable>;
export type InternalChangeInTransactionTable = {
	id: Generated<string>;
	entity_id: string;
	schema_key: string;
	schema_version: string;
	file_id: string;
	plugin_key: string;
	version_id: string;
	snapshot_content: Record<string, any> | null;
	created_at: Generated<string>;
	untracked: number;
};
