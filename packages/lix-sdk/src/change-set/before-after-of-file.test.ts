import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";
import { beforeAfterOfFile } from "./before-after-of-file.js";

test("gives the before and after state without altering the current state", async () => {
	// Create a Lix instance with the mock JSON plugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Create a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode("{}"),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create states and checkpoints using a loop
	const updates = [
		// Initial state (cs0)
		{
			l0: "Value 0",
			l1: "Value 1",
			l2: "Value 2",
		},
		// Modified state (cs1)
		{
			l0: "Value 0",
			l1: "Value 1 Modified",
			l2: "Value 2 Modified",
		},
		// Final state with additional fields (cs2)
		{
			l0: "Value 0 Modified",
			l1: "Value 1 Modified",
			l2: "Value 2 Modified",
			l3: "Value 3",
		},
	];

	const checkpoints = [];

	for (const [index, update] of updates.entries()) {
		// Update file with the current state
		await lix.db
			.updateTable("file")
			.set({
				data: new TextEncoder().encode(JSON.stringify(update)),
			})
			.where("id", "=", file.id)
			.execute();

		// Wait for file queue to process changes
		await fileQueueSettled({ lix });

		// Create checkpoint for the current state
		const checkpoint = await createCheckpoint({ id: `cs${index}`, lix });
		checkpoints.push(checkpoint);
	}

	// Destructure checkpoints for clarity
	const [cs0, cs1, cs2] = checkpoints;

	// Ensure checkpoints were created successfully
	expect(cs0).toBeDefined();
	expect(cs1).toBeDefined();
	expect(cs2).toBeDefined();

	// Capture the current state of the file before using beforeAfterOfFile
	const originalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const originalState = JSON.parse(new TextDecoder().decode(originalFile.data));

	// Verify the original state matches the latest update
	expect(originalState).toEqual(updates[2]);

	// Test case 1: Compare cs0 and cs1
	const result1 = await beforeAfterOfFile({
		lix,
		changeSetBefore: cs0!,
		changeSetAfter: cs1!,
		file: { id: file.id },
	});

	// Verify the before state matches cs0
	const beforeState1 = JSON.parse(
		new TextDecoder().decode(result1.before!.data)
	);
	expect(beforeState1).toEqual(updates[0]);

	// Verify the after state matches cs1
	const afterState1 = JSON.parse(new TextDecoder().decode(result1.after!.data));
	expect(afterState1).toEqual(updates[1]);

	// Test case 3: Compare cs0 and cs2 (skipping cs1)
	const result3 = await beforeAfterOfFile({
		lix,
		changeSetBefore: cs0!,
		changeSetAfter: cs2!,
		file: { id: file.id },
	});

	// Verify the before state matches cs0
	const beforeState3 = JSON.parse(
		new TextDecoder().decode(result3.before!.data)
	);
	expect(beforeState3).toEqual(updates[0]);

	// Verify the after state matches cs2
	const afterState3 = JSON.parse(new TextDecoder().decode(result3.after!.data));
	expect(afterState3).toEqual(updates[2]);

	// Verify the current state of the file is unchanged after all operations
	const currentFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const currentState = JSON.parse(new TextDecoder().decode(currentFile.data));

	// The current state should still match the original state (updates[2])
	expect(currentState).toEqual(originalState);
	expect(currentState).toEqual(updates[2]);

	// Verify file properties are preserved
	expect(currentFile.id).toBe(originalFile.id);
	expect(currentFile.path).toBe(originalFile.path);
});

test("returns an empty file object for before state when it doesn't exist", async () => {
	// Create a Lix instance with the mock JSON plugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Create two checkpoints
	// First checkpoint (cs0) - file doesn't exist yet
	const cs0 = await createCheckpoint({ id: "cs0", lix });

	// Create a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(JSON.stringify({ key: "value" })),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Wait for file queue to process changes
	await fileQueueSettled({ lix });

	// Second checkpoint (cs1) - file exists with content
	const cs1 = await createCheckpoint({ id: "cs1", lix });

	// Test the beforeAfterOfFile function
	const result = await beforeAfterOfFile({
		lix,
		changeSetBefore: cs0!,
		changeSetAfter: cs1!,
		file: { id: file.id },
	});

	// Verify that before is an empty file (file didn't exist in cs0)
	expect(result.before).toBeUndefined();
	// Verify that after contains the expected state
	expect(result.after).toBeDefined();
	const afterState = JSON.parse(new TextDecoder().decode(result.after!.data));
	expect(afterState).toEqual({ key: "value" });
});

test("returns undefined for after state when file is deleted", async () => {
	// Create a Lix instance with the mock JSON plugin
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	// Create a file
	const file = await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			data: new TextEncoder().encode(JSON.stringify({ key: "value" })),
			path: "/test.json",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Wait for file queue to process changes
	await fileQueueSettled({ lix });

	// First checkpoint (cs0) - file exists
	const cs0 = await createCheckpoint({ id: "cs0", lix });

	// Delete the file
	await lix.db.deleteFrom("file").where("id", "=", file.id).execute();

	// Wait for file queue to process changes
	await fileQueueSettled({ lix });

	// Second checkpoint (cs1) - file is deleted
	const cs1 = await createCheckpoint({ id: "cs1", lix });

	// Test the beforeAfterOfFile function
	const result = await beforeAfterOfFile({
		lix,
		changeSetBefore: cs0!,
		changeSetAfter: cs1!,
		file: { id: file.id },
	});

	// Verify that before contains the expected state
	expect(result.before).toBeDefined();
	const beforeState = JSON.parse(new TextDecoder().decode(result.before!.data));
	expect(beforeState).toEqual({ key: "value" });

	// Verify that after is undefined (file doesn't exist in cs1)
	expect(result.after).toBeUndefined();
});
