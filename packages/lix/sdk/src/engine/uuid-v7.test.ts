import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { InMemoryEnvironment } from "../environment/in-memory.js";
import { uuidV7 } from "./functions/uuid-v7.js";

test("generated a uuid v7", async () => {
	const engine = await openLix({
		environment: new InMemoryEnvironment(),
		providePlugins: [],
	});

	const id = await uuidV7({ lix: engine });

	expect(typeof id).toBe("string");
	expect(id.length).toBeGreaterThan(10);
});
