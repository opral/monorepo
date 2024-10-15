import { expect, test } from "vitest";
import { openLixInMemory } from "./openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";
import { uuidv4 } from "../index.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		glob: "*",
		diff: {},
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(lix.plugins).toContain(mockPlugin);
});
