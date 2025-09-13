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
 * await env.open({ boot: { args: { pluginsRaw: [] } }, onEvent: () => {} })
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
	): Promise<void | { engine?: LixEngine }> {
		if (!this.db) {
			this.db = await createInMemoryDatabase({ readOnly: false });
			const res = await boot({
				sqlite: this.db,
				postEvent: (ev) => opts.onEvent(ev),
				args: opts.boot.args,
			});
			this.callImpl = res.call;
			this.engine = res.engine;
		}
		return { engine: this.engine };
	}

	async create(opts: Parameters<LixEnvironment["create"]>[0]): Promise<void> {
		this.db = await createInMemoryDatabase({ readOnly: false });
		importDatabase({ db: this.db, content: new Uint8Array(opts.blob) });
		const res = await boot({
			sqlite: this.db,
			postEvent: (ev) => opts.onEvent(ev),
			args: opts.boot.args,
		});
		this.callImpl = res.call;
		this.engine = res.engine;
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

		const lastInsertRowid = Number(
			this.db.sqlite3.capi.sqlite3_last_insert_rowid(this.db)
		);
		const changes = this.db.changes() || undefined;

		return { rows, changes, lastInsertRowid };
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
