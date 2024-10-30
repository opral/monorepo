import { expect, test } from "vitest";
import { openLixInMemory } from "./openLixInMemory.js";
import { newLixFile } from "../newLix.js";
import type { LixPlugin } from "../plugin.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(lix.plugins).toContain(mockPlugin);
});
