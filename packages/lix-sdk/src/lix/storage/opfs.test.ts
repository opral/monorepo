import { test, expect, describe, beforeEach, vi } from "vitest";
import { OpfsStorage } from "./opfs.js";
import { openLix } from "../open-lix.js";
import { InMemoryStorage } from "./in-memory.js";

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
						arrayBuffer: vi.fn().mockResolvedValue(
							new TextEncoder().encode(data).buffer
						),
					});
				} else {
					const bytes = data || new Uint8Array(0);
					return Promise.resolve({
						text: vi.fn().mockResolvedValue(
							new TextDecoder().decode(bytes)
						),
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
		const db1 = await storage.open();
		const db2 = await storage.open();

		expect(db1).toBe(db2);
	});

	test("saves database on close", async () => {
		const storage = new OpfsStorage({ path: "test.db" });
		await openLix({ storage });

		// This should not throw
		await expect(storage.close()).resolves.not.toThrow();
	});

	test("imports lix file blob and saves to OPFS", async () => {
		const storage = new OpfsStorage({ path: "test.db" });

		const sourceLix = await openLix({ storage: new InMemoryStorage() });

		// Add some data to the source
		await sourceLix.db
			.insertInto("key_value")
			.values({
				key: "imported-key",
				value: "imported-value",
			})
			.execute();

		const lixBlob = await sourceLix.toBlob();

		// This should not throw
		await expect(storage.import(lixBlob)).resolves.not.toThrow();
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

		// Verify current active account
		const activeAccount = await lix.db
			.selectFrom("active_account")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(activeAccount.id).toBe(account.id);
		expect(activeAccount.name).toBe(account.name);

		await lix.close();

		// Reopen the lix
		const lix2 = await openLix({ storage });

		// Verify active account persisted
		const activeAccount2 = await lix2.db
			.selectFrom("active_account")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(activeAccount2.id).toBe(account.id);
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

		// Verify current active account
		const activeAccount = await lix1.db
			.selectFrom("active_account")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(activeAccount.id).toBe(account.id);
		expect(activeAccount.name).toBe(account.name);

		await lix1.close();

		const storage2 = new OpfsStorage({ path });
		// Reopen the lix instance
		const lix2 = await openLix({ storage: storage2 });

		// Verify active account persisted
		const activeAccount2 = await lix2.db
			.selectFrom("active_account")
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(activeAccount2.id).toBe(account.id);
		expect(activeAccount2.name).toBe(account.name);
	});

	test("only saves active accounts when they change", async () => {
		const path = "observer-test.lix";
		const storage = new OpfsStorage({ path });

		const account = { id: "observer-account", name: "Observer Test" };
		const lix = await openLix({ storage, account });

		// Spy on the saveActiveAccounts method
		const saveActiveAccountsSpy = vi.spyOn(storage as any, "saveActiveAccounts");

		// Wait a bit for the initial save from the observer
		await new Promise((resolve) => setTimeout(resolve, 50));
		
		// Clear the spy to ignore the initial save
		saveActiveAccountsSpy.mockClear();

		// Make a change that doesn't affect active_account
		await lix.db
			.insertInto("key_value")
			.values({ key: "test-key", value: "test-value" })
			.execute();

		// Wait for potential save
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Should not have saved active accounts
		expect(saveActiveAccountsSpy).not.toHaveBeenCalled();

		// Now update the active account
		await lix.db
			.updateTable("active_account")
			.set({ name: "Updated Name" })
			.where("id", "=", account.id)
			.execute();

		// Wait for save
		await new Promise((resolve) => setTimeout(resolve, 150));

		// Should have saved active accounts now
		expect(saveActiveAccountsSpy).toHaveBeenCalledTimes(1);

		await lix.close();
	});
});
