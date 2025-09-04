/* eslint-disable @typescript-eslint/no-this-alias */
import { test, expect, describe, beforeEach, vi } from "vitest";
import { OpfsStorage } from "./opfs.js";
import { openLix } from "../open-lix.js";
import { newLixFile } from "../new-lix.js";

// Create a realistic in-memory OPFS mock
class MockOPFS {
	private files = new Map<string, Uint8Array | string>();

	createMockOpfsRoot() {
		const self = this;
		return {
			getFileHandle: vi
				.fn()
				.mockImplementation(
					(filename: string, options?: { create?: boolean }) => {
						if (!self.files.has(filename) && !options?.create) {
							throw new Error("File not found");
						}
						if (options?.create && !self.files.has(filename)) {
							self.files.set(filename, new Uint8Array());
						}
						return self.createMockFileHandle(filename);
					}
				),
			removeEntry: vi.fn().mockImplementation((name: string) => {
				self.files.delete(name);
			}),
			values: vi.fn().mockImplementation(async function* () {
				for (const name of self.files.keys()) {
					yield { kind: "file", name } as const;
				}
			}),
		};
	}

	private createMockFileHandle(filename: string) {
		const self = this;
		return {
			getFile: vi.fn().mockImplementation(() => {
				const data = self.files.get(filename);
				if (typeof data === "string") {
					return Promise.resolve({
						text: vi.fn().mockResolvedValue(data),
						arrayBuffer: vi
							.fn()
							.mockResolvedValue(new TextEncoder().encode(data).buffer),
					});
				} else {
					const bytes = data || new Uint8Array(0);
					return Promise.resolve({
						text: vi.fn().mockResolvedValue(new TextDecoder().decode(bytes)),
						arrayBuffer: vi.fn().mockResolvedValue(bytes.buffer),
					});
				}
			}),
			createWritable: vi.fn().mockImplementation(() => {
				return Promise.resolve(self.createMockWritable(filename));
			}),
		};
	}

	private createMockWritable(filename: string) {
		const self = this;
		let chunks: (Uint8Array | string)[] = [];

		return {
			write: vi.fn().mockImplementation((data: Uint8Array | string | any) => {
				if (data instanceof Uint8Array) {
					chunks.push(new Uint8Array(data));
				} else if (typeof data === "string") {
					chunks.push(data);
				} else if (data?.buffer instanceof ArrayBuffer) {
					chunks.push(new Uint8Array(data.buffer));
				} else {
					chunks.push(String(data));
				}
				return Promise.resolve();
			}),
			close: vi.fn().mockImplementation(() => {
				if (chunks.length === 1) {
					self.files.set(filename, chunks[0]!);
				} else if (chunks.every((c) => c instanceof Uint8Array)) {
					const total = (chunks as Uint8Array[]).reduce(
						(n, c) => n + c.byteLength,
						0
					);
					const out = new Uint8Array(total);
					let off = 0;
					for (const c of chunks as Uint8Array[]) {
						out.set(c, off);
						off += c.byteLength;
					}
					self.files.set(filename, out);
				} else {
					const text = chunks
						.map((c) =>
							typeof c === "string" ? c : new TextDecoder().decode(c)
						)
						.join("");
					self.files.set(filename, text);
				}
				chunks = [];
				return Promise.resolve();
			}),
		};
	}
}

