import { createInMemoryDatabase, type SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixPlugin } from "../plugin/lix-plugin.js";
import { loadPluginFromString } from "./load-from-string.js";

type Req =
  | { id: string; type: "init"; payload: { name: string; expProvideStringifiedPlugins?: string[]; pragmas?: { mode?: "safe" | "turbo" } } }
  | { id: string; type: "exec"; payload: { sql: string; params?: unknown[] } }
  | { id: string; type: "execBatch"; payload: { batch: { sql: string; params?: unknown[] }[] } }
  | { id: string; type: "export"; payload: {} }
  | { id: string; type: "close"; payload: {} };

type Res =
  | { id: string; ok: true; result?: any; transfer?: Transferable[] }
  | { id: string; ok: false; error: { name: string; message: string; code?: string | number } };

let sqlite3Module: any;
let poolUtil: any;
let db: any; // OpfsSAHPoolDb (sqlite3.oo1.DB subclass)
let plugins: LixPlugin[] = [];

async function handle(req: Req): Promise<Res> {
  try {
    switch (req.type) {
      case "init": {
        // Initialize sqlite3 module via in-memory helper (gives us module reference)
        const temp: SqliteWasmDatabase = await createInMemoryDatabase({ readOnly: false });
        sqlite3Module = temp.sqlite3;
        // Install SAHPool VFS
        poolUtil = await sqlite3Module.installOpfsSAHPoolVfs();
        // Name must be absolute-like for SAHPool (virtual path)
        const filePath = req.payload.name.startsWith("/") ? req.payload.name : "/" + req.payload.name;
        db = new poolUtil.OpfsSAHPoolDb(filePath);

        // PRAGMAs
        const mode = req.payload.pragmas?.mode ?? "safe";
        if (mode === "safe") {
          db.exec("PRAGMA synchronous=NORMAL;");
          db.exec("PRAGMA journal_mode=DELETE;");
          db.exec("PRAGMA temp_store=MEMORY;");
          db.exec("PRAGMA cache_size=-65536;");
          db.exec("PRAGMA locking_mode=EXCLUSIVE;");
        } else if (mode === "turbo") {
          db.exec("PRAGMA synchronous=OFF;");
          db.exec("PRAGMA journal_mode=OFF;");
          db.exec("PRAGMA temp_store=MEMORY;");
          db.exec("PRAGMA cache_size=-131072;");
        }

        // Load plugins if provided
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
        const columnNames: string[] = [];
        const rows = db.exec({
          sql: req.payload.sql,
          bind: (req.payload.params ?? []) as any[],
          returnValue: "resultRows",
          rowMode: "object",
          columnNames,
        }) as any[];
        const lastInsertRowid = sqlite3Module.capi.sqlite3_last_insert_rowid(db);
        const changes = db.changes() || undefined;
        return { id: req.id, ok: true, result: { rows, changes, lastInsertRowid } };
      }
      case "execBatch": {
        if (!db) throw new Error("Engine not initialized");
        const results: any[] = [];
        for (const item of req.payload.batch) {
          const r = (await handle({ id: req.id, type: "exec", payload: item as any })) as any;
          results.push(r.result);
        }
        return { id: req.id, ok: true, result: { results } };
      }
      case "export": {
        if (!poolUtil || !db) throw new Error("Engine not initialized");
        // Export using poolUtil (must match open path)
        const name = db.filename ?? db?.getFilename?.() ?? undefined;
        const bytes: Uint8Array = poolUtil.exportFile(name);
        const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        return { id: req.id, ok: true, result: { blob: buf }, transfer: [buf] };
      }
      case "close": {
        if (db) db.close();
        db = undefined;
        plugins = [];
        return { id: req.id, ok: true };
      }
    }
  } catch (err: any) {
    return { id: req.id, ok: false, error: { name: err?.name ?? "Error", message: String(err?.message ?? err), code: err?.code } };
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
