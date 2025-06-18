import { test, expect } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { toBlob } from "./to-blob.js";
import { newLixFile } from "./new-lix.js";

test("it's possible to open the blob again", async () => {
	const blob0 = await newLixFile();

	const lix = await openLixInMemory({
		blob: blob0,
	});

	const blob1 = await toBlob({ lix });

	const lix2 = await openLixInMemory({
		blob: blob1,
	});

	expect(lix2).toBeDefined();
	expect(lix2.db).toBeDefined();
	expect(lix2.sqlite).toBeDefined();
	expect(lix2.plugin).toBeDefined();
});
