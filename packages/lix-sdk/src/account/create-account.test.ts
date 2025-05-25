import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "./create-account.js";
import { createVersion } from "../version/create-version.js";

test("should create an account", async () => {
	const lix = await openLixInMemory({});

	const version = await createVersion({
		lix,
		id: "test-version",
	});

	const accountName = "test_account";
	const account = await createAccount({ 
		lix, 
		name: accountName,
		version_id: version.id,
	});

	// Verify the account was created
	expect(account).toMatchObject({
		name: accountName,
		version_id: version.id,
	});

	// Verify the account exists in the database
	const dbAccount = await lix.db
		.selectFrom("account")
		.selectAll()
		.where("id", "=", account.id)
		.executeTakeFirstOrThrow();

	expect(dbAccount).toMatchObject({
		name: accountName,
		version_id: version.id,
	});
});
