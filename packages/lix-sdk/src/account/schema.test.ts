import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";

test("insert, update, delete on the account view", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("account")
		.values([
			{
				id: "account0",
				name: "Alice",
			},
			{
				id: "account1",
				name: "Bob",
			},
		])
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("account")
		.select(["id", "name"])
		.where("id", "in", ["account0", "account1"])
		.orderBy("id")
		.execute();

	expect(viewAfterInsert).toEqual([
		{
			id: "account0",
			name: "Alice",
		},
		{
			id: "account1",
			name: "Bob",
		},
	]);

	await lix.db
		.updateTable("account")
		.where("id", "=", "account0")
		.set({
			name: "Alice Updated",
		})
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("account")
		.orderBy("id")
		.where("id", "in", ["account0", "account1"])
		.select(["id", "name"])
		.execute();

	expect(viewAfterUpdate).toEqual([
		{
			id: "account0",
			name: "Alice Updated",
		},
		{
			id: "account1",
			name: "Bob",
		},
	]);

	await lix.db.deleteFrom("account").where("id", "=", "account0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("account")
		.orderBy("id")
		.where("id", "in", ["account0", "account1"])
		.select(["id", "name"])
		.execute();

	expect(viewAfterDelete).toEqual([
		{
			id: "account1",
			name: "Bob",
		},
	]);
});

test("account ids should have a default", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("account")
		.values({
			name: "Test User",
		})
		.execute();

	const account = await lix.db
		.selectFrom("account")
		.where("name", "=", "Test User")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(account.id).toBeDefined();
	expect(account.name).toBe("Test User");
});

test("account operations are version specific and isolated", async () => {
	const lix = await openLix({});

	const versionA = await createVersion({
		lix,
		id: "versionA",
	});

	const versionB = await createVersion({
		lix,
		id: "versionB",
	});

	// Insert account in version A
	await lix.db
		.insertInto("account_all")
		.values({
			id: "accountA",
			name: "User A",
			lixcol_version_id: versionA.id,
		})
		.execute();

	// Insert account in version B with same id but different name
	await lix.db
		.insertInto("account_all")
		.values({
			id: "accountB",
			name: "User B",
			lixcol_version_id: versionB.id,
		})
		.execute();

	// Verify both versions have their own accounts
	const accountsInVersionA = await lix.db
		.selectFrom("account_all")
		.where("lixcol_version_id", "=", versionA.id)
		.where("id", "in", ["accountA", "accountB"])
		.selectAll()
		.execute();

	const accountsInVersionB = await lix.db
		.selectFrom("account_all")
		.where("lixcol_version_id", "=", versionB.id)
		.where("id", "in", ["accountA", "accountB"])
		.selectAll()
		.execute();

	expect(accountsInVersionA).toHaveLength(1);
	expect(accountsInVersionB).toHaveLength(1);
	expect(accountsInVersionA[0]?.name).toBe("User A");
	expect(accountsInVersionB[0]?.name).toBe("User B");

	// Update account in version A
	await lix.db
		.updateTable("account_all")
		.where("id", "=", "accountA")
		.where("lixcol_version_id", "=", versionA.id)
		.set({
			name: "User A Updated",
		})
		.execute();

	// Verify update only affected version A
	const updatedAccountsA = await lix.db
		.selectFrom("account_all")
		.where("lixcol_version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const unchangedAccountsB = await lix.db
		.selectFrom("account_all")
		.where("lixcol_version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(updatedAccountsA[0]?.name).toBe("User A Updated");
	expect(unchangedAccountsB[0]?.name).toBe("User B");

	// Delete account from version A
	await lix.db
		.deleteFrom("account_all")
		.where("id", "=", "accountA")
		.where("lixcol_version_id", "=", versionA.id)
		.execute();

	// Verify deletion only affected version A
	const remainingAccountsA = await lix.db
		.selectFrom("account_all")
		.where("id", "in", ["accountA", "accountB"])
		.where("lixcol_version_id", "=", versionA.id)
		.selectAll()
		.execute();

	const remainingAccountsB = await lix.db
		.selectFrom("account_all")
		.where("id", "in", ["accountA", "accountB"])
		.where("lixcol_version_id", "=", versionB.id)
		.selectAll()
		.execute();

	expect(remainingAccountsA).toHaveLength(0);
	expect(remainingAccountsB).toHaveLength(1);
	expect(remainingAccountsB[0]?.name).toBe("User B");
});

test("active_account temp table operations", async () => {
	const lix = await openLix({});

	// Check if the default anonymous account was created
	const activeAccounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(activeAccounts).toHaveLength(1);
	expect(activeAccounts[0]?.name).toMatch(/^Anonymous \w+$/);

	// Insert a new active account
	await lix.db
		.insertInto("active_account")
		.values({
			id: "user123",
			name: "Alice",
		})
		.execute();

	const updatedActiveAccounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(updatedActiveAccounts).toHaveLength(2);
	expect(updatedActiveAccounts.some((acc) => acc.name === "Alice")).toBe(true);

	// Update active account
	await lix.db
		.updateTable("active_account")
		.where("id", "=", "user123")
		.set({ name: "Alice Updated" })
		.execute();

	const afterUpdate = await lix.db
		.selectFrom("active_account")
		.where("id", "=", "user123")
		.selectAll()
		.execute();

	expect(afterUpdate[0]?.name).toBe("Alice Updated");

	// Delete active account
	await lix.db
		.deleteFrom("active_account")
		.where("id", "=", "user123")
		.execute();

	const afterDelete = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(1);
	expect(afterDelete.some((acc) => acc.id === "user123")).toBe(false);
});

test("account table should have no entries initially but active_account should have default", async () => {
	const lix = await openLix({});

	// Check that account table is empty
	const accounts = await lix.db.selectFrom("account").selectAll().execute();
	expect(accounts).toHaveLength(0);

	// Check that active_account has a default entry
	const activeAccounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(activeAccounts).toHaveLength(1);
	expect(activeAccounts[0]?.name).toMatch(/^Anonymous \w+$/);
});

test("should generate different anonymous account names", async () => {
	const lix0 = await openLix({});
	const lix1 = await openLix({});
	const lix2 = await openLix({});

	const account0 = await lix0.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	const account1 = await lix1.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	const account2 = await lix2.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirst();

	expect(account0?.name).not.toBe(account1?.name);
	expect(account1?.name).not.toBe(account2?.name);
});
