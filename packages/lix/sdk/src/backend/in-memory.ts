import {
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import type { LixBackend, ExecResult } from "./types.js";
import { boot } from "../runtime/boot.js";

/**
 * In‑process, in‑memory backend backed by WASM SQLite.
 *
 * Runs on the calling thread; great for tests, CLI, or light usage. In
 * browsers, heavy operations can block the UI – prefer the Worker backend for
 * production use.
 *
 * @example
 * const backend = new InMemoryBackend()
 * await backend.open({ boot: { args: { pluginsRaw: [] } }, onEvent: () => {} })
 * await backend.exec("CREATE TABLE t(a)")
 * await backend.exec("INSERT INTO t(a) VALUES (?)", [1])
 * const out = await backend.exec("SELECT a FROM t")
 */
export class InMemoryBackend implements LixBackend {
	private db: SqliteWasmDatabase | undefined;

	async open(opts: Parameters<LixBackend["open"]>[0]): Promise<void> {
		if (!this.db) {
			this.db = await createInMemoryDatabase({ readOnly: false });
			await boot({
				sqlite: this.db,
				postEvent: (ev) => opts.onEvent(ev),
				args: opts.boot.args,
			});
		}
	}

	async create(opts: Parameters<LixBackend["create"]>[0]): Promise<void> {
		this.db = await createInMemoryDatabase({ readOnly: false });
		importDatabase({ db: this.db, content: new Uint8Array(opts.blob) });
		await boot({
			sqlite: this.db,
			postEvent: (ev) => opts.onEvent(ev),
			args: opts.boot.args,
		});
	}

	async exec(sql: string, params?: unknown[]): Promise<ExecResult> {
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
				`backend.exec failed: ${e?.message ?? e} -- SQL: ${sql}`
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

	async execBatch(
		batch: { sql: string; params?: unknown[] }[]
	): Promise<{ results: ExecResult[] }> {
		if (!this.db) throw new Error("Engine not initialized");
		const results: ExecResult[] = [];
		for (const item of batch) {
			results.push(await this.exec(item.sql, item.params));
		}
		return { results };
	}

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
	}

	async exists(): Promise<boolean> {
		// In-memory backend has no persisted store bound to a key/path.
		return false;
	}
}
