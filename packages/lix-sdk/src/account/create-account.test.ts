import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "./create-account.js";

test("should create an account", async () => {
	const lix = await openLixInMemory({});

	const accountName = "test_account";
	const account = await createAccount({ lix, name: accountName });

	// Verify the account was created
	expect(account).toMatchObject({
		name: accountName,
	});

	// Verify the account exists in the database
	const dbAccount = await lix.db
		.selectFrom("account")
		.selectAll()
		.where("id", "=", account.id)
		.executeTakeFirstOrThrow();

	expect(dbAccount).toMatchObject({
		name: accountName,
	});
});
