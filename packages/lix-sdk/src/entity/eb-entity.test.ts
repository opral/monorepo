import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createLabel } from "../label/create-label.js";
import { createEntityLabel } from "./label/create-entity-label.js";
import { ebEntity } from "./eb-entity.js";

test("ebEntity.hasLabel filters entities by label name", async () => {
	const lix = await openLix({});

	// Create labels
	const importantLabel = await createLabel({ lix, name: "important" });
	const archivedLabel = await createLabel({ lix, name: "archived" });

	// Create accounts
	await lix.db
		.insertInto("account")
		.values([
			{ id: "acc1", name: "John Doe" },
			{ id: "acc2", name: "Jane Smith" },
			{ id: "acc3", name: "Bob Johnson" },
		])
		.execute();

	// Get accounts from view to get the full entity info
	const accounts = await lix.db.selectFrom("account").selectAll().execute();

	// Label some accounts
	await createEntityLabel({
		lix,
		entity: accounts[0]!,
		label: importantLabel,
	});

	await createEntityLabel({
		lix,
		entity: accounts[1]!,
		label: importantLabel,
	});

	await createEntityLabel({
		lix,
		entity: accounts[2]!,
		label: archivedLabel,
	});

	// Query accounts with "important" label using new API
	const importantAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity("account").hasLabel({ name: "important" }))
		.select(["id", "name"])
		.execute();

	expect(importantAccounts).toHaveLength(2);
	expect(importantAccounts.map((a) => a.id).sort()).toEqual(["acc1", "acc2"]);

	// Query accounts with "archived" label
	const archivedAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity("account").hasLabel({ name: "archived" }))
		.select(["id", "name"])
		.execute();

	expect(archivedAccounts).toHaveLength(1);
	expect(archivedAccounts[0]?.id).toBe("acc3");
});

test("ebEntity.hasLabel filters entities by label id", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "test-label" });

	// Create files
	await lix.db
		.insertInto("file")
		.values([
			{
				path: "/docs/readme.md",
				data: new Uint8Array(Buffer.from("# README")),
			},
			{
				path: "/src/index.ts",
				data: new Uint8Array(Buffer.from("console.log('hello')")),
			},
			{ path: "/package.json", data: new Uint8Array(Buffer.from("{}")) },
		])
		.execute();

	// Get files from view
	const files = await lix.db.selectFrom("file").selectAll().execute();

	// Label first two files
	for (let i = 0; i < 2; i++) {
		await createEntityLabel({
			lix,
			entity: files[i]!,
			label: label,
		});
	}

	// Query files with label by id using new API
	const labeledFiles = await lix.db
		.selectFrom("file")
		.where(ebEntity("file").hasLabel({ id: label.id }))
		.select(["path"])
		.execute();

	expect(labeledFiles).toHaveLength(2);
	expect(labeledFiles.map((f) => f.path).sort()).toEqual([
		"/docs/readme.md",
		"/src/index.ts",
	]);
});

test("ebEntity.hasLabel with negation", async () => {
	const lix = await openLix({});

	const draftLabel = await createLabel({ lix, name: "draft" });

	// Create threads
	await lix.db
		.insertInto("thread")
		.values([{ id: "thread1" }, { id: "thread2" }, { id: "thread3" }])
		.execute();

	// Get threads from view
	const threads = await lix.db.selectFrom("thread").selectAll().execute();

	// Label first thread as draft
	await createEntityLabel({
		lix,
		entity: threads[0]!,
		label: draftLabel,
	});

	// Query threads that are NOT drafts using new API
	const nonDraftThreads = await lix.db
		.selectFrom("thread")
		.where((eb) => eb.not(ebEntity("thread").hasLabel({ name: "draft" })))
		.select(["id"])
		.execute();

	expect(nonDraftThreads).toHaveLength(2);
	expect(nonDraftThreads.map((t) => t.id).sort()).toEqual([
		"thread2",
		"thread3",
	]);
});

