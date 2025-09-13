import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { InMemoryBackend } from "../backend/in-memory.js";
import { uuidV7 } from "./deterministic/uuid-v7.js";

test("generated a uuid v7", async () => {
	const engine = await openLix({
		backend: new InMemoryBackend(),
		pluginsRaw: [],
	});

	const id = await uuidV7({ lix: engine });

	expect(typeof id).toBe("string");
	expect(id.length).toBeGreaterThan(10);
});
