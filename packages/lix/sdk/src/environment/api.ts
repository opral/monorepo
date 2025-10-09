export type EnvironmentActorHandle = {
	post(message: unknown, transfer?: Transferable[]): void;
	subscribe(listener: (message: unknown) => void): () => void;
	terminate(): Promise<void>;
};

export type SpawnActorOptions = {
	entryModule: string;
	name?: string;
	initialMessage?: unknown;
	transfer?: Transferable[];
};

export interface LixEnvironment {
	open(opts: {
		boot: { args: import("../engine/boot.js").BootArgs };
		emit: (ev: import("../engine/boot.js").EngineEvent) => void;
	}): Promise<{ engine?: import("../engine/boot.js").LixEngine }>;

	create(opts: { blob: ArrayBuffer }): Promise<void>;

	exists(): Promise<boolean>;

	export(): Promise<ArrayBuffer>;

	close(): Promise<void>;

	/**
	 * Invoke an engine function inside the environment.
	 *
	 * Environments MUST implement this and route the call to the engine that
	 * booted next to SQLite, regardless of whether the engine runs on the main
	 * thread or inside a Worker. The SQL driver uses the "lix_exec_sync" route to
	 * execute compiled statements.
	 */
	call: import("../engine/functions/function-registry.js").Call;

	spawnActor?: (opts: SpawnActorOptions) => Promise<EnvironmentActorHandle>;
}
