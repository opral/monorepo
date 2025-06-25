import { describe, expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createAccount } from "../account/create-account.js";

describe("change_author", () => {
	test("insert, update, delete on the change_author view", async () => {
		const lix = await openLixInMemory({});

		// Create account
		const account = await createAccount({
			lix,
			name: "Test Author",
		});

		// Create snapshot
		await lix.db
			.insertInto("snapshot")
			.values({
				id: "s0",
				content: { id: "e0" },
			})
			.execute();

		// Create change
		await lix.db
			// @ts-expect-error - internal_change is not a public table
			.insertInto("internal_change")
			.values({
				id: "c0",
				entity_id: "e0",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f0",
				plugin_key: "test_plugin",
				snapshot_id: "s0",
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
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
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
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);

		// After delete, there should be no state records for the change_author
		const allStates = await lix.db
			.selectFrom("state_all")
			.where("schema_key", "=", "lix_change_author")
			.selectAll()
			.execute();

		expect(allStates).toHaveLength(0); // All records should be deleted
	});

	test("should enforce primary key constraint (change_id, account_id)", async () => {
		const lix = await openLixInMemory({});

		// Create account
		const account = await createAccount({
			lix,
			name: "Test Author",
		});

		// Create snapshot and change
		await lix.db
			.insertInto("snapshot")
			.values({ id: "s1", content: { id: "e1" } })
			.execute();

		await lix.db
			// @ts-expect-error - internal_change is not a public table
			.insertInto("internal_change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_id: "s1",
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
	});

	test("should enforce foreign key constraint on change_id", async () => {
		const lix = await openLixInMemory({});

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
			/Foreign key constraint violation.*change_id.*lix_change.id/i
		);
	});

	test("should enforce foreign key constraint on account_id", async () => {
		const lix = await openLixInMemory({});

		// Create snapshot and change (but NOT account)
		await lix.db
			.insertInto("snapshot")
			.values({ id: "s1", content: { id: "e1" } })
			.execute();

		await lix.db
			// @ts-expect-error - internal_change is not a public table
			.insertInto("internal_change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_id: "s1",
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
			/Foreign key constraint violation.*account_id.*lix_account.id/i
		);
	});

	test("should allow multiple authors for the same change", async () => {
		const lix = await openLixInMemory({});

		// Create accounts
		const author1 = await createAccount({
			lix,
			name: "Author One",
		});

		const author2 = await createAccount({
			lix,
			name: "Author Two",
		});

		// Create snapshot and change
		await lix.db
			.insertInto("snapshot")
			.values({ id: "s1", content: { id: "e1" } })
			.execute();

		await lix.db
			// @ts-expect-error - internal_change is not a public table
			.insertInto("internal_change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				schema_version: "1",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_id: "s1",
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
	});

	test("should allow same author for multiple changes", async () => {
		const lix = await openLixInMemory({});

		// Create account
		const author = await createAccount({
			lix,
			name: "Prolific Author",
		});

		// Create snapshots and changes
		await lix.db
			.insertInto("snapshot")
			.values([
				{ id: "s1", content: { id: "e1" } },
				{ id: "s2", content: { id: "e2" } },
			])
			.execute();

		await lix.db
			// @ts-expect-error - internal_change is not a public table
			.insertInto("internal_change")
			.values([
				{
					id: "c1",
					entity_id: "e1",
					schema_key: "mock_schema",
					schema_version: "1",
					file_id: "f1",
					plugin_key: "test_plugin",
					snapshot_id: "s1",
				},
				{
					id: "c2",
					entity_id: "e2",
					schema_key: "mock_schema",
					schema_version: "1",
					file_id: "f2",
					plugin_key: "test_plugin",
					snapshot_id: "s2",
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
	});
});
