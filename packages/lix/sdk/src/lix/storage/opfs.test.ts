import { test, expect, describe, beforeEach, vi } from "vitest";
import { OpfsStorage } from "./opfs.js";
import { openLix } from "../open-lix.js";
import { newLixFile } from "../new-lix.js";

// Create a realistic in-memory OPFS mock
class MockOPFS {
	private files = new Map<string, Uint8Array | string>();

	createMockOpfsRoot() {
		return {
			getFileHandle: vi
				.fn()
				.mockImplementation(
					(filename: string, options?: { create?: boolean }) => {
						if (!this.files.has(filename) && !options?.create) {
							throw new Error("File not found");
						}
						return this.createMockFileHandle(filename);
					}
				),
		};
	}

	private createMockFileHandle(filename: string) {
		return {
			getFile: vi.fn().mockImplementation(() => {
				const data = this.files.get(filename);
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
				return Promise.resolve(this.createMockWritable(filename));
			}),
		};
	}

	private createMockWritable(filename: string) {
		let buffer: Uint8Array | string;

		return {
			write: vi.fn().mockImplementation((data: Uint8Array | string) => {
				if (typeof data === "string") {
					buffer = data;
				} else {
					buffer = new Uint8Array(data);
				}
				return Promise.resolve();
			}),
			close: vi.fn().mockImplementation(() => {
				this.files.set(filename, buffer);
				return Promise.resolve();
			}),
		};
	}
}

describe("OpfsStorage", () => {
	let mockOpfs: MockOPFS;

	beforeEach(() => {
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
	});

	test("constructor requires path argument", () => {
		expect(() => new OpfsStorage({ path: "test.db" })).not.toThrow();
	});

	test("throws error if OPFS is not supported", () => {
		// Remove navigator to simulate unsupported environment
		const originalNavigator = globalThis.navigator;
		delete (globalThis as any).navigator;

		expect(() => new OpfsStorage({ path: "test.db" })).toThrow(
			"OPFS is not supported in this environment"
		);

		// Restore navigator
		globalThis.navigator = originalNavigator;
	});

	test("creates new lix file when OPFS file doesn't exist", async () => {
		const storage = new OpfsStorage({ path: "new.db" });
		const lix = await openLix({ storage });

		expect(lix.db).toBeDefined();
		expect(lix.sqlite).toBeDefined();
	});

	test("returns same database instance on multiple open calls", async () => {
		const storage = new OpfsStorage({ path: "test.db" });
		const db1 = await storage.open({ createBlob: () => newLixFile() });
		const db2 = await storage.open({ createBlob: () => newLixFile() });

		expect(db1).toBe(db2);
	});

	test("saves database on close", async () => {
		const storage = new OpfsStorage({ path: "test.db" });
		await openLix({ storage });

		// This should not throw
		await expect(storage.close()).resolves.not.toThrow();
	});

	test("integrates with openLix", async () => {
		const storage = new OpfsStorage({ path: "integration.db" });
		const lix = await openLix({ storage });

		expect(lix.db).toBeDefined();
		expect(lix.sqlite).toBeDefined();
		expect(lix.hooks).toBeDefined();

		// Should be able to query the database
		const result = await lix.db.selectFrom("key_value").selectAll().execute();
		expect(Array.isArray(result)).toBe(true);
	});

	test("persists data automatically on state mutations", async () => {
		const path = "e2e-persist-test.db";

		// Open lix with OPFS storage
		const lix1 = await openLix({ storage: new OpfsStorage({ path }) });

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
		const lix2 = await openLix({ storage: new OpfsStorage({ path }) });

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
		const path = "persistence-test.db";

		// Create and populate database
		const storage1 = new OpfsStorage({ path });
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
		const storage2 = new OpfsStorage({ path });
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
		const path = "example.lix";
		const storage = new OpfsStorage({ path });

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
		const path = "example.lix";
		const storage1 = new OpfsStorage({ path });

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

		const storage2 = new OpfsStorage({ path });
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
		const path = "observer-test.lix";
		const storage = new OpfsStorage({ path });

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
		const storage1 = new OpfsStorage({ path: "file1.lix" });
		const storage2 = new OpfsStorage({ path: "file2.lix" });

		// Open and create files
		await openLix({ storage: storage1 });
		await openLix({ storage: storage2 });

		// Also create an active accounts file
		const lix3 = await openLix({
			storage: new OpfsStorage({ path: "file3.lix" }),
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
});
