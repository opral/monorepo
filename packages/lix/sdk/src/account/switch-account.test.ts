import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createAccount } from "./create-account.js";
import { switchAccount } from "./switch-account.js";

test("should switch the active account", async () => {
	const lix = await openLix({});

	// Create two accounts
	const account1 = await createAccount({
		lix,
		id: "account1",
		name: "Account One",
	});
	const account2 = await createAccount({
		lix,
		id: "account2",
		name: "Account Two",
	});

	// Switch to account1
	await switchAccount({ lix, to: [account1] });

	// Verify the current account is account1
	let activeAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(activeAccount.account_id).toBe(account1.id);

	// Switch to account2
	await switchAccount({ lix, to: [account2] });

	// Verify the current account is account2
	activeAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(activeAccount.account_id).toBe(account2.id);
});

test("should handle switching to the same account", async () => {
	const lix = await openLix({});

	// Create an account
	const account = await createAccount({
		lix,
		name: "account",
	});

	// Switch to the account
	await switchAccount({ lix, to: [account] });

	// Verify the current account is the created account
	let activeAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(activeAccount.account_id).toBe(account.id);

	// Switch to the same account again
	await switchAccount({ lix, to: [account] });

	// Verify the current account is still the same account
	activeAccount = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(activeAccount.account_id).toBe(account.id);
});
