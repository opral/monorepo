import { afterAll, beforeAll, bench, describe } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { nanoId, nanoIdSync } from "./nano-id.js";

const deterministicModeSeed = {
	key: "lix_deterministic_mode",
	value: { enabled: true },
};

describe("nanoId deterministic mode", () => {
	describe("async nanoId", () => {
		let lix: Awaited<ReturnType<typeof openLix>>;

		beforeAll(async () => {
			lix = await openLix({ keyValues: [deterministicModeSeed] });
		});

		afterAll(async () => {
			await lix.close();
		});

		bench("nanoId - async deterministic generation", async () => {
			for (let i = 0; i < 10; i++) {
				const id = await nanoId({ lix });
				if (!id.startsWith("test_")) {
					throw new Error("deterministic nanoId lost test_ prefix");
				}
			}
		});
	});

	describe("sync nanoId", () => {
		let lix: Awaited<ReturnType<typeof openLix>>;

		beforeAll(async () => {
			lix = await openLix({ keyValues: [deterministicModeSeed] });
		});

		afterAll(async () => {
			await lix.close();
		});

		bench("nanoIdSync - engine deterministic generation", async () => {
			const engine = lix.engine;
			if (!engine) {
				throw new Error("nanoIdSync benchmark requires in-process engine");
			}

			for (let i = 0; i < 10; i++) {
				const id = nanoIdSync({ engine });
				if (!id.startsWith("test_")) {
					throw new Error("deterministic nanoId lost test_ prefix (sync)");
				}
			}
		});
	});
});
