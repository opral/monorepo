import { expect, test } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";
import type { LixPlugin } from "../plugin/lix-plugin.js";

test("providing plugins should be possible", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});
	expect(await lix.plugin.getAll()).toContain(mockPlugin);
});

test("providing key values should be possible", async () => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		keyValues: [{ key: "key", value: "value" }],
	});
	const value = await lix.db.selectFrom("key_value").selectAll().execute();
	expect(value).toContainEqual({ key: "key", value: "value" });

	// testing overwriting key values
	const lix1 = await openLixInMemory({
		blob: await lix.toBlob(),
		keyValues: [{ key: "key", value: "value2" }],
	});

	const value1 = await lix1.db.selectFrom("key_value").selectAll().execute();
	expect(value1).toContainEqual({ key: "key", value: "value2" });
});