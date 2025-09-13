import { openLix } from "../lix/open-lix.js";
import { test, expect, describe } from "vitest";
import { OpfsSahEnvironment } from "./opfs-sah.js";
import { newLixFile } from "../lix/new-lix.js";

describe.sequential("OPFS SAH Environment (browser)", () => {
	test("inserting a file", async () => {
		const lix = await openLix({
			environment: new OpfsSahEnvironment({}),
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

	test("open() does not expose engine on main thread", async () => {
		const env = new OpfsSahEnvironment({ key: `vitest-opfs-no-engine` });
		const res = await env.open({
			boot: { args: { pluginsRaw: [] } },
			onEvent: () => {},
		});
		// Worker environment cannot expose an in-process engine; must be undefined
		expect(res).toBeUndefined();
		await env.close();
	});

	test("persists across reopen with same name", async () => {
		const name = `vitest-opfs-persist`;
		const lix1 = await openLix({
			environment: new OpfsSahEnvironment({ key: name }),
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
		const lix2 = await openLix({
			environment: new OpfsSahEnvironment({ key: name }),
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
		const lix1 = await openLix({
			environment: new OpfsSahEnvironment({ key: name }),
			pluginsRaw: [],
		});
		await lix1.close();

		// Prepare a fresh blob to seed with
		const fresh = await newLixFile();
		const blob = await fresh.arrayBuffer();

		// Use environment.create directly so we can properly close the worker even on error
		const env = new OpfsSahEnvironment({ key: name });
		try {
			await expect(
				env.create({
					blob,
					boot: { args: { pluginsRaw: [] } },
					onEvent: () => {},
				})
			).rejects.toThrow(/already exists|refusing to import/i);
		} finally {
			await env.close();
		}
	});

	test("clear wipes OPFS contents (browser)", async () => {
		const name = `vitest-opfs-clear`;

		// 1) Create a DB and write a row
		const lix1 = await openLix({
			environment: new OpfsSahEnvironment({ key: name }),
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
		await OpfsSahEnvironment.clear();

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

test("clear() throws when an environment is open", async () => {
	const name = `vitest-opfs-clear-open`;
	const lix = await openLix({
		environment: new OpfsSahEnvironment({ key: name }),
		pluginsRaw: [],
	});
	await lix.db
		.insertInto("file")
		.values({ path: "/hold.txt", data: new TextEncoder().encode("x") })
		.execute();

	await expect(OpfsSahEnvironment.clear()).rejects.toMatchObject({
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

	const lix = await openLix({
		environment: new OpfsSahEnvironment({ key: `vitest-opfs-plugin` }),
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

test("persists provided account", async () => {
	const name = `vitest-opfs-account-persist`;
	const account = { id: "test-account", name: "Test User" };

	// Open with initial account
	const lix1 = await openLix({
		environment: new OpfsSahEnvironment({ key: name }),
		pluginsRaw: [],
		account,
	});

	try {
		// Verify current active account with details
		const active1 = await lix1.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(active1.account_id).toBe(account.id);
		expect(active1.name).toBe(account.name);
	} finally {
		await lix1.close();
	}

	// Reopen the same environment key and verify persistence
	const lix2 = await openLix({
		environment: new OpfsSahEnvironment({ key: name }),
		pluginsRaw: [],
	});
	try {
		const active2 = await lix2.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(active2.account_id).toBe(account.id);
		expect(active2.name).toBe(account.name);
	} finally {
		await lix2.close();
	}
});
