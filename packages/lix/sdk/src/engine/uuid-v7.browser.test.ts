import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { uuidV7 } from "./deterministic/uuid-v7.js";
import { OpfsSahEnvironment } from "../environment/opfs-sah.js";

test("generated a uuid v7", async () => {
	const engine = await openLix({
		environment: new OpfsSahEnvironment(),
		pluginsRaw: [],
	});

	const id = await uuidV7({ lix: engine });

	expect(typeof id).toBe("string");
	expect(id.length).toBeGreaterThan(10);
});
