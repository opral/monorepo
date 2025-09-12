import { openLixBackend } from "../lix/open-lix-backend.js";
import { test, expect, describe } from "vitest";
import { OpfsSahBackend } from "./opfs-sah.js";
import { newLixFile } from "../lix/new-lix.js";

describe.sequential("OPFS SAH Backend (browser)", () => {
	test("inserting a file", async () => {
		const lix = await openLixBackend({
			backend: new OpfsSahBackend({}),
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

	test("open() does not expose runtime on main thread", async () => {
		const backend = new OpfsSahBackend({ key: `vitest-opfs-no-runtime` });
		const res = await backend.open({
			boot: { args: { pluginsRaw: [] } },
			onEvent: () => {},
		});
		// Worker-backed backend cannot expose an in-process runtime; must be undefined
		expect(res).toBeUndefined();
		await backend.close();
	});

	test("persists across reopen with same name", async () => {
		const name = `vitest-opfs-persist`;
		const lix1 = await openLixBackend({
			backend: new OpfsSahBackend({ key: name }),
			pluginsRaw: [],
		});
		try {
			await lix1.db
				.insertInto("file")
				.values({
					path: "/persist.txt",
					data: new TextEncoder().encode("keep me"),
				})
				.execute();
		} finally {
			await lix1.close();
		}

		// Second open: read the previously written row
		const lix2 = await openLixBackend({
			backend: new OpfsSahBackend({ key: name }),
			pluginsRaw: [],
		});
		try {
			const row = await lix2.db
				.selectFrom("file")
				.where("path", "=", "/persist.txt")
				.selectAll()
				.executeTakeFirst();
			expect(row).toBeDefined();
			expect(new TextDecoder().decode(row?.data as Uint8Array)).toBe("keep me");
		} finally {
			await lix2.close();
		}
	});

	test("throws when attempting to seed an existing name", async () => {
		const name = `vitest-opfs-overwrite`;
		// First open (seeds a new DB)
		const lix1 = await openLixBackend({
			backend: new OpfsSahBackend({ key: name }),
			pluginsRaw: [],
		});
		await lix1.close();

		// Prepare a fresh blob to seed with
		const fresh = await newLixFile();
		const blob = await fresh.arrayBuffer();

		// Use backend.create directly so we can properly close the worker even on error
		const backend = new OpfsSahBackend({ key: name });
		try {
			await expect(
				backend.create({
					blob,
					boot: { args: { pluginsRaw: [] } },
					onEvent: () => {},
				})
			).rejects.toThrow(/already exists|refusing to import/i);
		} finally {
			await backend.close();
		}
	});

	test("clear wipes OPFS contents (browser)", async () => {
		const name = `vitest-opfs-clear`;

		// 1) Create a DB and write a row
		const lix1 = await openLixBackend({
			backend: new OpfsSahBackend({ key: name }),
			pluginsRaw: [],
		});
		try {
			await lix1.db
				.insertInto("file")
				.values({
					path: "/temp.txt",
					data: new TextEncoder().encode("to be wiped"),
				})
				.execute();
		} finally {
			await lix1.close();
		}

		// Give the environment a moment to release any AccessHandles
		await new Promise((r) => setTimeout(r, 250));

		// 2) Enumerate OPFS to confirm content exists
		const rootBefore = await navigator.storage.getDirectory();
		const entriesBefore = [] as any[];
		// @ts-expect-error - values() exists in modern browsers
		for await (const entry of rootBefore.values()) entriesBefore.push(entry);
		expect(entriesBefore.length).toBeGreaterThan(0);

		// 3) Wipe all OPFS data for this origin
		await OpfsSahBackend.clear();

		// Ensure OPFS has settled
		await new Promise((r) => setTimeout(r, 100));

		// 4) Enumerate OPFS again – should be empty
		const rootAfter = await navigator.storage.getDirectory();
		const entriesAfter = [] as any[];
		// @ts-expect-error - values() exists in modern browsers
		for await (const entry of rootAfter.values()) entriesAfter.push(entry);
		expect(entriesAfter.length).toBe(0);
	});
});

test("clear() throws when a backend is open", async () => {
	const name = `vitest-opfs-clear-open`;
	const lix = await openLixBackend({
		backend: new OpfsSahBackend({ key: name }),
		pluginsRaw: [],
	});
	await lix.db
		.insertInto("file")
		.values({ path: "/hold.txt", data: new TextEncoder().encode("x") })
		.execute();

	await expect(OpfsSahBackend.clear()).rejects.toMatchObject({
		code: "LIX_OPFS_BUSY",
	});

	await lix.close();
});

test("loads plugin from string and processes *.json", async () => {
	// Minimal mock plugin: matches *.json and emits one change with a simple schema
	const mockPlugin = `
export const plugin = {
  key: 'mock_json',
  detectChangesGlob: '*.json',
  detectChanges: ({ after }) => {
    const schema = { "x-lix-key": "mock_schema", "x-lix-version": "1.0", type: "object", properties: { name: { type: "string" } } };
    return [{ entity_id: after.id + ':mock', schema, snapshot_content: { name: 'hello' } }];
  }
};
export default plugin;
`;

	const lix = await openLixBackend({
		backend: new OpfsSahBackend({ key: `vitest-opfs-plugin` }),
		pluginsRaw: [mockPlugin],
	});
	try {
		// Insert a JSON file which should trigger the mock plugin
		await lix.db
			.insertInto("file")
			.values({
				path: "/foo.json",
				data: new TextEncoder().encode('{"name":"x"}'),
			})
			.execute();

		// Plugin should have inserted a state row with our mock schema key
		const row = await lix.db
			.selectFrom("state_all")
			.selectAll()
			.where("schema_key", "=", "mock_schema")
			.executeTakeFirst();

		expect(row).toBeTruthy();
		expect(row?.plugin_key).toBe("mock_json");
	} finally {
		await lix.close();
	}
});
