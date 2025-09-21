/**
 * Options for spawning an isolated actor inside an environment.
 *
 * @example
 * environment.spawnActor?.({
 *   entryModule: new URL('./diff-worker.js', import.meta.url).href,
 *   name: 'diff-renderer'
 * })
 */
export type SpawnActorOptions = {
	/** ESM module specifier that should be executed inside the actor. */
	entryModule: string;
	/** Optional human friendly name for diagnostics. */
	name?: string;
	/** Message that should be delivered to the actor immediately after boot. */
	initialMessage?: unknown;
	/** Transferable objects that should accompany the initial message. */
	transfer?: Transferable[];
};

/**
 * Handle returned by {@link LixEnvironment.spawnActor}.
 *
 * @example
 * const actor = await environment.spawnActor?.({ entryModule });
 * const unsubscribe = actor?.subscribe((msg) => console.log(msg));
 * actor?.post({ type: 'ping' });
 * unsubscribe?.();
 * await actor?.terminate();
 */
export type EnvironmentActorHandle = {
	/** Post a message to the actor. */
	post(message: unknown, transfer?: Transferable[]): void;
	/** Subscribe to messages emitted by the actor. Returns an unsubscribe callback. */
	subscribe(listener: (message: unknown) => void): () => void;
	/** Terminate the actor and release its resources. */
	terminate(): Promise<void>;
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
	 * - In-process (main-thread) environments SHOULD return `{ engine }` so the
	 *   engine is directly accessible on the main thread — useful for unit
	 *   testing and local tools that need in-process access.
	 * - Out-of-process environments (e.g., Worker or separate process) MUST NOT
	 *   expose a main-thread engine. In those environments, callers should use
	 *   `call()` to invoke engine functions across the boundary.
	 *
	 * @param opts.boot - engine boot arguments (plugins, account, keyValues)
	 * @param opts.emit - Event bridge (currently only 'state_commit')
	 */
	open(opts: {
		boot: { args: import("../engine/boot.js").BootArgs };
		emit: (ev: import("../engine/boot.js").EngineEvent) => void;
	}): Promise<{ engine?: import("../engine/boot.js").LixEngine }>;

	/**
	 * Create a brand-new database from a provided database image.
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
	 * thread or inside a Worker. The SQL driver uses the `"lix_exec_sync"`
	 * route to execute compiled statements.
	 */
	call: import("../engine/router.js").Call;

	/**
	 * Optional capability for spawning additional actors alongside the engine.
	 *
	 * Implementations that support isolated execution (e.g. Web Workers) can
	 * provide this hook so the SDK can offload work such as diff rendering or
	 * plugin evaluation without blocking the host thread.
	 *
	 * @example
	 * const actor = await environment.spawnActor?.({
	 *   entryModule: new URL('./worker.js', import.meta.url).href,
	 *   initialMessage: { type: 'boot' }
	 * });
	 * actor?.subscribe((event) => console.log('actor event', event));
	 */
	spawnActor?: (opts: SpawnActorOptions) => Promise<EnvironmentActorHandle>;
}
