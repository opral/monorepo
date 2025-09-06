import { bench } from "vitest";
import { openLix } from "./open-lix.js";

// Measure baseline boot time for creating an in-memory Lix
bench("openLix (empty, in-memory)", async () => {
	const lix = await openLix({});
	await lix.close();
});

// Optional: opening with a small set of key-values to simulate common init path
bench("openLix with 1 keyValue", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		] as any,
	});
	await lix.close();
});
