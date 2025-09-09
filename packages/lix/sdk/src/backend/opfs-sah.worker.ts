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
				// Install SAHPool VFS
				poolUtil = await sqlite3Module.installOpfsSAHPoolVfs();
				// Name must be absolute-like for SAHPool (virtual path)
				const opfsPath = req.payload.name.startsWith("/")
					? req.payload.name
					: "/" + req.payload.name;
				currentOpfsPath = opfsPath;
				// If a blob is provided, write it to OPFS before opening DB
				if (
					req.payload.blob &&
					typeof navigator !== "undefined" &&
					(navigator as any).storage?.getDirectory
				) {
					try {
						const root: any = await (navigator as any).storage.getDirectory();
						const fname = opfsPath.startsWith("/")
							? opfsPath.slice(1)
							: opfsPath;
						const fileHandle = await root.getFileHandle(fname, {
							create: true,
						});
						const writable = await fileHandle.createWritable({
							keepExistingData: false,
						});
						await writable.write(new Uint8Array(req.payload.blob));
						await writable.close();
					} catch (e) {
						// ignore if OPFS unavailable; DB will be empty
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
				if (db) db.close();
				db = undefined;
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
