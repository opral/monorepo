import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createLog } from "./create-log.js";

test("createLog should work", async () => {
	const lix = await openLixInMemory({});

	const result = await createLog({
		lix,
		key: "test.key",
		message: "test.message",
		level: "info",
	});

	// Check if the log was actually created (it should be, by default)
	expect(result).toBeDefined();
	if (result) {
		expect(result.key).toBe("test.key");
		expect(result.message).toBe("test.message");
		expect(result.level).toBe("info");
	}
});