describe("OpfsStorage", () => {
	let mockOpfs: MockOPFS;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Create a fresh MockOPFS instance for each test to prevent cross-test pollution
		mockOpfs = new MockOPFS();

		// Setup OPFS mock
		Object.defineProperty(globalThis, "navigator", {
			value: {
				storage: {
					getDirectory: vi
						.fn()
						.mockResolvedValue(mockOpfs.createMockOpfsRoot()),
				},
			},
			writable: true,
			configurable: true,
		});

		// Ensure OPFS is clean for each test after mock is in place
		await OpfsStorage.clean();
	});

	test("throws error if OPFS is not supported", () => {
		// Remove navigator to simulate unsupported environment
		const originalNavigator = globalThis.navigator;
		delete (globalThis as any).navigator;

		expect(() => OpfsStorage.byId("test" as string)).toThrow(
			"OPFS is not supported in this environment"
		);

		// Restore navigator
		globalThis.navigator = originalNavigator;
	});

	test("creates new lix file when OPFS file doesn't exist", async () => {
		const lix = await openLix({ storage: OpfsStorage.byName("new-project") });

		expect(lix.db).toBeDefined();
		expect(lix.sqlite).toBeDefined();
	});

	test("returns same database instance on multiple open calls", async () => {
		const storage = OpfsStorage.byId("same-db");
		const db1 = await storage.open({ createBlob: () => newLixFile() });
		const db2 = await storage.open({ createBlob: () => newLixFile() });

		expect(db1).toBe(db2);
	});

	test("saves database on close", async () => {
		const storage = OpfsStorage.byId("save-close");
		await openLix({ storage });

		// This should not throw
		await expect(storage.close()).resolves.not.toThrow();
	});

	test("integrates with openLix", async () => {
		const lix = await openLix({ storage: OpfsStorage.byId("integration") });

		expect(lix.db).toBeDefined();
		expect(lix.sqlite).toBeDefined();
		expect(lix.hooks).toBeDefined();

		// Should be able to query the database
		const result = await lix.db.selectFrom("key_value").selectAll().execute();
		expect(Array.isArray(result)).toBe(true);
	});

	test("persists data automatically on state mutations", async () => {
		const id = "e2e-persist-test";

		// Open lix with OPFS storage by id
		const lix1 = await openLix({ storage: OpfsStorage.byId(id) });

		// Insert some data
		await lix1.db
			.insertInto("key_value")
			.values({
				key: "e2e-test-key",
				value: "e2e-test-value",
			})
			.execute();

		// Wait for auto-save to complete
		await new Promise((resolve) => setTimeout(resolve, 150));

		await lix1.close();

		// Open the persisted blob to verify the data
		const lix2 = await openLix({ storage: OpfsStorage.byId(id) });

		// Verify the data persisted correctly
		const result = await lix2.db
			.selectFrom("key_value")
			.where("key", "=", "e2e-test-key")
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		expect(result[0]?.value).toBe("e2e-test-value");
	});

	// TODO occasional test failures due to timing issues
	// faulty state materialization might be the cause.
	// fix after https://github.com/opral/lix-sdk/issues/308
	test("can save and load data persistence", async () => {
		const path = "persistence-test";

		// Create and populate database
		const storage1 = OpfsStorage.byId(path);
		const lix1 = await openLix({ storage: storage1 });

		await lix1.db
			.insertInto("key_value")
			.values({
				key: "test-key",
				value: "test-value",
			})
			.execute();

		// Wait for auto-save to complete
		await new Promise((resolve) => setTimeout(resolve, 150));

		// Close the first lix to ensure data is saved
		await lix1.close();

		// Open new storage instance with same path
		const storage2 = OpfsStorage.byId(path);
		const lix2 = await openLix({ storage: storage2 });

		// Data should persist
		const result = await lix2.db
			.selectFrom("key_value")
			.where("key", "=", "test-key")
			.selectAll()
			.execute();

		expect(result).toHaveLength(1);
		expect(result[0]?.value).toBe("test-value");
	});

	test("persists active account", async () => {
		const path = "example";
		const storage = OpfsStorage.byId(path);

		const account = { id: "test-account", name: "Test User" };

		// provide lix on initial load with an account
		const lix = await openLix({
			storage,
			account,
		});

		// Verify current active account with details
		const activeAccount = await lix.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(activeAccount.account_id).toBe(account.id);
		expect(activeAccount.name).toBe(account.name);

		await lix.close();

		// Reopen the lix
		const lix2 = await openLix({ storage });

		// Verify active account persisted with details
		const activeAccount2 = await lix2.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(activeAccount2.account_id).toBe(account.id);
		expect(activeAccount2.name).toBe(account.name);
	});

	test("active account persistence across multiple storage instances", async () => {
		const path = "example";
		const storage1 = OpfsStorage.byId(path);

		const account = { id: "test-account", name: "Test User" };

		const lix1 = await openLix({
			storage: storage1,
			account,
		});

		// Verify current active account with details
		const activeAccount = await lix1.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(activeAccount.account_id).toBe(account.id);
		expect(activeAccount.name).toBe(account.name);

		await lix1.close();

		const storage2 = OpfsStorage.byId(path);
		// Reopen the lix instance
		const lix2 = await openLix({ storage: storage2 });

		// Verify active account persisted with details
		const activeAccount2 = await lix2.db
			.selectFrom("active_account as aa")
			.innerJoin("account_all as a", "a.id", "aa.account_id")
			.where("a.lixcol_version_id", "=", "global")
			.select(["aa.account_id", "a.id", "a.name"])
			.executeTakeFirstOrThrow();

		expect(activeAccount2.account_id).toBe(account.id);
		expect(activeAccount2.name).toBe(account.name);
	});

	test("only saves active accounts when they change", async () => {
		const path = "observer-test";
		const storage = OpfsStorage.byId(path);

		const account = { id: "observer-account", name: "Observer Test" };
		const lix = await openLix({ storage, account });

		// Spy on the saveActiveAccounts method
		const saveActiveAccountsSpy = vi.spyOn(
			storage as any,
			"saveActiveAccounts"
		);

		// Wait a bit for the initial save from the observer
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Clear the spy to ignore the initial save
		saveActiveAccountsSpy.mockClear();

		// Ensure active version exists before proceeding
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirst();

		expect(activeVersion).toBeDefined();
		expect(activeVersion?.version_id).toBeDefined();

		// Make a change that doesn't affect active_account
		await lix.db
			.insertInto("key_value")
			.values({ key: "test-key", value: "test-value" })
			.execute();

		// Wait for potential save
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should not have saved active accounts
		expect(saveActiveAccountsSpy).not.toHaveBeenCalled();

		// Now update the active account by deleting and re-inserting
		// First create the new account in account_all
		await lix.db
			.insertInto("account_all")
			.values({
				id: "new-account",
				name: "New Account",
				lixcol_version_id: "global",
			})
			.execute();

		await lix.db
			.deleteFrom("active_account")
			.where("account_id", "=", account.id)
			.execute();

		await lix.db
			.insertInto("active_account")
			.values({ account_id: "new-account" })
			.execute();

		// Wait for save
		await new Promise((resolve) => setTimeout(resolve, 150));

		// Should have saved active accounts now (twice: once for delete, once for insert)
		expect(saveActiveAccountsSpy).toHaveBeenCalledTimes(2);

		await lix.close();
	});

	test("clean() removes all files from OPFS", async () => {
		// Create some files in OPFS
		const storage1 = OpfsStorage.byId("file1");
		const storage2 = OpfsStorage.byId("file2");

		// Open and create files
		await openLix({ storage: storage1 });
		await openLix({ storage: storage2 });

		// Also create an active accounts file
		const lix3 = await openLix({
			storage: OpfsStorage.byId("file3"),
			account: { id: "test-clean", name: "Clean Test" },
		});
		await lix3.close();

		// Mock the OPFS directory structure for clean()
		const mockFiles = new Map([
			["file1.lix", { kind: "file", name: "file1.lix" }],
			["file2.lix", { kind: "file", name: "file2.lix" }],
			["file3.lix", { kind: "file", name: "file3.lix" }],
			[
				"lix_active_accounts.json",
				{ kind: "file", name: "lix_active_accounts.json" },
			],
			["some-dir", { kind: "directory", name: "some-dir" }],
		]);

		const removeEntrySpy = vi.fn();

		// Override getDirectory for clean() to return our mock structure
		vi.mocked(navigator.storage.getDirectory).mockResolvedValueOnce({
			values: vi.fn().mockImplementation(function* () {
				for (const entry of mockFiles.values()) {
					yield entry;
				}
			}),
			removeEntry: removeEntrySpy,
		} as any);

		// Call clean()
		await OpfsStorage.clean();

		// Verify all files and directories were removed
		expect(removeEntrySpy).toHaveBeenCalledTimes(5);
		expect(removeEntrySpy).toHaveBeenCalledWith("file1.lix");
		expect(removeEntrySpy).toHaveBeenCalledWith("file2.lix");
		expect(removeEntrySpy).toHaveBeenCalledWith("file3.lix");
		expect(removeEntrySpy).toHaveBeenCalledWith("lix_active_accounts.json");
		expect(removeEntrySpy).toHaveBeenCalledWith("some-dir", {
			recursive: true,
		});
	});

	test("clean() throws error if OPFS is not supported", async () => {
		// Remove navigator to simulate unsupported environment
		const originalNavigator = globalThis.navigator;
		delete (globalThis as any).navigator;

		await expect(OpfsStorage.clean()).rejects.toThrow(
			"OPFS is not supported in this environment"
		);

		// Restore navigator
		globalThis.navigator = originalNavigator;
	});
	// helper utilities inside this block to ensure navigator is available
	async function fileExistsInOpfs(name: string): Promise<boolean> {
		try {
			const root: any = await (navigator as any).storage.getDirectory();
			await root.getFileHandle(name);
			return true;
		} catch {
			return false;
		}
	}

	async function readJsonFromOpfs(name: string): Promise<any | undefined> {
		try {
			const root: any = await (navigator as any).storage.getDirectory();
			const fh = await root.getFileHandle(name);
			const f = await fh.getFile();
			const text = await f.text();
			return JSON.parse(text);
		} catch {
			return undefined;
		}
	}

	async function writeOpfsFile(
		name: string,
		content: Uint8Array | string | Blob
	) {
		const root: any = await (navigator as any).storage.getDirectory();
		const fh = await root.getFileHandle(name, { create: true });
		const w = await fh.createWritable();
		if (content instanceof Blob) {
			const buf = new Uint8Array(await content.arrayBuffer());
			await w.write(buf);
		} else {
			await w.write(content);
		}
		await w.close();
	}

	test("byId opens and persists to <id>.lix", async () => {
		const id = "abc123";
		const lix = await openLix({ storage: OpfsStorage.byId(id) });

		expect(await fileExistsInOpfs(`${id}.lix`)).toBe(true);

		const blob = await lix.toBlob();
		expect(blob).toBeInstanceOf(Blob);
		await lix.close();
	});

	test("byName creates when missing and sets mapping + name", async () => {
		const name = "project-alpha";
		const lix = await openLix({ storage: OpfsStorage.byName(name) });

		const idRow = await lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_id")
			.executeTakeFirstOrThrow();
		const nameRow = await lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_name")
			.executeTakeFirstOrThrow();

		const id = idRow.value as string;
		expect(typeof id).toBe("string");
		expect(nameRow.value).toBe(name);

		expect(await fileExistsInOpfs(`${id}.lix`)).toBe(true);

		const index = await readJsonFromOpfs("lix_opfs_storage.json");
		expect(index?.version).toBe(1);
		expect(index?.names?.[name]).toBe(id);

		await lix.close();
	});

	test("byName uses existing mapping and opens existing file", async () => {
		const existingId = "id-preexisting";
		const existingName = "preexisting";
		const blob = await newLixFile({
			keyValues: [
				{ key: "lix_id", value: existingId, lixcol_version_id: "global" },
				{ key: "lix_name", value: existingName, lixcol_version_id: "global" },
			],
		});

		await writeOpfsFile(
			`${existingId}.lix`,
			new Uint8Array(await blob.arrayBuffer())
		);
		await writeOpfsFile(
			"lix_opfs_storage.json",
			JSON.stringify({ version: 1, names: { [existingName]: existingId } })
		);

		const lix = await openLix({ storage: OpfsStorage.byName(existingName) });
		const idRow = await lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_id")
			.executeTakeFirstOrThrow();

		expect(idRow.value).toBe(existingId);
		expect(await fileExistsInOpfs(`${existingId}.lix`)).toBe(true);
		await lix.close();
	});

	test("byName enforces uniqueness: opening same name twice returns same id", async () => {
		const name = "unique-name";
		const lix1 = await openLix({ storage: OpfsStorage.byName(name) });
		const id1 = (
			await lix1.db
				.selectFrom("key_value")
				.select("value")
				.where("key", "=", "lix_id")
				.executeTakeFirstOrThrow()
		).value as string;
		await lix1.close();

		const lix2 = await openLix({ storage: OpfsStorage.byName(name) });
		const id2 = (
			await lix2.db
				.selectFrom("key_value")
				.select("value")
				.where("key", "=", "lix_id")
				.executeTakeFirstOrThrow()
		).value as string;
		await lix2.close();

		expect(id2).toBe(id1);
		expect(await fileExistsInOpfs(`${id1}.lix`)).toBe(true);
	});

	test("byName with stale mapping recreates and refreshes index", async () => {
		const name = "stale-name";

		await writeOpfsFile(
			"lix_opfs_storage.json",
			JSON.stringify({ version: 1, names: { [name]: "missing-id" } })
		);

		const lix = await openLix({ storage: OpfsStorage.byName(name) });
		const id = (
			await lix.db
				.selectFrom("key_value")
				.select("value")
				.where("key", "=", "lix_id")
				.executeTakeFirstOrThrow()
		).value as string;
		await lix.close();

		expect(await fileExistsInOpfs(`${id}.lix`)).toBe(true);
		const index = await readJsonFromOpfs("lix_opfs_storage.json");
		expect(index?.names?.[name]).toBe(id);
		expect(index?.names?.[name]).not.toBe("missing-id");
	});

	test("list returns minimal entries { id, name, path }", async () => {
		const name = "listed-project";
		const lix = await openLix({ storage: OpfsStorage.byName(name) });
		const id = (
			await lix.db
				.selectFrom("key_value")
				.select("value")
				.where("key", "=", "lix_id")
				.executeTakeFirstOrThrow()
		).value as string;
		await lix.close();

		const entries = await OpfsStorage.list();
		expect(Array.isArray(entries)).toBe(true);
		expect(entries.length).toBeGreaterThanOrEqual(1);
		const found = entries.find((e) => e.name === name);
		expect(found).toBeDefined();
		expect(found!.id).toBe(id);
		expect(found!.path).toBe(`${id}.lix`);
	});

	test("byId throws when DB lix_id mismatches requested id", async () => {
		// Prepare a file at expected path but with a different internal lix_id
		const requestedId = "expected";
		const dbId = "mismatch";
		const blob = await newLixFile({
			keyValues: [
				{ key: "lix_id", value: dbId, lixcol_version_id: "global" },
				{ key: "lix_name", value: "keep-db-name", lixcol_version_id: "global" },
			],
		});
		await writeOpfsFile(
			`${requestedId}.lix`,
			new Uint8Array(await blob.arrayBuffer())
		);

		// Opening by requested id should fail fast if the DB contains a different lix_id
		await expect(
			openLix({ storage: OpfsStorage.byId(requestedId) })
		).rejects.toThrow();
	});

	test("byName updates index to DB id but does not mutate DB lix_name", async () => {
		// Create a DB with a specific id and name
		const dbId = "db-id-xyz";
		const dbName = "db-existing-name";
		const desiredName = "requested-name";

		const blob = await newLixFile({
			keyValues: [
				{ key: "lix_id", value: dbId, lixcol_version_id: "global" },
				{ key: "lix_name", value: dbName, lixcol_version_id: "global" },
			],
		});

		// Write a file under an arbitrary different id to simulate wrong path/id pairing
		const wrongFileId = "wrong-file-id";
		await writeOpfsFile(
			`${wrongFileId}.lix`,
			new Uint8Array(await blob.arrayBuffer())
		);

		// Index maps desiredName -> wrongFileId (stale or incorrect mapping)
		await writeOpfsFile(
			"lix_opfs_storage.json",
			JSON.stringify({ version: 1, names: { [desiredName]: wrongFileId } })
		);

		const lix = await openLix({ storage: OpfsStorage.byName(desiredName) });

		// DB name should remain what the file contained (no mutation)
		const nameRow = await lix.db
			.selectFrom("key_value")
			.select("value")
			.where("key", "=", "lix_name")
			.executeTakeFirstOrThrow();
		expect(nameRow.value).toBe(dbName);

		// Index should be corrected to point name -> dbId (not wrongFileId)
		const index = await readJsonFromOpfs("lix_opfs_storage.json");
		expect(index?.names?.[desiredName]).toBe(dbId);

		await lix.close();
	});
});
