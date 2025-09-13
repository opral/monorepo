export type LixEnvironmentResult = {
	/** Rows returned by a SELECT, if any. */
	rows?: any[];
	/** Number of rows changed by a mutation, if available. */
	changes?: number;
	/** Last insert row id, if available. */
	lastInsertRowid?: number;
};

export type LixEnvironmentError = {
	/** Error name, e.g. 'SqliteError'. */
	name: string;
	/** Optional database error code. */
	code?: string | number;
	/** Human‑readable message. */
	message: string;
};

/**
 * Minimal environment interface used by drivers and openLix.
 *
 * Environments own persistence and plugin execution. The main thread always
 * interacts with the environment via these async methods.
 */
export interface LixEnvironment {
	/**
	 * Open the environment and boot the engine next to the database engine.
	 *
	 * Return value semantics:
	 * - In‑process (main‑thread) environments SHOULD return `{ engine }` so the
	 *   engine is directly accessible on the main thread — useful for unit
	 *   testing and local tools that need in‑process access.
	 * - Out‑of‑process environments (e.g., Worker or separate process) MUST NOT
	 *   return a engine (resolve to `void`). In those environments, callers
	 *   should use `call()` to invoke engine functions across the boundary.
	 *
	 * Guidance:
	 * - The optional `{ engine }` is primarily for openers/frameworks to
	 *   attach onto the `Lix` object for main‑thread access in tests. App code
	 *   should not rely on it; prefer `call()` for engine operations.
	 *
	 * @param opts.boot - engine boot arguments (plugins, account, keyValues)
	 * @param opts.onEvent - Event bridge (currently only 'state_commit')
	 * @returns `{ engine }` for main‑thread engines, or `void` for worker/remote engines.
	 */
	open(opts: {
		boot: { args: import("../engine/boot.js").BootArgs };
		onEvent: (ev: import("../engine/boot.js").EngineEvent) => void;
	}): Promise<void | { engine?: import("../engine/boot.js").LixEngine }>;

	/**
	 * Create a brand‑new database from a provided snapshot and boot it.
	 * Implementations should throw if the target already exists to avoid data loss.
	 */
	create(opts: {
		blob: ArrayBuffer;
		boot: { args: import("../engine/boot.js").BootArgs };
		onEvent: (ev: import("../engine/boot.js").EngineEvent) => void;
	}): Promise<void>;

	/**
	 * Returns true if a persistent database already exists for this environment's
	 * target (e.g. OPFS key or filesystem path).
	 */
	exists(): Promise<boolean>;

	/**
	 * Execute a single SQL statement.
	 *
	 * @example
	 * await env.exec("CREATE TABLE t(a)")
	 */
	exec(sql: string, params?: unknown[]): Promise<LixEnvironmentResult>;

	/**
	 * Export a snapshot of the current database as raw bytes.
	 */
	export(): Promise<ArrayBuffer>;

	/**
	 * Close the engine and release resources.
	 */
	close(): Promise<void>;

	/**
	 * Invoke an engine function inside the environment.
	 *
	 * Environments MUST implement this and route the call to the engine that
	 * booted next to SQLite, regardless of whether the engine runs on the main
	 * thread or inside a Worker.
	 */
	call(
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	): Promise<unknown>;
}
