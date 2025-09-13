import type { SimulationTestDef } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import type { LixBackend, ExecResult } from "../../backend/types.js";
import { InMemoryBackend } from "../../backend/in-memory.js";

export const engineBoundarySimulation: SimulationTestDef = {
	name: "engine boundary",
	setup: async (lix) => {
		// Re-seed into an isomorphic boundary backend that hides engine
		const blob = await lix.toBlob();
		// Preserve plugin instances from the original session if available
		const providePlugins = await (async () => {
			try {
				return await (lix as any).plugin?.getAll?.();
			} catch {
				return undefined;
			}
		})();
		await lix.close();
		const boundaryLix = await openLix({
			blob,
			backend: new EngineBoundaryBackend(),
			providePlugins,
		});
		return boundaryLix;
	},
};

// Inline, isomorphic backend wrapper that hides the engine from openLix()
class EngineBoundaryBackend implements LixBackend {
	private inner: InMemoryBackend;
	private eventHandler: ((ev: any) => void) | undefined;

	constructor() {
		this.inner = new InMemoryBackend();
	}

	async call(
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	): Promise<unknown> {
		return this.inner.call(name, payload, opts);
	}

	async open(initOpts: Parameters<LixBackend["open"]>[0]): Promise<void> {
		this.eventHandler = initOpts.onEvent;
		// Boot the inner engine but intentionally do not return its engine
		await this.inner.open(initOpts);
		// undefined return keeps lix.engine absent to simulate boundary
	}

	async create(createOpts: Parameters<LixBackend["create"]>[0]): Promise<void> {
		this.eventHandler = createOpts.onEvent;
		await this.inner.create(createOpts);
	}

	async exec(sql: string, params?: unknown[]): Promise<ExecResult> {
		return this.inner.exec(sql, params);
	}

	async export(): Promise<ArrayBuffer> {
		return this.inner.export();
	}

	async exists(): Promise<boolean> {
		return this.inner.exists();
	}

	async close(): Promise<void> {
		await this.inner.close();
	}
}
