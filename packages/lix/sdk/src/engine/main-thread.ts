import { createInMemoryDatabase, importDatabase, contentFromDatabase, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixEngine, ExecResult } from "./types.js";

/**
 * Create an in‑process, in‑memory engine backed by WASM SQLite.
 *
 * This engine runs on the calling thread and is best suited for tests, CLI,
 * or very light usage. Heavy work can block the UI in browsers – prefer the
 * Worker engine for production apps.
 *
 * @example
 * const engine = createMainMemoryEngine()
 * await engine.init({})
 * await engine.exec("CREATE TABLE t(a)")
 * await engine.exec("INSERT INTO t(a) VALUES (?)", [1])
 * const out = await engine.exec("SELECT a FROM t")
 */
export function createMainMemoryEngine(): LixEngine {
  let db: SqliteWasmDatabase | undefined;

  return {
    async init(opts) {
      db = await createInMemoryDatabase({ readOnly: false });

      if (opts?.blob) {
        importDatabase({ db, content: new Uint8Array(opts.blob) });
      }
      // no handshake data – init returns void
    },

    async exec(sql: string, params?: unknown[]): Promise<ExecResult> {
      if (!db) throw new Error("Engine not initialized");

      // Collect column names so we can map object rows
      const columnNames: string[] = [];
      const rows = db.exec({
        sql,
        bind: (params ?? []) as any[],
        returnValue: "resultRows",
        rowMode: "object",
        columnNames,
      }) as any[];

      const lastInsertRowid = Number(
        db.sqlite3.capi.sqlite3_last_insert_rowid(db)
      );
      // Detect changes by comparing total changes
      // Note: we cannot know changes for pure SELECT – return undefined in that case.
      // Using db.changes() after exec returns the number of changes if a write occurred.
      const changes = db.changes() || undefined;

      return {
        rows,
        changes,
        lastInsertRowid,
      };
    },

    async execBatch(batch) {
      if (!db) throw new Error("Engine not initialized");
      const results: ExecResult[] = [];
      for (const item of batch) {
        results.push(await this.exec(item.sql, item.params));
      }
      return { results };
    },

    async export(): Promise<ArrayBuffer> {
      if (!db) throw new Error("Engine not initialized");
      const bytes = contentFromDatabase(db);
      const copy = bytes.slice();
      return copy.buffer;
    },

    async close(): Promise<void> {
      if (db) {
        db.close();
        db = undefined;
      }
    },
  };
}
