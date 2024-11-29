import type { Insertable, Selectable, Updateable } from "kysely";
import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applySessionOperationsDatabaseSchema(
	sqlite: SqliteDatabase,
): SqliteDatabase {

	 // TODO SYNC naming - operations might be a better name
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  return sqlite.exec`
  -- vector clock
  CREATE TABLE IF NOT EXISTS vector_clock (
    row_id TEXT,
    table_name TEXT,
    -- TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
    operation TEXT,
    session TEXT NOT NULL DEFAULT (vector_clock_session()),
    session_time INTEGER NOT NULL DEFAULT (vector_clock_tick()),
    wall_clock INTEGER DEFAULT (strftime('%s', 'now') * 1000 + (strftime('%f', 'now') - strftime('%S', 'now')) * 1000)
  ) STRICT;`;

}

export type SessionOperations =
	Selectable<SessionOperationTable>;
export type NewVectorClock =
	Insertable<SessionOperationTable>;
export type VectorClockUpdate =
	Updateable<SessionOperationTable>;
type SessionOperationTable = {
	row_id: string;
	table_name: string;
	// -1 = delete, 0 = insert, 1 = update
	// TODO SYNC - we might not need the operation as long as we don't expect a delete operation since we utilize upsert queries anyway
	operation: 'INSERT' | 'UPDATE' | 'DELETE';
	session: string;
	session_time: number; 
	wall_clock: number; 
};

