import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createLabel } from "../label/create-label.js";
import { attachLabel } from "./label/attach-label.js";
import { ebEntity } from "./eb-entity.js";

test("ebEntity.hasLabel filters entities by label name", async () => {
	const lix = await openLix({});

	// Create labels
	const importantLabel = await createLabel({ lix, name: "important" });
	const archivedLabel = await createLabel({ lix, name: "archived" });

	// Create key-value entries
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "item1", value: "First item" },
			{ key: "item2", value: "Second item" },
			{ key: "item3", value: "Third item" },
		])
		.execute();

	// Get entries from view to get the full entity info
	const entries = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["item1", "item2", "item3"])
		.orderBy("key")
		.selectAll()
		.execute();

	// Label some entries
	await attachLabel({
		lix,
		entity: entries[0]!,
		label: importantLabel,
	});

	await attachLabel({
		lix,
		entity: entries[1]!,
		label: importantLabel,
	});

	await attachLabel({
		lix,
		entity: entries[2]!,
		label: archivedLabel,
	});

	// Query entries with "important" label using new API
	const importantEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").hasLabel({ name: "important" }))
		.select(["key", "value"])
		.execute();

	expect(importantEntries).toHaveLength(2);
	expect(importantEntries.map((e) => e.key).sort()).toEqual(["item1", "item2"]);

	// Query entries with "archived" label
	const archivedEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").hasLabel({ name: "archived" }))
		.select(["key", "value"])
		.execute();

	expect(archivedEntries).toHaveLength(1);
	expect(archivedEntries[0]?.key).toBe("item3");
});

test("ebEntity.hasLabel filters entities by label id", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "test-label" });

	// Create files
	await lix.db
		.insertInto("file")
		.values([
			{
				id: "file0",
				path: "/docs/readme.md",
				data: new TextEncoder().encode("# README"),
			},
			{
				id: "file1",
				path: "/src/index.ts",
				data: new TextEncoder().encode("console.log('hello')"),
			},
			{
				id: "file2",
				path: "/package.json",
				data: new TextEncoder().encode("{}"),
			},
		])
		.execute();

	// Get files from view
	const files = await lix.db
		.selectFrom("file")
		.where("id", "in", ["file0", "file1", "file2"])
		.orderBy("id")
		.selectAll()
		.execute();

	// Label first two files
	for (let i = 0; i < 2; i++) {
		await attachLabel({
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
		.orderBy("id")
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

	// Create conversations
	await lix.db
		.insertInto("conversation")
		.values([{ id: "c1" }, { id: "c2" }, { id: "c3" }])
		.execute();

	// Get conversations from view
	const threads = await lix.db
		.selectFrom("conversation")
		.where("id", "in", ["c1", "c2", "c3"])
		.orderBy("id")
		.selectAll()
		.execute();

	// Label first thread as draft
	await attachLabel({
		lix,
		entity: threads[0]!,
		label: draftLabel,
	});

	// Query conversations that are NOT drafts using new API
	const nonDraftThreads = await lix.db
		.selectFrom("conversation")
		.where((eb) => eb.not(ebEntity("conversation").hasLabel({ name: "draft" })))
		.select(["id"])
		.execute();

	expect(nonDraftThreads).toHaveLength(2);
	expect(nonDraftThreads.map((t) => t.id).sort()).toEqual(["c2", "c3"]);
});

test("ebEntity.equals matches entities by composite key", async () => {
	const lix = await openLix({});

	// Create multiple key-value entries
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "config1", value: "Development" },
			{ key: "config2", value: "Production" },
			{ key: "config3", value: "Testing" },
		])
		.execute();

	// Get entries from view
	const entries = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["config1", "config2", "config3"])
		.orderBy("key")
		.selectAll()
		.execute();

	const targetEntry = entries[1]!; // config2

	// Query for the specific entry using equals
	const matchingEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").equals(targetEntry))
		.select(["key", "value"])
		.execute();

	expect(matchingEntries).toHaveLength(1);
	expect(matchingEntries[0]?.key).toBe("config2");
	expect(matchingEntries[0]?.value).toBe("Production");
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

	const targetEntries = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["item1", "item2"])
		.orderBy("key")
		.selectAll()
		.execute();

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
		.insertInto("key_value")
		.values({ key: "acc1", value: "Test Account" })
		.execute();

	await lix.db.insertInto("conversation").values({ id: "thread1" }).execute();

	// Get entity info from views
	const kv = await lix.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "acc1")
		.executeTakeFirstOrThrow();

	const thread = await lix.db
		.selectFrom("conversation")
		.selectAll()
		.where("id", "=", "thread1")
		.executeTakeFirstOrThrow();

	// Label all entities as reviewed
	for (const entity of [kv, thread]) {
		await attachLabel({
			lix,
			entity: entity,
			label: reviewedLabel,
		});
	}

	// Query reviewed entities from different tables using new API
	const reviewedKeyValues = await lix.db
		.selectFrom("key_value")
		.where(ebEntity("key_value").hasLabel({ name: "reviewed" }))
		.selectAll()
		.execute();

	const reviewedThreads = await lix.db
		.selectFrom("conversation")
		.where(ebEntity("conversation").hasLabel({ name: "reviewed" }))
		.selectAll()
		.execute();

	expect(reviewedKeyValues).toHaveLength(1);
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
	const issues = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["issue1", "issue2", "issue3", "issue4"])
		.orderBy("key")
		.selectAll()
		.execute();

	// Label issues
	// issue1: urgent + bug
	await attachLabel({
		lix,
		entity: issues[0]!,
		label: urgentLabel,
	});
	await attachLabel({
		lix,
		entity: issues[0]!,
		label: bugLabel,
	});

	// issue2: urgent only
	await attachLabel({
		lix,
		entity: issues[1]!,
		label: urgentLabel,
	});

	// issue3: bug only
	await attachLabel({
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

	// Create key-value entries first
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "user1", value: "Alice" },
			{ key: "user2", value: "Bob" },
			{ key: "user3", value: "Charlie" },
		])
		.execute();

	// Get key-value entities from view
	const keyValues = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["user1", "user2", "user3"])
		.orderBy("key")
		.selectAll()
		.execute();

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

	// Get the user key-value entity for Alice (has canonical columns)
	const userKeyValue = keyValues.find((kv) => kv.key === "user1")!;

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
			userKeyValue.key
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
		.orderBy("entity_id")
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

	// Create some key-value entries to test with view tables
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "pref1", value: "Dark mode" },
			{ key: "pref2", value: "Light mode" },
			{ key: "pref3", value: "Auto mode" },
		])
		.execute();

	const entries = await lix.db
		.selectFrom("key_value")
		.where("key", "in", ["pref1", "pref2"])
		.orderBy("key")
		.selectAll()
		.execute();

	// Test ebEntity().in() without specifying table - should work for view tables
	const matchingEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity().in(entries))
		.select(["key", "value"])
		.execute();

	expect(matchingEntries).toHaveLength(2);
	expect(matchingEntries.map((e) => e.key).sort()).toEqual(["pref1", "pref2"]);

	// Test ebEntity().equals() without table parameter
	const targetEntry = entries[0]!;
	const foundEntry = await lix.db
		.selectFrom("key_value")
		.where(ebEntity().equals(targetEntry))
		.selectAll()
		.executeTakeFirst();

	expect(foundEntry?.key).toBe("pref1");
	expect(foundEntry?.value).toBe("Dark mode");

	// Test with labels too
	const testLabel = await createLabel({ lix, name: "test-optional" });
	await attachLabel({
		lix,
		entity: entries[1]!,
		label: testLabel,
	});

	// ebEntity().hasLabel() without table parameter
	const labeledEntries = await lix.db
		.selectFrom("key_value")
		.where(ebEntity().hasLabel({ name: "test-optional" }))
		.select(["key"])
		.execute();

	expect(labeledEntries).toHaveLength(1);
	expect(labeledEntries[0]?.key).toBe("pref2");
});

