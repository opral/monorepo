import type { LixBackend, ExecResult } from "./types.js";

/**
 * OPFS SAH‑pool backend implemented with a Dedicated Worker.
 *
 * Spawns a Worker and forwards calls via a minimal RPC while keeping the
 * `LixBackend` async surface. Use one instance per logical database key.
 *
 * @example
 * // Instance API
 * const backend = new OpfsSahBackend({ key: 'default' })
 * await backend.open({ boot: { args: { pluginsRaw: [] } }, onEvent })
 *
 * @example
 * // Static helper: clear all OPFS data for this origin (destructive)
 * await OpfsSahBackend.clear()
 */
export class OpfsSahBackend implements LixBackend {
	private worker: Worker;
	private nextId = 0;
	private inflight = new Map<string, (r: any) => void>();
	private eventHandler: ((ev: any) => void) | undefined;
	private readonly dbKey: string;

	constructor(opts?: { key?: string }) {
		this.dbKey = opts?.key || "default";
		this.worker = new Worker(new URL("./opfs-sah.worker.js", import.meta.url), {
			type: "module",
		});
		this.worker.onmessage = (ev: MessageEvent) => {
			const msg = (ev as any).data;
			if (msg && msg.type === "event" && msg.event) {
				this.eventHandler?.(msg.event);
				return;
			}
			const cb = this.inflight.get(msg?.id);
			if (cb) {
				this.inflight.delete(msg.id);
				cb(msg);
			}
		};
	}

	private call<T = any>(
		type: string,
		payload: any,
		transfer?: Transferable[]
	): Promise<T> {
		const id = String(++this.nextId);
		return new Promise<T>((resolve, reject) => {
			this.inflight.set(id, (msg: any) => {
				if (msg.ok) resolve(msg.result as T);
				else
					reject(
						Object.assign(
							new Error(msg.error?.message ?? "Worker error"),
							msg.error
						)
					);
			});
			(this.worker as any).postMessage({ id, type, payload }, transfer ?? []);
		});
	}

	async open(initOpts: Parameters<LixBackend["open"]>[0]): Promise<void> {
		this.eventHandler = initOpts.onEvent;
		const payload: any = { name: this.dbKey, bootArgs: initOpts.boot.args };
		await this.call("open", payload);
	}

	async create(createOpts: Parameters<LixBackend["create"]>[0]): Promise<void> {
		this.eventHandler = createOpts.onEvent;
		const payload: any = {
			name: this.dbKey,
			blob: createOpts.blob,
			bootArgs: createOpts.boot.args,
		};
		await this.call("create", payload, [createOpts.blob]);
	}

	async exec(sql: string, params?: unknown[]): Promise<ExecResult> {
		return this.call("exec", { sql, params });
	}

	async execBatch(
		batch: { sql: string; params?: unknown[] }[]
	): Promise<{ results: ExecResult[] }> {
		return this.call("execBatch", { batch });
	}

	/**
	 * Export a snapshot of the current database as raw bytes.
	 *
	 * Worker returns one of two shapes for performance:
	 * - Fast path: `{ blob: ArrayBuffer }` (zero‑copy transfer)
	 * - Fallback: `{ buffer, offset, length }` (single copy on host)
	 */
	async export(): Promise<ArrayBuffer> {
		const res = await this.call<
			| { blob: ArrayBuffer }
			| { buffer: ArrayBuffer; offset: number; length: number }
		>("export", {});
		if ("blob" in res) return res.blob;
		const { buffer, offset, length } = res;
		if (offset === 0 && length === buffer.byteLength) return buffer;
		return buffer.slice(offset, offset + length);
	}

	async exists(): Promise<boolean> {
		return this.call<boolean>("exists", { name: this.dbKey });
	}

	async close(): Promise<void> {
		await this.call("close", {});
		this.worker.terminate();
	}

	/**
	 * Cleans the entire OPFS by removing all files.
	 * Useful for debugging and testing.
	 *
	 * WARNING! This will delete ALL files in OPFS, not just Lix files!
	 */
	static async clear(): Promise<void> {
		if (typeof navigator === "undefined" || !navigator.storage?.getDirectory) {
			throw new Error(
				"OPFS not available: navigator.storage.getDirectory() is missing"
			);
		}
		const root = await navigator.storage.getDirectory();

		// Prefer DirectoryHandle.values() if present (not always typed in libdom)
		const hasValues = typeof (root as any).values === "function";
		const hasEntries = typeof (root as any).entries === "function";

		const remove = async (name: string, kind: string) => {
			try {
				if (kind === "directory") {
					await (root as any).removeEntry(name, { recursive: true });
				} else {
					await (root as any).removeEntry(name);
				}
			} catch (e) {
				// Best effort: ignore failures on already-removed entries
			}
		};

		if (hasValues) {
			for await (const handle of (root as any).values()) {
				await remove(handle.name, handle.kind);
			}
			return;
		}

		if (hasEntries) {
			for await (const [name, handle] of (root as any).entries()) {
				await remove(name, (handle as any).kind);
			}
			return;
		}
	}
}