test("ebEntity.equals matches entities by composite key", async () => {
	const lix = await openLix({});

	// Create multiple accounts
	await lix.db
		.insertInto("account")
		.values([
			{ id: "acc1", name: "John" },
			{ id: "acc2", name: "Jane" },
			{ id: "acc3", name: "Bob" },
		])
		.execute();

	// Get accounts from view
	const accounts = await lix.db.selectFrom("account").selectAll().execute();

	const targetAccount = accounts[1]!; // Jane

	// Query for the specific account using equals
	const matchingAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity("account").equals(targetAccount))
		.select(["id", "name"])
		.execute();

	expect(matchingAccounts).toHaveLength(1);
	expect(matchingAccounts[0]?.id).toBe("acc2");
	expect(matchingAccounts[0]?.name).toBe("Jane");
});

test("ebEntity.equals works with canonical column names", async () => {
	// Create a canonical entity (entity with canonical column names)
	const canonicalEntity = {
		entity_id: "test-entity",
		schema_key: "test_schema",
		file_id: "test-file",
	};

	// Test that equals method works with canonical column names
	// Note: This is a conceptual test - in practice you'd use this with tables like "state"
	const filterFunction = ebEntity("state").equals(canonicalEntity);

	// Verify the function is created without throwing errors
	expect(typeof filterFunction).toBe("function");
});

test("ebEntity.in filters entities by multiple entities", async () => {
	const lix = await openLix({});

	// Create multiple key-value entries
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "item1", value: "First item" },
			{ key: "item2", value: "Second item" },
			{ key: "item3", value: "Third item" },
			{ key: "item4", value: "Fourth item" },
		])
		.execute();

	// Get all entries
	const allEntries = await lix.db.selectFrom("key_value").selectAll().execute();

	// Select the first 2 entries to filter by
	const targetEntries = allEntries.slice(0, 2);

	// Query for entries matching the target list
	const matchingEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").in(targetEntries))
		.select(["key", "value"])
		.orderBy("key")
		.execute();

	expect(matchingEntries).toHaveLength(2);
	expect(matchingEntries.map((e) => e.key)).toEqual(["item1", "item2"]);
});

test("ebEntity.in handles empty array", async () => {
	const lix = await openLix({});

	// Create some entries
	await lix.db
		.insertInto("key_value")
		.values([{ key: "item1", value: "First item" }])
		.execute();

	// Query with empty array should return no results
	const matchingEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").in([]))
		.select(["key"])
		.execute();

	expect(matchingEntries).toHaveLength(0);
});

test("ebEntity works with different entity types", async () => {
	const lix = await openLix({});

	const reviewedLabel = await createLabel({ lix, name: "reviewed" });

	// Create various entities
	await lix.db
		.insertInto("account")
		.values({ id: "acc1", name: "Test Account" })
		.execute();

	await lix.db.insertInto("thread").values({ id: "thread1" }).execute();

	// Get entity info from views
	const account = await lix.db
		.selectFrom("account")
		.selectAll()
		.where("id", "=", "acc1")
		.executeTakeFirstOrThrow();

	const thread = await lix.db
		.selectFrom("thread")
		.selectAll()
		.where("id", "=", "thread1")
		.executeTakeFirstOrThrow();

	// Label all entities as reviewed
	for (const entity of [account, thread]) {
		await createEntityLabel({
			lix,
			entity: entity,
			label: reviewedLabel,
		});
	}

	// Query reviewed entities from different tables using new API
	const reviewedAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity("account").hasLabel({ name: "reviewed" }))
		.selectAll()
		.execute();

	const reviewedThreads = await lix.db
		.selectFrom("thread")
		.where(ebEntity("thread").hasLabel({ name: "reviewed" }))
		.selectAll()
		.execute();

	expect(reviewedAccounts).toHaveLength(1);
	expect(reviewedThreads).toHaveLength(1);
});

