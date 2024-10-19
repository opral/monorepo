import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import {
	newLixFile,
	openLixInMemory,
	type ChangeWithSnapshot,
	type Lix,
} from "@lix-js/sdk";
import { detectChanges } from "./detectChanges.js";

test("it should apply an insert change", async () => {
	const before = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50",
	);
	const after = new TextEncoder().encode(
		// John, 30 is added between Anna and Peter
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);

	const metadata = { unique_column: "Name" };
	const [lix, changes] = await mockLixChanges(before, after, metadata);

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});

	expect(applied).toEqual(after);
});

test("it should apply an update change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };
	const [lix, changes] = await mockLixChanges(before, after, metadata);

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});

	expect(new TextDecoder().decode(applied)).toEqual(
		new TextDecoder().decode(after),
	);
});

test("it should apply a delete change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };
	const [lix, changes] = await mockLixChanges(before, after, metadata);

	const { fileData: applied } = await applyChanges({
		file: { id: "mock", path: "mock", data: before, metadata },
		changes,
		lix,
	});
	expect(applied).toEqual(after);
});

/**
 * Instantiates a Lix instance with a mock plugin with the detectChanges function.
 *
 * It's easier to let lix generate the changes than to manually generate them.
 */
async function mockLixChanges(
	before: ArrayBuffer,
	after: ArrayBuffer,
	metadata: Record<string, unknown>,
): Promise<[Lix, ChangeWithSnapshot[]]> {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [{ key: "mock", glob: "*", detectChanges }],
	});
	// let detect changes handle change generation
	// this is a bit of a hack but it's the easiest way to test the applyChanges function
	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			path: "mock",
			data: before,
			// @ts-expect-error - type error with metadata
			metadata: JSON.stringify(metadata),
		})
		.execute();

	await lix.db
		.updateTable("file")
		.set({ data: after })
		.where("id", "=", "mock")
		.execute();

	await lix.settled();

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	return [lix, changes];
}
