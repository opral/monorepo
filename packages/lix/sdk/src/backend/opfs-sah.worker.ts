import {
	createInMemoryDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import { boot } from "../runtime/boot.js";
import type { BootArgs } from "../runtime/boot.js";

type Req =
	| {
			id: string;
			type: "init";
			payload: { name: string; blob?: ArrayBuffer; bootArgs?: BootArgs };
	  }
	| { id: string; type: "exec"; payload: { sql: string; params?: unknown[] } }
	| {
			id: string;
			type: "execBatch";
			payload: { batch: { sql: string; params?: unknown[] }[] };
	  }
	| { id: string; type: "export"; payload: {} }
	| { id: string; type: "close"; payload: {} };

type Res =
	| { id: string; ok: true; result?: any; transfer?: Transferable[] }
	| {
			id: string;
			ok: false;
			error: { name: string; message: string; code?: string | number };
	  };

let sqlite3Module: any;
let poolUtil: any;
let db: any; // OpfsSAHPoolDb (sqlite3.oo1.DB subclass)
let currentOpfsPath: string | undefined;

async function handle(req: Req): Promise<Res> {
	try {
		switch (req.type) {
			case "init": {
				// Initialize sqlite3 module via in-memory helper (gives us module reference)
				const temp: SqliteWasmDatabase = await createInMemoryDatabase({
					readOnly: false,
				});
				sqlite3Module = temp.sqlite3;
				// Name must be absolute-like for SAHPool (virtual path)
				const opfsPath = req.payload.name.startsWith("/")
					? req.payload.name
					: "/" + req.payload.name;
				currentOpfsPath = opfsPath;
				// Install SAHPool VFS
				// Retry a few times in case a previous handle is still releasing.
				{
					let attempts = 0;
					const maxAttempts = 4;
					// 0, 25, 50, 100ms backoff
					while (true) {
						try {
							poolUtil = await sqlite3Module.installOpfsSAHPoolVfs();
							break;
						} catch (e: any) {
							attempts++;
							if (attempts >= maxAttempts) throw e;
							const delay = Math.pow(2, attempts - 1) * 25;
							await new Promise((r) => setTimeout(r, delay));
						}
					}
				}
				// If a blob is provided, import via the SAH pool utility (assume importDb exists).
				if (req.payload.blob) {
					const seedBytes = new Uint8Array(req.payload.blob);
					try {
						(poolUtil as any).importDb(opfsPath, seedBytes);
					} catch {
						// Non-fatal: proceed to open/boot even if import fails
					}
				}

				// Open DB using the installed SAHPool VFS via URI. Using sqlite3.oo1.DB ensures
				// the returned object exposes sqlite3/capi and createFunction for runtime boot.
				const uri = `file:${opfsPath}?vfs=opfs-sahpool`;
				db = new sqlite3Module.oo1.DB(uri, "c");
				// Ensure sqlite3 module is reachable from the DB object so runtime boot
				// can access capi and vtab APIs.
				(db as any).sqlite3 = sqlite3Module;

				// No PRAGMAs here; rely on SQLite defaults for stability.

				// Run runtime boot inside worker
				const bootArgs = (req.payload.bootArgs ?? {
					pluginsRaw: [],
				}) as BootArgs;
				await boot({
					// db is sqlite3.oo1 DB; runtime expects sqlite-wasm compatible surface
					// at runtime this is sufficient
					sqlite: db as any,
					postEvent: (ev) => {
						(self as any).postMessage({ type: "event", event: ev });
					},
					args: bootArgs,
				});
				return { id: req.id, ok: true };
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
				// SAFETY: OpfsSAHPoolDb does not expose a direct low-level handle for last_insert_rowid via capi.
				// Derive via SQL instead and tolerate failures.
				let lastInsertRowid: number | undefined = undefined;
				try {
					const r = db.exec({
						sql: "SELECT last_insert_rowid() AS id",
						returnValue: "resultRows",
						rowMode: "object",
					}) as any[];
					lastInsertRowid = Number(r?.[0]?.id);
				} catch {}
				const changes = db.changes ? db.changes() || undefined : undefined;
				return {
					id: req.id,
					ok: true,
					result: { rows, changes, lastInsertRowid },
				};
			}
			case "execBatch": {
				if (!db) throw new Error("Engine not initialized");
				const results: any[] = [];
				for (const item of req.payload.batch) {
					const r = (await handle({
						id: req.id,
						type: "exec",
						payload: item as any,
					})) as any;
					results.push(r.result);
				}
				return { id: req.id, ok: true, result: { results } };
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
				return { id: req.id, ok: true, result: { blob: buf }, transfer: [buf] };
			}
			case "close": {
				if (db) {
					db.close();
				}
				// Release SAH pool VFS handles. Let errors bubble if any.
				(poolUtil as any).removeVfs();
				db = undefined as any;
				currentOpfsPath = undefined;
				return { id: req.id, ok: true };
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
