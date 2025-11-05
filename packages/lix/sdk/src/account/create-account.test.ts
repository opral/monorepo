import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createAccount } from "./create-account.js";

test("should create an account", async () => {
	const lix = await openLix({});

	const accountName = "test_account";
	const account = await createAccount({
		lix,
		name: accountName,
	});

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

test("should create an account using schema default version when lixcol_version_id is not provided", async () => {
	const lix = await openLix({});

	const accountName = "test_account_active";
	const account = await createAccount({
		lix,
		name: accountName,
	});

	// Verify the account was created
	expect(account).toMatchObject({
		name: accountName,
	});

	// Verify the account exists in the database using the active version
	const dbAccount = await lix.db
		.selectFrom("account_by_version")
		.selectAll()
		.where("id", "=", account.id)
		.where("lixcol_version_id", "=", "global")
		.executeTakeFirstOrThrow();

	expect(dbAccount).toMatchObject({
		name: accountName,
		lixcol_version_id: "global",
	});
});
