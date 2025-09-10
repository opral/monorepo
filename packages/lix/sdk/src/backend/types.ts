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
	 * Open the backend and run Lix runtime boot next to SQLite.
	 *
	 * @param opts.boot - Runtime boot arguments (plugins, account, keyValues)
	 * @param opts.onEvent - Event bridge (currently only 'state_commit')
	 */
	open(opts: {
		boot: { args: import("../runtime/boot.js").BootArgs };
		onEvent: (ev: import("../runtime/boot.js").RuntimeEvent) => void;
	}): Promise<void>;

	/**
	 * Create a brand‑new database from a provided snapshot and boot it.
	 * Implementations should throw if the target already exists to avoid data loss.
	 */
	create(opts: {
		blob: ArrayBuffer;
		boot: { args: import("../runtime/boot.js").BootArgs };
		onEvent: (ev: import("../runtime/boot.js").RuntimeEvent) => void;
	}): Promise<void>;

	/**
	 * Returns true if a persistent database already exists for this backend's
	 * target (e.g. OPFS key or filesystem path).
	 */
	exists(): Promise<boolean>;

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
