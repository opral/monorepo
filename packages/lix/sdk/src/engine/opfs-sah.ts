import type { LixEngine } from "./types.js";

/**
 * Host-side wrapper for the OPFS Worker engine.
 *
 * Spawns a Dedicated Worker and forwards calls via a minimal RPC.
 * Keeps the async LixEngine surface.
 *
 * @example
 * const engine = createOpfsSahWorker({ name: 'my.lix' })
 * await engine.init({ expProvideStringifiedPlugins: [code] })
 */
export function createOpfsSahWorker(opts?: { name?: string; pragmasMode?: "safe" | "turbo" }): LixEngine {
  const name = opts?.name ?? "lix.db";
  const pragmasMode = opts?.pragmasMode ?? "safe";
  const worker = new Worker(new URL("./opfs-sah.worker.js", import.meta.url), {
    type: "module",
  });

  let nextId = 0;
  const inflight = new Map<string, (r: any) => void>();
  worker.onmessage = (ev: MessageEvent) => {
    const msg = ev.data;
    const cb = inflight.get(msg?.id);
    if (cb) {
      inflight.delete(msg.id);
      cb(msg);
    }
  };

  function call<T = any>(type: string, payload: any, transfer?: Transferable[]): Promise<T> {
    const id = String(++nextId);
    return new Promise<T>((resolve, reject) => {
      inflight.set(id, (msg: any) => {
        if (msg.ok) resolve(msg.result as T);
        else reject(Object.assign(new Error(msg.error?.message ?? "Worker error"), msg.error));
      });
      (worker as any).postMessage({ id, type, payload }, transfer ?? []);
    });
  }

  return {
    async init(initOpts) {
      const payload: any = { name, pragmas: { mode: pragmasMode } };
      if (initOpts?.expProvideStringifiedPlugins) {
        payload.expProvideStringifiedPlugins = initOpts.expProvideStringifiedPlugins;
      }
      await call("init", payload);
    },
    async exec(sql: string, params?: unknown[]) {
      return call("exec", { sql, params });
    },
    async execBatch(batch) {
      return call("execBatch", { batch });
    },
    async export() {
      const res = await call<{ blob: ArrayBuffer }>("export", {});
      return res.blob;
    },
    async close() {
      await call("close", {});
      worker.terminate();
    },
  };
}
