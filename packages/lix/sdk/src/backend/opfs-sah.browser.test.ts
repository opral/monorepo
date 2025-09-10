import { openLixBackend } from "../lix/open-lix-backend.js";
import { test, expect } from "vitest";
import { OpfsSahWorker } from "./opfs-sah.js";

test("inserting a file", async () => {
	const lix = await openLixBackend({
		backend: OpfsSahWorker({ path: "/vitest-opfs.lix" }),
		pluginsRaw: [],
	});

	await lix.db
		.insertInto("file")
		.values({
			path: "/a.txt",
			data: new TextEncoder().encode("Hello, world!"),
		})
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

test("creates OPFS file at given absolute path", async () => {
	// Randomize filename to avoid AccessHandle contention and stale files
	// across retries/parallel runs (OPFS allows only one open handle per file).
	const name = `/vitest-opfs-create-path.lix`;
	const lix = await openLixBackend({
		backend: OpfsSahWorker({ path: name }),
		pluginsRaw: [],
	});
	try {
		const root: any = await (navigator as any).storage.getDirectory();
		const handle = await root.getFileHandle(name.slice(1));
		const file = await handle.getFile();
		expect(file).toBeInstanceOf(File);
		expect(typeof file.size).toBe("number");
	} finally {
		await lix.close();
		// Cleanup best-effort
		try {
			const root: any = await (navigator as any).storage.getDirectory();
			await root.removeEntry(name.slice(1));
		} catch {}
	}
});
