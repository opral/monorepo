import type { Kysely } from "kysely";
import { sql } from "kysely";

/**
 * Runs a block of DML with a transaction-scoped writer identity and restores
 * the previous value afterwards (nesting-safe).
 *
 * Many clients (for example rich‑text editors) need to react to external
 * changes to the same document while suppressing their own writes to avoid
 * feedback loops. The state API supports this by stamping a `writer_key`
 * for each INSERT, UPDATE, and DELETE. Observers can then filter “not me”.
 *
 * This helper provides the single recommended way to pass the writer identity
 * for a batch of mutations: it starts a transaction on the provided connection,
 * sets the writer via `lix_set_writer_key(<writer|null>)`, executes your
 * callback with a transaction-bound Kysely instance, and restores the previous
 * writer (or NULL) in a finally block. The engine also clears the writer on
 * COMMIT/ROLLBACK; the restore step handles nested usage gracefully.
 *
 * Use a session-scoped writer value (for example
 * `flashtype:tiptap#<sessionId>`) so that two browser tabs don’t suppress each
 * other’s updates. Do not set `writer_key` columns directly in DML — the engine
 * manages them.
 *
 * @example
 * // Upsert and delete with the same writer (editor persistence)
 * await withWriterKey(db, 'flashtype:tiptap#<sessionId>', async (trx) => {
 *   await trx
 *     .insertInto('state')
 *     .values({ file_id, version_id, entity_id, schema_key, plugin_key, schema_version, snapshot_content: snapshot as any })
 *     .onConflict((oc) => oc.columns(['file_id','version_id','entity_id','schema_key']).doUpdateSet({ snapshot_content: snapshot as any }))
 *     .execute();
 *
 *   await trx
 *     .deleteFrom('state')
 *     .where('file_id','=',fileId)
 *     .where('version_id','=',versionId)
 *     .where('entity_id','=',entityId)
 *     .where('schema_key','=',schemaKey)
 *     .execute();
 * });
 */
export async function withWriterKey<DB, T>(
  db: Kysely<DB>,
  writer: string | null,
  fn: (trx: Kysely<DB>) => Promise<T>
): Promise<T> {
  const executeInTransaction = async (trx: Kysely<DB>) => {
    const prevRes = await sql`SELECT lix_get_writer_key()`.execute(trx as any);
    const prevWriter = (prevRes.rows?.[0] as any)?.["lix_get_writer_key()"] ?? null;

    await sql`SELECT lix_set_writer_key(${writer})`.execute(trx as any);
    try {
      return await fn(trx);
    } finally {
      await sql`SELECT lix_set_writer_key(${prevWriter})`.execute(trx as any);
    }
  };

  // If caller provided an open transaction, reuse it; otherwise open one.
  const anyDb = db as unknown as { isTransaction?: boolean; transaction: () => any };
  if (anyDb.isTransaction) {
    return executeInTransaction(db);
  } else {
    return db.transaction().execute(executeInTransaction);
  }
}