test("ebEntity with multiple labels and complex conditions", async () => {
	const lix = await openLix({});

	const urgentLabel = await createLabel({ lix, name: "urgent" });
	const bugLabel = await createLabel({ lix, name: "bug" });

	// Create key-value entries
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "issue1", value: "Login bug" },
			{ key: "issue2", value: "Performance issue" },
			{ key: "issue3", value: "UI glitch" },
			{ key: "issue4", value: "Feature request" },
		])
		.execute();

	// Get entities from view
	const issues = await lix.db.selectFrom("key_value").selectAll().execute();

	// Label issues
	// issue1: urgent + bug
	await createEntityLabel({
		lix,
		entity: issues[0]!,
		label: urgentLabel,
	});
	await createEntityLabel({
		lix,
		entity: issues[0]!,
		label: bugLabel,
	});

	// issue2: urgent only
	await createEntityLabel({
		lix,
		entity: issues[1]!,
		label: urgentLabel,
	});

	// issue3: bug only
	await createEntityLabel({
		lix,
		entity: issues[2]!,
		label: bugLabel,
	});

	// issue4: no labels

	// Query urgent bugs (both labels) using new API
	const urgentBugs = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").hasLabel({ name: "urgent" }))
		.where(ebEntity("key_value").hasLabel({ name: "bug" }))
		.select(["key", "value"])
		.execute();

	expect(urgentBugs).toHaveLength(1);
	expect(urgentBugs[0]?.key).toBe("issue1");

	// Query urgent OR bug (either label) using new API
	const urgentOrBug = await lix.db
		.selectFrom("key_value")
		.where((eb) =>
			eb.or([
				ebEntity("key_value").hasLabel({ name: "urgent" })(eb),
				ebEntity("key_value").hasLabel({ name: "bug" })(eb),
			])
		)
		.select(["key"])
		.orderBy("key")
		.execute();

	expect(urgentOrBug).toHaveLength(3);
	expect(urgentOrBug.map((i) => i.key)).toEqual(["issue1", "issue2", "issue3"]);
});

test("ebEntity works with state table using canonical columns", async () => {
	const lix = await openLix({});

	// Create accounts first
	await lix.db
		.insertInto("account")
		.values([
			{ id: "user1", name: "Alice" },
			{ id: "user2", name: "Bob" },
			{ id: "user3", name: "Charlie" },
		])
		.execute();

	// Get account entities from view
	const accounts = await lix.db.selectFrom("account").selectAll().execute();

	// Create entities in state table directly
	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "doc1",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: {
					id: "doc1",
					title: "User Guide",
					author_id: "user1", // Reference to Alice
				},
			},
			{
				entity_id: "doc2",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: {
					id: "doc2",
					title: "API Reference",
					author_id: "user2", // Reference to Bob
				},
			},
			{
				entity_id: "doc3",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: {
					id: "doc3",
					title: "Tutorial",
					author_id: "user1", // Another doc by Alice
				},
			},
		])
		.execute();

	// Get the user account entity for Alice (has canonical columns)
	const userAccount = accounts.find((a) => a.id === "user1")!;

	// Query state table for all documents authored by this specific user account
	// This simulates a real-world scenario where you want to find all entities
	// that reference a specific account entity
	const documentsbyUser = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "document")
		.where(
			(eb) =>
				eb.fn("json_extract", [
					eb.ref("snapshot_content"),
					eb.val("$.author_id"),
				]),
			"=",
			userAccount.id
		)
		.selectAll()
		.execute();

	expect(documentsbyUser).toHaveLength(2);
	expect(documentsbyUser.map((d) => d.snapshot_content.title).sort()).toEqual([
		"Tutorial",
		"User Guide",
	]);

	// Now test ebEntity.equals with state table
	// First get a document entity from state
	const targetDocument = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "doc1")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Use ebEntity to find this exact entity
	const matchingDocuments = await lix.db
		.selectFrom("state")
		.where(ebEntity("state").equals(targetDocument))
		.selectAll()
		.execute();

	expect(matchingDocuments).toHaveLength(1);
	expect(matchingDocuments[0]?.entity_id).toBe("doc1");
	expect(matchingDocuments[0]?.snapshot_content.title).toBe("User Guide");

	// Test ebEntity.in with state table
	const firstTwoDocs = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "document")
		.limit(2)
		.selectAll()
		.execute();

	const matchingDocs = await lix.db
		.selectFrom("state")
		.where(ebEntity("state").in(firstTwoDocs))
		.select(["entity_id", "snapshot_content"])
		.execute();

	expect(matchingDocs).toHaveLength(2);
	expect(matchingDocs.map((d) => d.entity_id).sort()).toEqual(["doc1", "doc2"]);
});

