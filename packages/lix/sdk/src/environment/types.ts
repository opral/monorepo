export type LixEnvironmentResult = {
	/** Rows returned by a SELECT, if any. */
	rows?: any[];
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
	 *   expose a main‑thread engine. In those environments, callers should use
	 *   `call()` to invoke engine functions across the boundary.
	 *
	 * Guidance:
	 * - The optional `{ engine }` is primarily for openers/frameworks to
	 *   attach onto the `Lix` object for main‑thread access in tests. App code
	 *   should not rely on it; prefer `call()` for engine operations.
	 *
	 * @param opts.boot - engine boot arguments (plugins, account, keyValues)
	 * @param opts.emit - Event bridge (currently only 'state_commit')
	 *
	 * Concurrency model:
	 * - One environment instance equals one live session/connection.
	 *   Create multiple environment instances for concurrency.
	 *
	 * @returns An object that may include `{ engine }` in in‑process environments.
	 */
	open(opts: {
		boot: { args: import("../engine/boot.js").BootArgs };
		emit: (ev: import("../engine/boot.js").EngineEvent) => void;
	}): Promise<{ engine?: import("../engine/boot.js").LixEngine }>;

	/**
	 * Create a brand‑new database from a provided database image.
	 *
	 * Semantics:
	 * - Pure seed/import of the serialized SQLite file. Do not boot the engine here — boot happens in `open()`.
	 * - Implementations should throw if the target already exists to avoid data loss.
	 *
	 * @param opts.blob Serialized SQLite database image (ArrayBuffer).
	 */
	create(opts: { blob: ArrayBuffer }): Promise<void>;

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
	 * Export the SQLite database image as raw bytes.
	 *
	 * Returns an ArrayBuffer containing the serialized SQLite file.
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
	call: import("../engine/router.js").Call;
}
