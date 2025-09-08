import {
	createInMemoryDatabase,
	importDatabase,
	contentFromDatabase,
	type SqliteWasmDatabase,
} from "sqlite-wasm-kysely";
import { loadPluginFromString } from "./load-from-string.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

type Req =
	| {
			id: string;
			type: "init";
			payload: {
				path: string;
				blob?: ArrayBuffer;
				expProvideStringifiedPlugins?: string[];
			};
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

let db: SqliteWasmDatabase | undefined;
let opfsPath: string | undefined;
let saveTimer: any | undefined;
let plugins: LixPlugin[] = [];
let txnDepth = 0;

async function scheduleSave() {
	if (!opfsPath || !db) return;
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(async () => {
		try {
			const bytes = contentFromDatabase(db!);
			const root: FileSystemDirectoryHandle =
				await navigator.storage.getDirectory();
			const handle = await root.getFileHandle(opfsPath!, { create: true });
			const writable = await (handle as any).createWritable({
				keepExistingData: false,
			});
			await writable.write(bytes as unknown as Uint8Array);
			await writable.close();
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error("OPFS save failed:", err);
		}
	}, 300);
}

function trackTxn(sql: string) {
	const s = sql.trim().toUpperCase();
	if (s.startsWith("BEGIN") || s.startsWith("SAVEPOINT")) {
		txnDepth++;
	} else if (
		s.startsWith("COMMIT") ||
		s.startsWith("END") ||
		s.startsWith("RELEASE")
	) {
		txnDepth = Math.max(0, txnDepth - 1);
		if (txnDepth === 0 && (s.startsWith("COMMIT") || s.startsWith("END"))) {
			void scheduleSave();
		}
	} else if (s.startsWith("ROLLBACK")) {
		txnDepth = 0;
	}
}

async function handle(req: Req): Promise<Res> {
	try {
		switch (req.type) {
			case "init": {
				db = await createInMemoryDatabase({ readOnly: false });
				if (!req.payload.path) {
					throw new Error("opfs.worker requires a persistence path");
				}
				opfsPath = req.payload.path;
				if (req.payload.blob) {
					importDatabase({ db, content: new Uint8Array(req.payload.blob) });
				} else {
					try {
						const root: FileSystemDirectoryHandle =
							await navigator.storage.getDirectory();
						const handle = await root.getFileHandle(opfsPath);
						const file = await handle.getFile();
						const buf = new Uint8Array(await file.arrayBuffer());
						importDatabase({ db, content: buf });
					} catch {
						// ignore missing file – start with empty DB
					}
				}
				plugins = [];
				for (const code of req.payload.expProvideStringifiedPlugins ?? []) {
					try {
						plugins.push(await loadPluginFromString(code));
					} catch (err) {
						// eslint-disable-next-line no-console
						console.error("Failed to load plugin:", err);
					}
				}
				return { id: req.id, ok: true };
			}
			case "exec": {
				if (!db) throw new Error("Engine not initialized");
				trackTxn(req.payload.sql);
				const columnNames: string[] = [];
				const rows = db.exec({
					sql: req.payload.sql,
					bind: (req.payload.params ?? []) as any[],
					returnValue: "resultRows",
					rowMode: "object",
					columnNames,
				}) as any[];
				const lastInsertRowid = db.sqlite3.capi.sqlite3_last_insert_rowid(db);
				const changes = db.changes() || undefined;
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
					results.push(
						(await handle({ id: req.id, type: "exec", payload: item as any }))
							.result
					);
				}
				return { id: req.id, ok: true, result: { results } };
			}
			case "export": {
				if (!db) throw new Error("Engine not initialized");
				const bytes = contentFromDatabase(db);
				const arrBuf = bytes.buffer.slice(
					bytes.byteOffset,
					bytes.byteOffset + bytes.byteLength
				);
				return {
					id: req.id,
					ok: true,
					result: { blob: arrBuf },
					transfer: [arrBuf],
				};
			}
			case "close": {
				if (saveTimer) clearTimeout(saveTimer);
				if (db) db.close();
				db = undefined;
				plugins = [];
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
	if (transfer && transfer.length > 0) {
		(self as any).postMessage(res, transfer);
	} else {
		(self as any).postMessage(res);
	}
};
