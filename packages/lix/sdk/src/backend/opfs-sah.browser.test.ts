import { openLixBackend } from "../lix/open-lix-engine.js";
import { test, expect } from "vitest";
import { OpfsSahWorker } from "./opfs-sah.js";

test("inserting a file", async () => {
	const lix = await openLixBackend({
		backend: OpfsSahWorker(),
		pluginsRaw: [],
	});

	await lix.db
		.insertInto("file")
		.values({ path: "/a.txt", data: new TextEncoder().encode("Hello, world!") })
		.execute();

	const row = await lix.db
		.selectFrom("file")
		.where("path", "=", "/a.txt")
		.selectAll()
		.executeTakeFirst();

	expect(row).toBeDefined();
	expect(row?.data).toBeInstanceOf(Uint8Array);
	expect(new TextDecoder().decode(row?.data)).toBe("Hello, world!");

	await lix.close();
});
