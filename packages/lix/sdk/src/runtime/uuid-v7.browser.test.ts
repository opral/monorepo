import { test, expect } from "vitest";
import { openLixBackend } from "../lix/open-lix-backend.js";
import { uuidV7 } from "./deterministic/uuid-v7.js";
import { OpfsSahBackend } from "../backend/opfs-sah.js";

test("generated a uuid v7", async () => {
	const engine = await openLixBackend({
		backend: new OpfsSahBackend(),
		pluginsRaw: [],
	});

	const id = await uuidV7({ lix: engine });

	expect(typeof id).toBe("string");
	expect(id.length).toBeGreaterThan(10);
});
