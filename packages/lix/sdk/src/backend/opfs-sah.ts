import type { LixBackend } from "./types.js";

/**
 * Host-side wrapper for the OPFS Worker engine.
 *
 * Spawns a Dedicated Worker and forwards calls via a minimal RPC.
 * Keeps the async LixBackend surface.
 *
 * @example
 * const backend = OpfsSahWorker({ name: 'my.lix' })
 * await backend.init({ blob, boot: { args: { pluginsRaw: [] } }, onEvent: () => {} })
 */
export function OpfsSahWorker(): LixBackend {
	const worker = new Worker(new URL("./opfs-sah.worker.js", import.meta.url), {
		type: "module",
	});

	let nextId = 0;
	const inflight = new Map<string, (r: any) => void>();
	let eventHandler: ((ev: any) => void) | undefined;
	worker.onmessage = (ev: MessageEvent) => {
		const msg = ev.data;
		if (msg && msg.type === "event" && msg.event) {
			eventHandler?.(msg.event);
			return;
		}
		const cb = inflight.get(msg?.id);
		if (cb) {
			inflight.delete(msg.id);
			cb(msg);
		}
	};

	function call<T = any>(
		type: string,
		payload: any,
		transfer?: Transferable[]
	): Promise<T> {
		const id = String(++nextId);
		return new Promise<T>((resolve, reject) => {
			inflight.set(id, (msg: any) => {
				if (msg.ok) resolve(msg.result as T);
				else
					reject(
						Object.assign(
							new Error(msg.error?.message ?? "Worker error"),
							msg.error
						)
					);
			});
			(worker as any).postMessage({ id, type, payload }, transfer ?? []);
		});
	}

	return {
		async init(initOpts) {
			eventHandler = initOpts.onEvent;
			const payload: any = { name: initOpts.path ?? "lix.db" };
			if (initOpts.blob) {
				payload.blob = initOpts.blob;
			}
			payload.bootArgs = initOpts.boot.args;
			await call("init", payload, initOpts.blob ? [initOpts.blob] : undefined);
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
