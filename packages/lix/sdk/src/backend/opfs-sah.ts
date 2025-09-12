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
	private static _instances = new Set<OpfsSahBackend>();
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
		OpfsSahBackend._instances.add(this);
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

	private send<T = any>(
		op: string,
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
			(this.worker as any).postMessage({ id, op, payload }, transfer ?? []);
		});
	}

	/**
	 * Invoke a named runtime function inside the worker engine.
	 */
	async call(
		name: string,
		payload?: unknown,
		_opts?: { signal?: AbortSignal }
	): Promise<unknown> {
		return this.send("call", { route: name, payload });
	}

	async open(initOpts: Parameters<LixBackend["open"]>[0]): Promise<void> {
		this.eventHandler = initOpts.onEvent;
		const payload: any = { name: this.dbKey, bootArgs: initOpts.boot.args };
		await this.send("open", payload);
	}

	async create(createOpts: Parameters<LixBackend["create"]>[0]): Promise<void> {
		this.eventHandler = createOpts.onEvent;
		const payload: any = {
			name: this.dbKey,
			blob: createOpts.blob,
			bootArgs: createOpts.boot.args,
		};
		await this.send("create", payload, [createOpts.blob]);
	}

	async exec(sql: string, params?: unknown[]): Promise<ExecResult> {
		return this.send("exec", { sql, params });
	}

	// execBatch intentionally omitted; loop over exec() instead.

	/**
	 * Export a snapshot of the current database as raw bytes.
	 *
	 * Worker returns one of two shapes for performance:
	 * - Fast path: `{ blob: ArrayBuffer }` (zero‑copy transfer)
	 * - Fallback: `{ buffer, offset, length }` (single copy on host)
	 */
	async export(): Promise<ArrayBuffer> {
		const res = await this.send<
			| { blob: ArrayBuffer }
			| { buffer: ArrayBuffer; offset: number; length: number }
		>("export", {});
		if ("blob" in res) return res.blob;
		const { buffer, offset, length } = res;
		if (offset === 0 && length === buffer.byteLength) return buffer;
		return buffer.slice(offset, offset + length);
	}

	async exists(): Promise<boolean> {
		return this.send<boolean>("exists", { name: this.dbKey });
	}

	async close(): Promise<void> {
		await this.send("close", {});
		this.worker.terminate();
		OpfsSahBackend._instances.delete(this);
	}

	/**
	 * Cleans the entire OPFS by removing all files.
	 * Useful for debugging and testing.
	 *
	 * WARNING! This will delete ALL files in OPFS, not just Lix files!
	 */
	static async clear(): Promise<void> {
		// Refuse to clear if any backend instances are still open to avoid races
		if (OpfsSahBackend._instances.size > 0) {
			const err: any = new Error(
				`Cannot clear OPFS: ${OpfsSahBackend._instances.size} database connection(s) are open. Close all connections before clearing.`
			);
			err.code = "LIX_OPFS_BUSY";
			throw err;
		}
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
