import { expect, test } from "vitest";
import { simulationTest } from "../test-utilities/simulation-test/simulation-test.js";
import { openLix } from "../lix/open-lix.js";
import { createAccount } from "../account/create-account.js";

test("simulation test discovery", () => {});

simulationTest(
	"insert, delete on the change_author view (simulated)",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create account
		const account = await createAccount({
			lix,
			name: "Test Author",
		});

		// Create change
		await lix.db
			.insertInto("change")
			.values({
				id: "c0",
				entity_id: "e0",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f0",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e0" },
			})
			.execute();

		await lix.db
			.insertInto("change_author")
			.values([
				{
					change_id: "c0",
					account_id: account.id,
				},
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_author")
			.orderBy("change_id", "asc")
			.where("change_id", "=", "c0")
			.selectAll()
			.execute();

		expectDeterministic(viewAfterInsert).toMatchObject([
			{
				change_id: "c0",
				account_id: account.id,
			},
		]);

		await lix.db
			.deleteFrom("change_author")
			.where("change_id", "=", "c0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_author")
			.orderBy("change_id", "asc")
			.where("change_id", "=", "c0")
			.selectAll()
			.execute();

		expectDeterministic(viewAfterDelete).toEqual([]);
	}
);

simulationTest(
	"should enforce primary key constraint (change_id, account_id)",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create account
		const account = await createAccount({
			lix,
			name: "Test Author",
		});

		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e1" },
			})
			.execute();

		// Insert first change_author
		await lix.db
			.insertInto("change_author")
			.values({
				change_id: "c1",
				account_id: account.id,
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("change_author")
				.values({
					change_id: "c1",
					account_id: account.id,
				})
				.execute()
		).rejects.toThrow(/Primary key constraint violation/i);
	}
);

simulationTest(
	"should enforce foreign key constraint on change_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create account (but NOT change)
		const account = await createAccount({
			lix,
			name: "Test Author",
		});

		// Attempt to insert with non-existent change_id
		await expect(
			lix.db
				.insertInto("change_author")
				.values({
					change_id: "c_nonexistent",
					account_id: account.id,
				})
				.execute()
		).rejects.toThrow(
			/Foreign key constraint violation.*lix_change_author.*\(\/change_id\).*lix_change\.\(\/id\)/i
		);
	}
);

simulationTest(
	"should enforce foreign key constraint on account_id",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e1" },
			})
			.execute();

		// Attempt to insert with non-existent account_id
		await expect(
			lix.db
				.insertInto("change_author")
				.values({
					change_id: "c1",
					account_id: "account_nonexistent",
				})
				.execute()
		).rejects.toThrow(
			/Foreign key constraint violation.*lix_change_author.*\(\/account_id\).*lix_account\.\(\/id\)/i
		);
	}
);

simulationTest(
	"should allow multiple authors for the same change",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create accounts
		const author1 = await createAccount({
			lix,
			id: "author1",
			name: "Author One",
		});

		const author2 = await createAccount({
			lix,
			id: "author2",
			name: "Author Two",
		});

		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e1" },
			})
			.execute();

		// Insert multiple authors for same change
		await lix.db
			.insertInto("change_author")
			.values([
				{
					change_id: "c1",
					account_id: author1.id,
				},
				{
					change_id: "c1",
					account_id: author2.id,
				},
			])
			.execute();

		const authors = await lix.db
			.selectFrom("change_author")
			.where("change_id", "=", "c1")
			.orderBy("account_id", "asc")
			.selectAll()
			.execute();

		expect(authors).toHaveLength(2);
		expect(authors).toMatchObject([
			{
				change_id: "c1",
				account_id: author1.id,
			},
			{
				change_id: "c1",
				account_id: author2.id,
			},
		]);
	}
);

simulationTest(
	"should allow same author for multiple changes",
	async ({ openSimulatedLix }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Create account
		const author = await createAccount({
			lix,
			name: "Prolific Author",
		});

		await lix.db
			.insertInto("change")
			.values([
				{
					id: "c1",
					entity_id: "e1",
					schema_key: "mock_schema",
					schema_version: "1",
					file_id: "f1",
					plugin_key: "test_plugin",
					snapshot_content: { id: "e1" },
				},
				{
					id: "c2",
					entity_id: "e2",
					schema_key: "mock_schema",
					schema_version: "1",
					file_id: "f2",
					plugin_key: "test_plugin",
					snapshot_content: { id: "e2" },
				},
			])
			.execute();

		// Insert same author for multiple changes
		await lix.db
			.insertInto("change_author")
			.values([
				{
					change_id: "c1",
					account_id: author.id,
				},
				{
					change_id: "c2",
					account_id: author.id,
				},
			])
			.execute();

		const authorChanges = await lix.db
			.selectFrom("change_author")
			.where("account_id", "=", author.id)
			.orderBy("change_id", "asc")
			.selectAll()
			.execute();

		expect(authorChanges).toHaveLength(2);
		expect(authorChanges).toMatchObject([
			{
				change_id: "c1",
				account_id: author.id,
			},
			{
				change_id: "c2",
				account_id: author.id,
			},
		]);
	}
);

