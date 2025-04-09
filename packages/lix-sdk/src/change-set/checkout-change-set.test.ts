import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { checkoutChangeSet } from "./checkout-change-set.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";

test("it checks out a specific change set", async () => {
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
			l1: "Value 1",
			l2: "Value 2 Modified",
		},
		// Final state with additional fields (cs2)
		{
			l0: "Value 0",
			l1: "Value 1",
			l2: "Value 2 Modified",
			l3: "Value 3",
			l4: "Value 4",
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

	// Verify initial state at cs2
	const initialFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const actualInitialState = JSON.parse(
		new TextDecoder().decode(initialFile.data)
	);

	expect(actualInitialState).toEqual(updates[2]);

	// Action: Checkout cs0
	await checkoutChangeSet({
		lix,
		changeSet: cs0!,
	});

	// Verify file state after checkout
	const fileAfterCheckout = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const expectedStateCs0 = updates[0]; // Initial state

	const actualStateAfterCheckout = JSON.parse(
		new TextDecoder().decode(fileAfterCheckout.data)
	);

	expect(actualStateAfterCheckout).toEqual(expectedStateCs0);

	// Verify that the version's change_set_id is cs0
	const activeVersionAfter = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.selectAll("version_v2")
		.executeTakeFirstOrThrow();

	// switching the active version is not needed for a checkout
	expect(activeVersionAfter.change_set_id).not.toBe(cs0!.id);

	// Now checkout cs1 to test intermediate state
	const cs1Checkout = await checkoutChangeSet({
		lix,
		changeSet: cs1!,
	});

	expect(cs1Checkout.change_set_id).toBe(cs1!.id);

	// Verify intermediate state
	const intermediateFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const expectedIntermediateState = updates[1]; // Modified state

	const intermediateState = JSON.parse(
		new TextDecoder().decode(intermediateFile.data)
	);

	expect(intermediateState).toEqual(expectedIntermediateState);

	// Now checkout cs2 again to return to the latest state
	const cs2Checkout = await checkoutChangeSet({
		lix,
		changeSet: cs2!,
	});

	expect(cs2Checkout.change_set_id).toBe(cs2!.id);

	// Verify we're back to the original state
	const finalFile = await lix.db
		.selectFrom("file")
		.where("id", "=", file.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const finalState = JSON.parse(new TextDecoder().decode(finalFile.data));

	expect(finalState).toEqual(updates[2]);
});