test("ebEntity without table parameter fails when context is ambiguous (joins)", async () => {
	const lix = await openLix({});

	// Create some test data
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "user1", value: "Alice" },
			{ key: "user2", value: "Bob" },
		])
		.execute();

	await lix.db
		.insertInto("conversation")
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
	const keyValue = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "user1")
		.selectAll()
		.executeTakeFirstOrThrow();

	//  Join between key_value (view) and thread (view) - both use lixcol_* columns
	// This should fail because we have ambiguous column references
	await expect(
		lix.db
			.selectFrom("key_value")
			.innerJoin("conversation", "conversation.id", "key_value.key") // Contrived join
			.where(ebEntity().equals(keyValue))
			.selectAll()
			.execute()
	).rejects.toThrow(/ambiguous|lixcol_entity_id/i);

	//  Using hasLabel without table on joined query should also fail
	await createLabel({ lix, name: "ambiguous-test" });

	await expect(
		lix.db
			.selectFrom("key_value")
			.innerJoin("conversation", "conversation.id", "key_value.key")
			.where(ebEntity().hasLabel({ name: "ambiguous-test" }))
			.selectAll()
			.execute()
	).rejects.toThrow(/ambiguous|lixcol_entity_id/i);

	// Correct usage: specify the table when using joins
	// Create a thread with ID matching a key_value key for the join to work
	await lix.db
		.insertInto("conversation")
		.values({ id: "user1" }) // Same as key_value key
		.execute();

	const correctQuery = await lix.db
		.selectFrom("key_value")
		.innerJoin("conversation", "conversation.id", "key_value.key")
		.where(ebEntity("key_value").equals(keyValue))
		.select(["key_value.key", "key_value.value"])
		.execute();

	expect(correctQuery).toHaveLength(1);
	expect(correctQuery[0]?.key).toBe("user1");
});
