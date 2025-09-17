import { describe, expect, test } from "vitest";
import type {
	EnvironmentActorHandle,
	LixEnvironment,
	LixEnvironmentResult,
	SpawnActorOptions,
} from "./api.js";

class StubActorEnvironment implements LixEnvironment {
	private terminatedActors = new Set<EnvironmentActorHandle>();

	async open(
		_opts?: Parameters<LixEnvironment["open"]>[0]
	): Promise<{ engine?: undefined }> {
		return {};
	}

	async create(
		_opts?: Parameters<LixEnvironment["create"]>[0]
	): Promise<void> {}

	async exists(): Promise<boolean> {
		return false;
	}

	async exec(
		_sql?: string,
		_params?: unknown[]
	): Promise<LixEnvironmentResult> {
		return { rows: [] };
	}

	async export(): Promise<ArrayBuffer> {
		return new ArrayBuffer(0);
	}

	async close(): Promise<void> {
		this.terminatedActors.clear();
	}

	async call(_name: string, _payload?: unknown): Promise<unknown> {
		return undefined;
	}

	spawnActor = async (
		opts: SpawnActorOptions
	): Promise<EnvironmentActorHandle> => {
		const listeners = new Set<(message: unknown) => void>();
		const buffer: unknown[] = [];
		let terminated = false;
		const emit = (message: unknown) => {
			if (terminated) return;
			buffer.push(message);
			for (const listener of listeners) listener(message);
		};

		if (Object.prototype.hasOwnProperty.call(opts, "initialMessage")) {
			emit({ kind: "initial", data: opts.initialMessage });
		}

		const handle: EnvironmentActorHandle = {
			post: (message: unknown) => emit({ kind: "post", data: message }),
			subscribe: (listener) => {
				listeners.add(listener);
				for (const message of buffer) listener(message);
				return () => listeners.delete(listener);
			},
			terminate: async () => {
				terminated = true;
				listeners.clear();
			},
		};

		this.terminatedActors.add(handle);
		return handle;
	};
}

describe("LixEnvironment spawnActor", () => {
	test("delivers initial and posted messages", async () => {
		const env = new StubActorEnvironment();
		const actor = await env.spawnActor({
			entryModule: "stub://actor",
			initialMessage: { type: "boot" },
		});

		const events: Array<any> = [];
		const unsubscribe = actor.subscribe((event) => events.push(event));

		actor.post({ type: "ping" });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(events).toEqual(
			expect.arrayContaining([
				{ kind: "initial", data: { type: "boot" } },
				{ kind: "post", data: { type: "ping" } },
			])
		);

		unsubscribe();
		actor.post({ type: "ignored" });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(events).toHaveLength(2);
		await actor.terminate();
	});
});
