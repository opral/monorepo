import {
	createInMemoryDatabase,
	type SqliteWasmDatabase,
} from "../database/sqlite/index.js";
import { boot } from "../engine/boot.js";
import type { Call } from "../engine/functions/router.js";
import type { BootArgs, LixEngine } from "../engine/boot.js";

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
			payload: { name: string; blob: ArrayBuffer };
	  }
	| { id: string; op: "exists"; payload: { name: string } }
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
let sqlite: any; // OpfsSAHPoolDb (sqlite3.oo1.DB subclass)
let currentOpfsPath: string | undefined;
let engineCall: Call | null = null;
let engine: LixEngine | null = null;

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
 * - "open": open an existing DB by key and boot the Lix engine.
 * - "create": import a blob for a new DB by key (refuses to overwrite) — no boot.
 * - "exists": check if a DB for the given key exists (via SAH pool metadata).
 * - execBatch: removed; host should loop over call('lix_exec_sync', ...) or use explicit transactions.
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

				// Open DB and boot engine
				const uri = `file:${opfsPath}?vfs=opfs-sahpool`;
				sqlite = new sqlite3Module.oo1.DB(uri, "c");
				(sqlite as any).sqlite3 = sqlite3Module;

				const bootArgs = (req.payload.bootArgs ?? {
					providePlugins: [],
					providePluginsRaw: [],
				}) as BootArgs;

				const res = await boot({
					// db is sqlite3.oo1 DB; engine expects sqlite-wasm compatible surface
					sqlite,
					emit: (ev) => {
						(self as any).postMessage({ type: "event", event: ev });
					},
					args: bootArgs,
				});
				engineCall = res.call ?? null;
				engine = res.engine ?? null;

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
				sqlite = undefined;
				currentOpfsPath = opfsPath;
				engine = null;
				engineCall = null;
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

			case "export": {
				if (!poolUtil || !sqlite) throw new Error("Engine not initialized");
				// Export using poolUtil (must match open path)
				const rawName = (
					sqlite?.getFilename?.() ??
					sqlite?.filename ??
					currentOpfsPath ??
					""
				).replace(/^file:/, "");
				const name = rawName.split("?")[0] || currentOpfsPath || rawName;
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
				if (sqlite) {
					sqlite.close();
				}
				// Keep VFS installed so the pool persists across sessions in this worker
				sqlite = undefined as any;
				currentOpfsPath = undefined;
				engine = null;
				engineCall = null;
				return { id: req.id, ok: true };
			}

			case "call": {
				if (!sqlite) throw new Error("Environment not initialized");
				const { route, payload } = req.payload as any;
				if (!engineCall) {
					return {
						id: req.id,
						ok: false,
						error: {
							name: "LixRpcError",
							message: "engine router unavailable",
							code: "LIX_RPC_ROUTER_UNAVAILABLE",
						},
					};
				}
				const result = await engineCall(route, payload);
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
