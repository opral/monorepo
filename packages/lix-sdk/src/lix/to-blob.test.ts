import { test, expect } from "vitest";
import { openLix } from "./open-lix.js";
import { toBlob } from "./to-blob.js";
import { newLixFile } from "./new-lix.js";

test("it's possible to open the blob again", async () => {
	const blob0 = await newLixFile();

	const lix = await openLix({
		blob: blob0,
	});

	const blob1 = await toBlob({ lix });

	const lix2 = await openLix({
		blob: blob1,
	});

	expect(lix2).toBeDefined();
	expect(lix2.db).toBeDefined();
	expect(lix2.sqlite).toBeDefined();
	expect(lix2.plugin).toBeDefined();
});
