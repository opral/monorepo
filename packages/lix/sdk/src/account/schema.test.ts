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
		.where("id", "=", "accountA")
		.selectAll()
		.execute();

	const unchangedAccountsB = await lix.db
		.selectFrom("account_all")
		.where("lixcol_version_id", "=", versionB.id)
		.where("id", "=", "accountB")
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

	// No accounts should exist by default
	const activeAccounts = await lix.db
		.selectFrom("active_account as aa")
		.innerJoin("account_all as a", "a.id", "aa.account_id")
		.where("a.lixcol_version_id", "=", "global")
		.select(["aa.account_id", "a.id", "a.name"])
		.execute();

	expect(activeAccounts).toHaveLength(0);

	// First create a real account in global version (where active accounts look)
	await lix.db
		.insertInto("account_all")
		.values({
			id: "user123",
			name: "Alice",
			lixcol_version_id: "global",
		})
		.execute();

	// Then make it active
	await lix.db
		.insertInto("active_account")
		.values({
			account_id: "user123",
		})
		.execute();

	const updatedActiveAccounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(updatedActiveAccounts).toHaveLength(1);
	const aliceActive = updatedActiveAccounts.find(
		(acc) => acc.account_id === "user123"
	);
	expect(aliceActive).toBeDefined();
	expect(aliceActive?.account_id).toBe("user123");

	// Update the actual account (not the active account reference)
	await lix.db
		.updateTable("account_all")
		.where("id", "=", "user123")
		.where("lixcol_version_id", "=", "global")
		.set({ name: "Alice Updated" })
		.execute();

	const afterUpdate = await lix.db
		.selectFrom("active_account")
		.where("account_id", "=", "user123")
		.selectAll()
		.execute();

	expect(afterUpdate).toHaveLength(1);
	// Verify the account was updated by checking the actual account
	const updatedAccount = await lix.db
		.selectFrom("account_all")
		.where("id", "=", "user123")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirst();
	expect(updatedAccount?.name).toBe("Alice Updated");

	// Delete active account
	await lix.db
		.deleteFrom("active_account")
		.where("account_id", "=", "user123")
		.execute();

	const afterDelete = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("account tables start empty until an account is created", async () => {
	const lix = await openLix({});

	const allAccounts = await lix.db
		.selectFrom("account_all")
		.selectAll()
		.execute();

	expect(allAccounts.length).toBe(0);

	const activeAccount = await lix.db
		.selectFrom("active_account as aa")
		.innerJoin("account_all as a", "a.id", "aa.account_id")
		.where("a.lixcol_version_id", "=", "global")
		.select(["aa.account_id", "a.id", "a.name"])
		.executeTakeFirst();

	expect(activeAccount).toBeUndefined();
});

test("active_account should enforce foreign key constraint on account_id", async () => {
	const lix = await openLix({});

	// Try to insert an active account reference to a non-existent account
	await expect(
		lix.db
			.insertInto("active_account")
			.values({
				account_id: "non-existent-account",
			})
			.execute()
	).rejects.toThrow(/foreign key/i);
});
