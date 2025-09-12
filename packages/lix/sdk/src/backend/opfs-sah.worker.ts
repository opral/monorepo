import {
	createInMemoryDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import { boot } from "../runtime/boot.js";
import type { Call } from "../runtime/router.js";
import type { BootArgs } from "../runtime/boot.js";

/**
 * Message types supported by the worker RPC.
 */
type Req =
	| {
			id: string;
			op: "open";
			payload: { name: string; bootArgs?: BootArgs };
	  }
	| {
			id: string;
			op: "create";
			payload: { name: string; blob: ArrayBuffer; bootArgs?: BootArgs };
	  }
	| { id: string; op: "exists"; payload: { name: string } }
	| { id: string; op: "exec"; payload: { sql: string; params?: unknown[] } }
	// execBatch removed
	| { id: string; op: "export"; payload: {} }
	| { id: string; op: "close"; payload: {} }
	| { id: string; op: "call"; payload: { route: string; payload?: unknown } };

/**
 * Response envelope returned by the worker RPC.
 */
type Res =
	| { id: string; ok: true; result?: any; transfer?: Transferable[] }
	| {
			id: string;
			ok: false;
			error: {
				name: string;
				message: string;
				code?: string | number;
				stack?: string;
			};
	  };

let sqlite3Module: any;
let poolUtil: any;
let db: any; // OpfsSAHPoolDb (sqlite3.oo1.DB subclass)
let currentOpfsPath: string | undefined;
let runtimeCall: Call | null = null;

/**
 * Normalize the client-provided logical database name for the SAH pool VFS.
 *
 * - The SAH pool uses a virtual filesystem keyed by names beginning with "/".
 * - Callers pass a simple logical key (e.g. "project-a"); this function
 *   ensures it is prefixed with "/" before passing to the VFS.
 *
 * @param name Logical database key provided by the host.
 * @returns Normalized SAH pool path (always prefixed with "/").
 */
function opfsName(name: string): string {
	return name.startsWith("/") ? name : "/" + name;
}

/**
 * Lazily initialize the sqlite3 module (loaded via an in-memory database helper).
 *
 * - This gives us a handle to the module required to install the SAH pool VFS
 *   and to open sqlite3.oo1.DB instances.
 * - Safe to call multiple times; subsequent calls are no-ops.
 */
async function ensureSqlite(): Promise<void> {
	if (!sqlite3Module) {
		const temp: SqliteWasmDatabase = await createInMemoryDatabase({
			readOnly: false,
		});
		sqlite3Module = temp.sqlite3;
	}
}

/**
 * Ensure the OPFS SyncAccessHandle pool VFS is installed exactly once per worker.
 *
 * - Installs the SAH pool VFS via sqlite3Module.installOpfsSAHPoolVfs().
 * - Retries a few times with backoff to avoid transient handle contention
 *   (e.g. immediately after a previous pool is released).
 * - Safe to call multiple times; subsequent calls are no-ops once poolUtil is set.
 */
async function ensurePool(): Promise<void> {
	await ensureSqlite();
	if (poolUtil) return;
	let attempts = 0;
	const maxAttempts = 4;
	while (true) {
		try {
			poolUtil = await sqlite3Module.installOpfsSAHPoolVfs();
			return;
		} catch (e: any) {
			attempts++;
			if (attempts >= maxAttempts) throw e;
			const delay = Math.pow(2, attempts - 1) * 25;
			await new Promise((r) => setTimeout(r, delay));
		}
	}
}

/**
 * Handle a single host → worker RPC request and return a response.
 *
 * Supported operations:
 * - "open": open an existing DB by key and boot the Lix runtime.
 * - "create": import a blob for a new DB by key (refuses to overwrite) — no boot.
 * - "exists": check if a DB for the given key exists (via SAH pool metadata).
 * - "exec": run a single SQL statement.
 * - execBatch: removed; host should loop over exec calls or use explicit transactions.
 * - "export": export the current DB bytes via the SAH pool.
 * - "close": close the current DB and release worker references (pool is kept).
 */
async function handle(req: Req): Promise<Res> {
	try {
		switch (req.op) {
			case "open": {
				// Ensure pool VFS is available
				await ensurePool();
				const opfsPath = opfsName(req.payload.name);
				currentOpfsPath = opfsPath;

				// Open DB and boot runtime
				const uri = `file:${opfsPath}?vfs=opfs-sahpool`;
				db = new sqlite3Module.oo1.DB(uri, "c");
				(db as any).sqlite3 = sqlite3Module;

				const bootArgs = (req.payload.bootArgs ?? {
					pluginsRaw: [],
				}) as BootArgs;

				const res = await boot({
					// db is sqlite3.oo1 DB; runtime expects sqlite-wasm compatible surface
					sqlite: db as any,
					postEvent: (ev) => {
						(self as any).postMessage({ type: "event", event: ev });
					},
					args: bootArgs,
				});
				runtimeCall = res.call;

				return { id: req.id, ok: true };
			}

			case "create": {
				// Ensure pool VFS is available
				await ensurePool();
				const opfsPath = opfsName(req.payload.name);
				currentOpfsPath = opfsPath;

				// Refuse overwrite to avoid data loss
				let exists = false;
				try {
					const existing = (poolUtil as any).exportFile(opfsPath) as Uint8Array;
					exists = !!existing && existing.byteLength > 0;
				} catch {
					exists = false;
				}
				if (exists) {
					throw Object.assign(
						new Error(
							"OPFS SAH VFS: database already exists for this name; refusing to import seed blob to avoid data loss"
						),
						{ code: "LIX_OPFS_ALREADY_EXISTS" }
					);
				}

				// Import the provided blob into the SAH pool
				(poolUtil as any).importDb(opfsPath, new Uint8Array(req.payload.blob));

				// Creation is import-only. The host is expected to call "open" next.
				db = undefined;
				currentOpfsPath = opfsPath;
				return { id: req.id, ok: true };
			}

			case "exists": {
				// Check via pool metadata whether the DB for the given name exists
				await ensurePool();
				const opfsPath = opfsName(req.payload.name);
				let exists = false;
				try {
					const bytes = (poolUtil as any).exportFile(opfsPath) as Uint8Array;
					exists = !!bytes && bytes.byteLength > 0;
				} catch {
					exists = false;
				}
				return { id: req.id, ok: true, result: exists };
			}

			case "exec": {
				if (!db) throw new Error("Engine not initialized");
				const columnNames: string[] = [];
				const rows = db.exec({
					sql: req.payload.sql,
					bind: (req.payload.params ?? []) as any[],
					returnValue: "resultRows",
					rowMode: "object",
					columnNames,
				}) as any[];

				// Derive last_insert_rowid via SQL
				const r = db.exec({
					sql: "SELECT last_insert_rowid() AS id",
					returnValue: "resultRows",
					rowMode: "object",
				}) as any[];
				const lastInsertRowid = Number(r?.[0]?.id);
				const changes = db.changes ? db.changes() || undefined : undefined;

				return {
					id: req.id,
					ok: true,
					result: { rows, changes, lastInsertRowid },
				};
			}

			case "export": {
				if (!poolUtil || !db) throw new Error("Engine not initialized");
				// Export using poolUtil (must match open path)
				const name = (
					db?.getFilename?.() ??
					db?.filename ??
					currentOpfsPath ??
					""
				).replace(/^file:/, "");
				const bytes: Uint8Array = poolUtil.exportFile(name);
				const buf = bytes.buffer.slice(
					bytes.byteOffset,
					bytes.byteOffset + bytes.byteLength
				);
				return {
					id: req.id,
					ok: true,
					result: { blob: buf },
					transfer: [buf],
				};
			}

			case "close": {
				if (db) {
					db.close();
				}
				// Keep VFS installed so the pool persists across sessions in this worker
				db = undefined as any;
				currentOpfsPath = undefined;
				return { id: req.id, ok: true };
			}

			case "call": {
				if (!db) throw new Error("Backend not initialized");
				const { route, payload } = req.payload as any;
				if (!runtimeCall) {
					return {
						id: req.id,
						ok: false,
						error: {
							name: "LixRpcError",
							message: "Runtime router unavailable",
							code: "LIX_RPC_ROUTER_UNAVAILABLE",
						},
					};
				}
				const result = await runtimeCall(route, payload);
				return { id: req.id, ok: true, result };
			}
		}
	} catch (err: any) {
		return {
			id: req.id,
			ok: false,
			error: {
				name: err?.name ?? "Error",
				message: String(err?.message ?? err),
				code: err?.code,
				stack: err?.stack ? String(err.stack) : undefined,
			},
		};
	}
}

self.onmessage = async (ev: MessageEvent<Req>) => {
	const res = await handle(ev.data);
	const transfer = (res as any).transfer as Transferable[] | undefined;
	if (transfer && transfer.length) {
		(self as any).postMessage(res, transfer);
	} else {
		(self as any).postMessage(res);
	}
};
