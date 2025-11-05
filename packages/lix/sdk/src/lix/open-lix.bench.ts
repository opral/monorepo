import { bench, describe } from "vitest";
import { openLix } from "./open-lix.js";

describe("openLix baselines", () => {
	bench("openLix (empty, in-memory)", async () => {
		const lix = await openLix({});
		await lix.close();
	});

	describe("with key values", () => {
		bench("openLix with 1 keyValue", async () => {
			const lix = await openLix({
				keyValues: [
					{
						key: "lix_deterministic_mode",
						value: { enabled: true },
					},
				],
			});
			await lix.close();
		});
	});
});
