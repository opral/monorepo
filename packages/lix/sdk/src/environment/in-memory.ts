import {
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
	type SqliteWasmDatabase,
} from "../database/sqlite/index.js";
import type { LixEnvironment } from "./api.js";
import { boot, type LixEngine } from "../engine/boot.js";

/**
 * In-process, in-memory environment.
 *
 * Runs on the calling thread; great for tests, CLI, or light usage. In
 * browsers, heavy operations can block the UI – prefer the Worker environment for
 * production use.
 */
export class InMemoryEnvironment implements LixEnvironment {
	private sqlite: SqliteWasmDatabase | undefined;

	private engine: LixEngine | undefined;

	async open(
		opts: Parameters<LixEnvironment["open"]>[0]
	): Promise<{ engine?: LixEngine }> {
		if (!this.sqlite) {
			this.sqlite = await createInMemoryDatabase({ readOnly: false });
		}
		if (!this.engine) {
			const engine = await boot({
				sqlite: this.sqlite,
				emit: (ev) => opts.emit(ev),
				args: opts.boot.args,
			});
			this.engine = engine;
		}
		return { engine: this.engine };
	}

	async create(opts: Parameters<LixEnvironment["create"]>[0]): Promise<void> {
		this.sqlite = await createInMemoryDatabase({ readOnly: false });
		importDatabase({ db: this.sqlite, content: new Uint8Array(opts.blob) });
		this.engine = undefined;
	}

	async export(): Promise<ArrayBuffer> {
		if (!this.sqlite) throw new Error("Engine not initialized");
		const bytes = contentFromDatabase(this.sqlite);
		const copy = bytes.slice();
		return copy.buffer;
	}

	async close(): Promise<void> {
		if (this.sqlite) {
			this.sqlite.close();
			this.sqlite = undefined;
		}
		this.engine = undefined;
	}

	async exists(): Promise<boolean> {
		return false;
	}

	async call(name: string, args?: unknown): Promise<unknown> {
		if (!this.engine) throw new Error("Environment not initialized");
		return this.engine.call(name, args);
	}
}
