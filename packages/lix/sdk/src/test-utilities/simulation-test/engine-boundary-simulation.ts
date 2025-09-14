import type { SimulationTestDef } from "./simulation-test.js";
import { openLix } from "../../lix/open-lix.js";
import type {
	LixEnvironment,
	LixEnvironmentResult,
} from "../../environment/types.js";
import { InMemoryEnvironment } from "../../environment/in-memory.js";

export const engineBoundarySimulation: SimulationTestDef = {
	name: "engine boundary",
	setup: async (lix) => {
		// Re-seed into an isomorphic boundary environment that hides engine
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
			environment: new EngineBoundaryEnvironment(),
			providePlugins,
		});
		return boundaryLix;
	},
};

// Inline, isomorphic environment wrapper that hides the engine from openLix()
class EngineBoundaryEnvironment implements LixEnvironment {
	private inner: InMemoryEnvironment;
	private eventHandler: ((ev: any) => void) | undefined;

	constructor() {
		this.inner = new InMemoryEnvironment();
	}

	async call(
		name: string,
		payload?: unknown,
		opts?: { signal?: AbortSignal }
	): Promise<unknown> {
		return this.inner.call(name, payload, opts);
	}

	async open(initOpts: Parameters<LixEnvironment["open"]>[0]): Promise<void> {
		this.eventHandler = initOpts.onEvent;
		// Boot the inner engine but intentionally do not return its engine
		await this.inner.open(initOpts);
		// undefined return keeps lix.engine absent to simulate boundary
	}

	async create(
		createOpts: Parameters<LixEnvironment["create"]>[0]
	): Promise<void> {
		this.eventHandler = createOpts.onEvent;
		await this.inner.create(createOpts);
	}

	async exec(sql: string, params?: unknown[]): Promise<LixEnvironmentResult> {
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
