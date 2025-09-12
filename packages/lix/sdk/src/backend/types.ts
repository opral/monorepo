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
     * Open the backend and boot the runtime next to the database engine.
     *
     * Return value semantics:
     * - In‑process (main‑thread) backends SHOULD return `{ runtime }` so the
     *   runtime is directly accessible on the main thread — useful for unit
     *   testing and local tools that need in‑process access.
     * - Out‑of‑process backends (e.g., Worker or separate process) MUST NOT
     *   return a runtime (resolve to `void`). In those environments, callers
     *   should use `call()` to invoke runtime functions across the boundary.
     *
     * Guidance:
     * - The optional `{ runtime }` is primarily for openers/frameworks to
     *   attach onto the `Lix` object for main‑thread access in tests. App code
     *   should not rely on it; prefer `call()` for runtime operations.
     *
     * @param opts.boot - Runtime boot arguments (plugins, account, keyValues)
     * @param opts.onEvent - Event bridge (currently only 'state_commit')
     * @returns `{ runtime }` for main‑thread engines, or `void` for worker/remote engines.
     */
    open(opts: {
        boot: { args: import("../runtime/boot.js").BootArgs };
        onEvent: (ev: import("../runtime/boot.js").RuntimeEvent) => void;
    }): Promise<void | { runtime?: import("../runtime/boot.js").LixRuntime }>;

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
	 * Export a snapshot of the current database as raw bytes.
	 */
	export(): Promise<ArrayBuffer>;

	/**
	 * Close the engine and release resources.
	 */
	close(): Promise<void>;

	/**
	 * Invoke a runtime function inside the backend environment.
	 *
	 * Backends MUST implement this and route the call to the runtime that
	 * booted next to SQLite, regardless of whether the engine runs on the main
	 * thread or inside a Worker.
	 */
	call(
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	): Promise<unknown>;
}
