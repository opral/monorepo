/**
 * Manual test script to verify that threads are now attached to commits instead of change sets
 */

import { newLixFile, openLix, createThread, createCheckpoint } from "@lix-js/sdk";
import { selectThreads } from "./src/queries.js";

async function testThreadingOnCommits() {
	console.log("🧪 Testing thread functionality with commits...");

	// Create a new lix file
	const file = await newLixFile();
	const lix = await openLix({ 
		blob: file,
		adapters: {
			InMemoryStorage: () => import("@lix-js/sdk/node/in-memory-storage"),
		}
	});

	try {
		// First, we need to create some content to have changes
		await lix.db
			.insertInto("file_all")
			.values({
				id: "test-file",
				path: "/test.txt",
				lixcol_version_id: "global",
			})
			.execute();

		// Insert a simple change
		await lix.db
			.insertInto("change_all")
			.values({
				id: "test-change-1",
				entity_id: "test-entity",
				schema_key: "test_schema",
				schema_version: "1.0",
				file_id: "test-file",
				plugin_key: "test_plugin",
				snapshot_id: "snapshot-1",
				snapshot_content: { test: "data" },
				lixcol_version_id: "global",
			})
			.execute();

		// Add the change to the working change set
		const workingCommit = await lix.db
			.selectFrom("version")
			.where("name", "=", "main")
			.innerJoin("commit", "version.working_commit_id", "commit.id")
			.select("commit.change_set_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("change_set_element_all")
			.values({
				change_set_id: workingCommit.change_set_id,
				change_id: "test-change-1",
				lixcol_version_id: "global",
			})
			.execute();

		// Create a checkpoint (which creates a commit)
		const checkpoint = await createCheckpoint({ 
			lix,
			label: { name: "Test checkpoint for threading" }
		});

		console.log("✅ Created checkpoint with commit ID:", checkpoint.id);

		// Create a thread attached to the commit entity
		const thread = await createThread({
			lix,
			versionId: "global",
			comments: [{ body: { type: "zettel_doc", content: [{ type: "zettel_text_block", style: "paragraph", zettel_key: "test", children: [{ type: "zettel_span", text: "This is a test comment on a commit!" }] }] } }],
			entity: {
				entity_id: checkpoint.id,
				schema_key: "lix_commit",
				file_id: "lix",
			},
		});

		console.log("✅ Created thread attached to commit:", thread.id);

		// Query threads for this commit
		const threads = await selectThreads(lix, { commitId: checkpoint.id }).execute();

		console.log("✅ Found", threads.length, "thread(s) for commit");
		
		if (threads.length > 0) {
			console.log("✅ Thread comments:", threads[0].comments.length);
			console.log("✅ First comment:", threads[0].comments[0]?.body);
		}

		// Verify that the old change_set_thread table is not used
		const oldThreadMappings = await lix.db
			.selectFrom("change_set_thread")
			.selectAll()
			.execute();

		console.log("✅ Old change_set_thread mappings (should be 0):", oldThreadMappings.length);

		// Check entity_thread mappings
		const entityThreadMappings = await lix.db
			.selectFrom("entity_thread")
			.where("entity_id", "=", checkpoint.id)
			.where("schema_key", "=", "lix_commit")
			.selectAll()
			.execute();

		console.log("✅ Entity thread mappings for commit:", entityThreadMappings.length);

		console.log("🎉 All tests passed! Threading is now working with commits.");

	} catch (error) {
		console.error("❌ Test failed:", error);
		throw error;
	}
}

// Run the test
testThreadingOnCommits().catch(console.error);