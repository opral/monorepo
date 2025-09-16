import type { LixEnvironment, LixEnvironmentResult } from "./types.js";

/**
 * OPFS SAH‑pool environment implemented with a Dedicated Worker.
 *
 * Spawns a Worker and forwards calls via a minimal RPC while keeping the
 * environment async surface. Use one instance per logical database key.
 *
 * @example
 * // Instance API
 * const env = new OpfsSahEnvironment({ key: 'default' })
 * await env.open({ boot: { args: { pluginsRaw: [] } }, emit })
 *
 * @example
 * // Static helper: clear all OPFS data for this origin (destructive)
 * await OpfsSahEnvironment.clear()
 */
export class OpfsSahEnvironment implements LixEnvironment {
	private static _instances = new Set<OpfsSahEnvironment>();
	private static _openByKey = new Map<string, OpfsSahEnvironment>();
	private worker: Worker;
	private nextId = 0;
	private inflight = new Map<string, (r: any) => void>();
	private eventHandler: ((ev: any) => void) | undefined;
	private readonly dbKey: string;
	private isOpen = false;

	constructor(opts?: { key?: string }) {
		this.dbKey = opts?.key || "default";
		this.worker = new Worker(new URL("./opfs-sah.worker.js", import.meta.url), {
			type: "module",
		});
		OpfsSahEnvironment._instances.add(this);
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
	 * Invoke a named engine function inside the worker engine.
	 */
	async call(
		name: string,
		payload?: unknown,
		_opts?: { signal?: AbortSignal }
	): Promise<unknown> {
		return this.send("call", { route: name, payload });
	}

	async open(
		initOpts: Parameters<LixEnvironment["open"]>[0]
	): Promise<{ engine?: import("../engine/boot.js").LixEngine }> {
		if (this.isOpen) return {};
		const existing = OpfsSahEnvironment._openByKey.get(this.dbKey);
		if (existing && existing !== this) {
			const err: any = new Error(
				`OPFS environment for key "${this.dbKey}" is already open. Close the existing connection before opening a new one.`
			);
			err.code = "ENV_OPFS_ALREADY_OPEN";
			throw err;
		}
		this.eventHandler = initOpts.emit;
		const payload: any = { name: this.dbKey, bootArgs: initOpts.boot.args };
		await this.send("open", payload);
		this.isOpen = true;
		OpfsSahEnvironment._openByKey.set(this.dbKey, this);
		return {};
	}

	async create(
		createOpts: Parameters<LixEnvironment["create"]>[0]
	): Promise<void> {
		const payload: any = {
			name: this.dbKey,
			blob: createOpts.blob,
		};
		await this.send("create", payload, [createOpts.blob]);
	}

	async exec(sql: string, params?: unknown[]): Promise<LixEnvironmentResult> {
		return this.send("exec", { sql, params });
	}

	// execBatch intentionally omitted; loop over exec() instead.

	/**
	 * Export the SQLite database image as raw bytes.
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
		if (this.isOpen) {
			try {
				await this.send("close", {});
			} finally {
				this.isOpen = false;
				if (OpfsSahEnvironment._openByKey.get(this.dbKey) === this) {
					OpfsSahEnvironment._openByKey.delete(this.dbKey);
				}
			}
		}
		this.worker.terminate();
		OpfsSahEnvironment._instances.delete(this);
	}

	/**
	 * Cleans the entire OPFS by removing all files.
	 * Useful for debugging and testing.
	 *
	 * WARNING! This will delete ALL files in OPFS, not just Lix files!
	 */
	static async clear(): Promise<void> {
		// Refuse to clear if any environment instances are still open to avoid races
		if (OpfsSahEnvironment._instances.size > 0) {
			const err: any = new Error(
				`Cannot clear OPFS: ${OpfsSahEnvironment._instances.size} database connection(s) are open. Close all connections before clearing.`
			);
			err.code = "ENV_OPFS_BUSY";
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
