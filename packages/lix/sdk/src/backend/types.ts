/**
 * Public backend types for running the Lix SQLite database in different runtimes.
 *
 * The backend exposes an async surface even when backed by a synchronous
 * in‑process WASM SQLite implementation to unify usage across implementations.
 */

export type ExecResult = {
  /** Rows returned by a SELECT, if any. */
  rows?: any[];
  /** Number of rows changed by a mutation, if available. */
  changes?: number;
  /** Last insert row id, if available. */
  lastInsertRowid?: number;
};

export type BackendError = {
  /** Error name, e.g. 'SqliteError'. */
  name: string;
  /** Optional database error code. */
  code?: string | number;
  /** Human‑readable message. */
  message: string;
};

/**
 * Minimal backend interface used by drivers and openLix.
 *
 * Backends own persistence and plugin execution. The main thread always
 * interacts with the backend via these async methods.
 */
export interface LixBackend {
  /**
   * Initialize the backend.
   *
   * @param opts.path - Optional persistence path (ignored by in‑memory backend)
   * @param opts.blob - Optional snapshot to seed the database (transferable)
   * @param opts.expProvideStringifiedPlugins - (Experimental) plugin modules as stringified ESM to be imported by the engine
   * @returns void when initialization completes
   *
   * @example
 * const backend = InMemory()
 * await backend.init({})
   */
  init(opts: {
    path?: string;
    blob?: ArrayBuffer;
    expProvideStringifiedPlugins?: string[];
  }): Promise<void>;

  /**
   * Execute a single SQL statement.
   *
   * @example
   * await backend.exec("CREATE TABLE t(a)")
   */
  exec(sql: string, params?: unknown[]): Promise<ExecResult>;

  /**
   * Execute a batch of SQL statements sequentially, using the same connection.
   * No implicit transaction is created – wrap with BEGIN/COMMIT if atomicity is required.
   */
  execBatch?(batch: { sql: string; params?: unknown[] }[]): Promise<{
    results: ExecResult[];
  }>;

  /**
   * Export a snapshot of the current database as raw bytes.
   */
  export(): Promise<ArrayBuffer>;

  /**
   * Close the engine and release resources.
   */
  close(): Promise<void>;
}