// disabled because change author logic was moved into the commit phase
test.skip("change authors are accessible during a transaction", async () => {
	// Create a lix instance with an active account
	const lix = await openLix({
		account: {
			id: "test-account",
			name: "Test User",
		},
	});

	await lix.db.transaction().execute(async (trx) => {
		// Insert a key-value entity within the transaction
		await trx
			.insertInto("key_value")
			.values({
				key: "transaction_test_key",
				value: "transaction_test_value",
			})
			.execute();

		// The change should be created automatically with change_author records
		// Let's verify we can access the change and its authors within the transaction
		const changes = await trx
			.selectFrom("change")
			.where("entity_id", "=", "transaction_test_key")
			.where("schema_key", "=", "lix_key_value")
			.selectAll()
			.execute();

		expect(changes).toHaveLength(1);
		const changeId = changes[0]!.id;

		// Verify the change_author record is accessible within the transaction
		const changeAuthors = await trx
			.selectFrom("change_author")
			.where("change_id", "=", changeId)
			.selectAll()
			.execute();

		// Find the test account's change author (there may be multiple active accounts)
		const testAuthor = changeAuthors.find(
			(a) => a.account_id === "test-account"
		);
		expect(testAuthor).toBeDefined();
		expect(testAuthor).toMatchObject({
			change_id: changeId,
			account_id: "test-account",
		});
	});

	// Verify the change_author records are still accessible after the transaction commits
	const changes = await lix.db
		.selectFrom("change")
		.where("entity_id", "=", "transaction_test_key")
		.where("schema_key", "=", "lix_key_value")
		.selectAll()
		.execute();

	expect(changes).toHaveLength(1);
	const changeId = changes[0]!.id;

	const changeAuthors = await lix.db
		.selectFrom("change_author")
		.where("change_id", "=", changeId)
		.selectAll()
		.execute();

	expect(changeAuthors).toHaveLength(1);
	expect(changeAuthors[0]).toMatchObject({
		change_id: changeId,
		account_id: "test-account",
	});
});

simulationTest(
	"materializes author for committed key_value and ties lixcol_change_id to commit",
	async ({ openSimulatedLix, expectDeterministic }) => {
		const lix = await openSimulatedLix({
			keyValues: [
				{
					key: "lix_deterministic_mode",
					value: { enabled: true },
					lixcol_version_id: "global",
				},
			],
		});

		// Insert a tracked key_value change
		const kvKey = "kv_mat_auth";
		await lix.db
			.insertInto("key_value")
			.values({ key: kvKey, value: "v1" })
			.execute();

		// Domain change id for the inserted key
		const kvChange = await lix.db
			.selectFrom("change")
			.where("entity_id", "=", kvKey)
			.where("schema_key", "=", "lix_key_value")
			.orderBy("created_at", "desc")
			.select(["id"]) // domain change id
			.executeTakeFirstOrThrow();

		// Synthesized change_author rows must exist for that domain change
		const authors = await lix.db
			.selectFrom("change_author")
			.where("change_id", "=", kvChange.id)
			.selectAll()
			.execute();

		expectDeterministic(authors.length).toBe(1);

		// Active account (anonymous by default)
		const active = await lix.db
			.selectFrom("active_account")
			.selectAll()
			.execute();
		const activeAccountId = active[0]!.account_id;
		expectDeterministic(authors[0]!.account_id).toBe(activeAccountId);

		// Resolve active version commit entity id
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select(["version_id"]) // single row
			.executeTakeFirstOrThrow();
		const versionRow = await lix.db
			.selectFrom("version")
			.where("id", "=", activeVersion.version_id)
			.select(["commit_id"]) // commit entity id
			.executeTakeFirstOrThrow();

		// Find the commit change row id for that commit entity
		const commitRow = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_commit")
			.where("entity_id", "=", versionRow.commit_id)
			.select(["id"]) // commit change row id
			.executeTakeFirstOrThrow();

		// Assert author.lixcol_change_id points to the commit change row id
		expectDeterministic(authors[0]?.lixcol_change_id).toBe(commitRow.id);
	}
);
