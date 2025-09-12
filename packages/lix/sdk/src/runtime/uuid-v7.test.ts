import { test, expect } from "vitest";
import { openLixBackend } from "../lix/open-lix-backend.js";
import { InMemoryBackend } from "../backend/in-memory.js";
import uuidV7 from "./uuid-v7.js";

test("generated a uuid v7", async () => {
	const engine = await openLixBackend({
		backend: new InMemoryBackend(),
		pluginsRaw: [],
	});

	const id = await uuidV7({ lix: engine });

	expect(typeof id).toBe("string");
	expect(id.length).toBeGreaterThan(10);
});
