import {
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import type { LixEnvironment, LixEnvironmentResult } from "./types.js";
import { boot, type LixEngine } from "../engine/boot.js";

/**
 * In‑process, in‑memory environment.
 *
 * Runs on the calling thread; great for tests, CLI, or light usage. In
 * browsers, heavy operations can block the UI – prefer the Worker environment for
 * production use.
 *
 * @example
 * const env = new InMemoryEnvironment()
 * await env.open({ boot: { args: { pluginsRaw: [] } }, emit: () => {} })
 * await env.exec("CREATE TABLE t(a)")
 * await env.exec("INSERT INTO t(a) VALUES (?)", [1])
 * const out = await env.exec("SELECT a FROM t")
 */
export class InMemoryEnvironment implements LixEnvironment {
	private db: SqliteWasmDatabase | undefined;
	private callImpl:
		| ((
				name: string,
				payload?: unknown,
				opts?: { signal?: AbortSignal }
		  ) => Promise<unknown>)
		| undefined;
	private engine: LixEngine | undefined;

	async open(
		opts: Parameters<LixEnvironment["open"]>[0]
	): Promise<{ engine?: LixEngine }> {
		if (!this.db) {
			this.db = await createInMemoryDatabase({ readOnly: false });
		}
		// Boot the engine if not already booted.
		if (!this.callImpl) {
			const res = await boot({
				sqlite: this.db,
				emit: (ev) => opts.emit(ev),
				args: opts.boot.args,
			});
			this.callImpl = res.call;
			this.engine = res.engine;
		}
		return { engine: this.engine };
	}

	async create(opts: Parameters<LixEnvironment["create"]>[0]): Promise<void> {
		// Seed a fresh in-memory database from the provided blob (bytes).
		this.db = await createInMemoryDatabase({ readOnly: false });
		importDatabase({ db: this.db, content: new Uint8Array(opts.blob) });
	}

	async exec(sql: string, params?: unknown[]): Promise<LixEnvironmentResult> {
		if (!this.db) throw new Error("Engine not initialized");

		const columnNames: string[] = [];
		let rows: any[];
		try {
			rows = this.db.exec({
				sql,
				bind: (params ?? []) as any[],
				returnValue: "resultRows",
				rowMode: "object",
				columnNames,
			}) as any[];
		} catch (e: any) {
			const err = new Error(
				`environment.exec failed: ${e?.message ?? e} -- SQL: ${sql}`
			);
			(err as any).cause = e;
			throw err;
		}


		return { rows };
	}

	// execBatch intentionally omitted; loop over exec() instead.

	async export(): Promise<ArrayBuffer> {
		if (!this.db) throw new Error("Engine not initialized");
		const bytes = contentFromDatabase(this.db);
		const copy = bytes.slice();
		return copy.buffer;
	}

	async close(): Promise<void> {
		if (this.db) {
			this.db.close();
			this.db = undefined;
		}
		this.callImpl = undefined;
	}

	async exists(): Promise<boolean> {
		// In-memory environment has no persisted store bound to a key/path.
		return false;
	}

	async call(
		name: string,
		payload?: unknown,
		_opts?: { signal?: AbortSignal }
	): Promise<unknown> {
		if (!this.callImpl) throw new Error("Environment not initialized");
		return this.callImpl(name, payload);
	}
}
