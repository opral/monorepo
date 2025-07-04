import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createAccount } from "./create-account.js";
import { createVersion } from "../version/create-version.js";

test("should create an account", async () => {
	const lix = await openLix({});

	const version = await createVersion({
		lix,
		id: "test-version",
	});

	const accountName = "test_account";
	const account = await createAccount({
		lix,
		name: accountName,
		lixcol_version_id: version.id,
	});

	// Verify the account was created
	expect(account).toMatchObject({
		name: accountName,
		lixcol_version_id: version.id,
	});

	// Verify the account exists in the database
	const dbAccount = await lix.db
		.selectFrom("account_all")
		.selectAll()
		.where("id", "=", account.id)
		.executeTakeFirstOrThrow();

	expect(dbAccount).toMatchObject({
		name: accountName,
		lixcol_version_id: version.id,
	});
});

test("should create an account using active version when lixcol_version_id is not provided", async () => {
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
		.selectFrom("account_all")
		.selectAll()
		.where("id", "=", account.id)
		.executeTakeFirstOrThrow();

	// Get the active version to verify it was used
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(dbAccount).toMatchObject({
		name: accountName,
		lixcol_version_id: activeVersion.version_id,
	});
});