test("ebEntity works without table parameter when context is unambiguous", async () => {
	const lix = await openLix({});

	// Create entities in state table
	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "doc1",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "doc1", title: "Guide" },
			},
			{
				entity_id: "doc2",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "doc2", title: "Tutorial" },
			},
			{
				entity_id: "doc3",
				schema_key: "document",
				file_id: "docs.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "doc3", title: "Reference" },
			},
		])
		.execute();

	// Get some docs to test with
	const firstTwoDocs = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "document")
		.limit(2)
		.selectAll()
		.execute();

	// Test ebEntity().in() without specifying table - should work for state table
	const matchingDocs = await lix.db
		.selectFrom("state")
		.where(ebEntity().in(firstTwoDocs))
		.select(["entity_id", "snapshot_content"])
		.execute();

	expect(matchingDocs).toHaveLength(2);
	expect(matchingDocs.map((d) => d.entity_id).sort()).toEqual(["doc1", "doc2"]);

	// Create some accounts to test with view tables
	await lix.db
		.insertInto("account")
		.values([
			{ id: "acc1", name: "Alice" },
			{ id: "acc2", name: "Bob" },
			{ id: "acc3", name: "Charlie" },
		])
		.execute();

	const accounts = await lix.db
		.selectFrom("account")
		.limit(2)
		.selectAll()
		.execute();

	// Test ebEntity().in() without specifying table - should work for view tables
	const matchingAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity().in(accounts))
		.select(["id", "name"])
		.execute();

	expect(matchingAccounts).toHaveLength(2);
	expect(matchingAccounts.map((a) => a.id).sort()).toEqual(["acc1", "acc2"]);

	// Test ebEntity().equals() without table parameter
	const targetAccount = accounts[0]!;
	const foundAccount = await lix.db
		.selectFrom("account")
		.where(ebEntity().equals(targetAccount))
		.selectAll()
		.executeTakeFirst();

	expect(foundAccount?.id).toBe("acc1");
	expect(foundAccount?.name).toBe("Alice");

	// Test with labels too
	const testLabel = await createLabel({ lix, name: "test-optional" });
	await createEntityLabel({
		lix,
		entity: accounts[1]!,
		label: testLabel,
	});

	// ebEntity().hasLabel() without table parameter
	const labeledAccounts = await lix.db
		.selectFrom("account")
		.where(ebEntity().hasLabel({ name: "test-optional" }))
		.select(["id"])
		.execute();

	expect(labeledAccounts).toHaveLength(1);
	expect(labeledAccounts[0]?.id).toBe("acc2");
});

test("ebEntity without table parameter fails when context is ambiguous (joins)", async () => {
	const lix = await openLix({});

	// Create some test data
	await lix.db
		.insertInto("account")
		.values([
			{ id: "user1", name: "Alice" },
			{ id: "user2", name: "Bob" },
		])
		.execute();

	await lix.db
		.insertInto("thread")
		.values([{ id: "thread1" }, { id: "thread2" }])
		.execute();

	// Create entities for state table
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "msg1",
			schema_key: "message",
			file_id: "messages.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: {
				id: "msg1",
				thread_id: "thread1",
				author_id: "user1",
				content: "Hello",
			},
		})
		.execute();

	// Get entities for testing
	const account = await lix.db
		.selectFrom("account")
		.where("id", "=", "user1")
		.selectAll()
		.executeTakeFirstOrThrow();

	//  Join between account (view) and thread (view) - both use lixcol_* columns
	// This should fail because we have ambiguous column references
	await expect(
		lix.db
			.selectFrom("account")
			.innerJoin("thread", "thread.id", "account.id") // Contrived join
			.where(ebEntity().equals(account))
			.selectAll()
			.execute()
	).rejects.toThrow(/ambiguous|lixcol_entity_id/i);

	//  Using hasLabel without table on joined query should also fail
	await createLabel({ lix, name: "ambiguous-test" });

	await expect(
		lix.db
			.selectFrom("account")
			.innerJoin("thread", "thread.id", "account.id")
			.where(ebEntity().hasLabel({ name: "ambiguous-test" }))
			.selectAll()
			.execute()
	).rejects.toThrow(/ambiguous|lixcol_entity_id/i);

	// Correct usage: specify the table when using joins
	// Create a thread with ID matching an account ID for the join to work
	await lix.db
		.insertInto("thread")
		.values({ id: "user1" }) // Same as account ID
		.execute();

	const correctQuery = await lix.db
		.selectFrom("account")
		.innerJoin("thread", "thread.id", "account.id")
		.where(ebEntity("account").equals(account))
		.select(["account.id", "account.name"])
		.execute();

	expect(correctQuery).toHaveLength(1);
	expect(correctQuery[0]?.id).toBe("user1");
});
