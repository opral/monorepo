import { test, expect } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { toBlob } from "./to-blob.js";

test("it should open a lix in memory from a blob", async () => {
	const lix1 = await openLixInMemory({});

	await lix1.db
		.insertInto("file")
		.values({
			id: "1",
			path: "/a.txt",
			data: new TextEncoder().encode("hello"),
		})
		.execute();

	const lix2 = await openLixInMemory({ blob: await toBlob({ lix: lix1 }) });
	const files = await lix2.db.selectFrom("file").selectAll().execute();

	expect(files).toEqual([
		expect.objectContaining({
			id: "1",
			path: "/a.txt",
			data: new TextEncoder().encode("hello"),
		}),
	]);
});
