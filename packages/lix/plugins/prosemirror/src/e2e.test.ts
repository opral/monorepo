import { expect, test } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./index.js";
// import fs from "node:fs/promises";

test("detects changes when inserting a prosemirror document", async () => {
	// Initialize Lix with the ProseMirror plugin
	const lix = await openLixInMemory({
		providePlugins: [plugin],
	});

	// Create initial document
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Initial paragraph" }],
			},
		],
	};

	// Convert to binary data
	const initialData = new TextEncoder().encode(JSON.stringify(initialDoc));

	// Store in Lix using direct database insert
	await lix.db
		.insertInto("file")
		.values({
			path: "/prosemirror.json",
			data: initialData,
		})
		.execute();

	// Create modified document with a new paragraph
	const modifiedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Modified paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "New paragraph" }],
			},
		],
	};

	// Convert to binary data
	const modifiedData = new TextEncoder().encode(JSON.stringify(modifiedDoc));

	// Update the document in Lix
	// Using the standard database insert which is what the UI uses
	await lix.db
		.updateTable("file")
		.set({
			data: modifiedData,
		})
		.where("path", "=", "/prosemirror.json")
		.execute();

	// Get the changes from the database
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.where("plugin_key", "=", plugin.key)
		.select(["change.entity_id", "snapshot.content"])
		.execute();

	// Verify that the correct changes were detected
	expect(changes.length).toBe(3);

	// There may be multiple changes for p1 (initial and modified)
	// So we'll check that at least one of them has the modified content
	const p1Changes = changes.filter((c) => c.entity_id === "p1");
	expect(p1Changes.length).toBeGreaterThanOrEqual(1);

	// At least one p1 change should have the modified content
	const hasModifiedP1 = p1Changes.some((change) => {
		if (change?.content) {
			const content = change.content as any;
			return content.content?.[0]?.text === "Modified paragraph";
		}
		return false;
	});

	expect(hasModifiedP1).toBe(true);

	// Check for new paragraph p2
	const p2Change = changes.find((c) => c.entity_id === "p2");
	expect(p2Change).toBeDefined();
	if (p2Change?.content) {
		const content = p2Change.content as any;
		expect(content.content?.[0]?.text).toBe("New paragraph");
	}
});

// test.each(["../example/assets/before.json", "../example/assets/after.json"])(
// 	"beforeAfterOfFile() reconstructs the same file %s",
// 	async (filepath) => {
// 		const lix = await openLixInMemory({
// 			providePlugins: [plugin],
// 		});

// 		const exampleFile = await fs.readFile(
// 			new URL(filepath, import.meta.url).pathname,
// 		);

// 		const exampleParsed = JSON.parse(new TextDecoder().decode(exampleFile));

// 		const versionBefore = await lix.db
// 			.selectFrom("active_version")
// 			.innerJoin("version", "active_version.version_id", "version.id")
// 			.selectAll("version")
// 			.executeTakeFirstOrThrow();

// 		const file = await lix.db
// 			.insertInto("file")
// 			.values({
// 				id: "mock-file-id",
// 				path: "/prosemirror.json",
// 				data: exampleFile,
// 			})
// 			.returningAll()
// 			.executeTakeFirstOrThrow();

// 		await fileQueueSettled({ lix });

// 		const versionAfter = await lix.db
// 			.selectFrom("active_version")
// 			.innerJoin("version", "active_version.version_id", "version.id")
// 			.selectAll("version")
// 			.executeTakeFirstOrThrow();

// 		const { after } = await beforeAfterOfFile({
// 			lix,
// 			file,
// 			changeSetBefore: { id: versionBefore.change_set_id },
// 			changeSetAfter: { id: versionAfter.change_set_id },
// 		});

// 		const reconstructedParsed = JSON.parse(
// 			new TextDecoder().decode(after?.data),
// 		);

// 		expect(reconstructedParsed).toEqual(exampleParsed);
// 	},
// );
