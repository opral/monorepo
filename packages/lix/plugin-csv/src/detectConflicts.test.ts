/* eslint-disable @typescript-eslint/no-unused-vars */
import { test } from "vitest";
import { mockConflicts } from "./utilities/mockConflicts.js";

test.todo("it should detect a if two rows have the same row id", async () => {
	// TODO this test is to be done - we wait for the conflict handling to take place

	const common = new TextEncoder().encode(
		// Anna is 20 years old
		"Name,Age\nAnna,20",
	);
	const source = new TextEncoder().encode(
		// Anna is 20 -> 25 years old
		"Name,Age\nAnna,20\nBob,50",
	);
	const target = new TextEncoder().encode(
		// Anna is 20 -> 31 years old
		"Name,Age\nAnna,20\nPeter,50",
	);

	const metadata = { unique_column: "Name" };

	const mock = await mockConflicts({
		common,
		source,
		target,
		metadata,
	});

	// const conflicts = await detectConflicts(mock);

	// const snapshots = await Promise.all(
	// 	conflicts.map(mock.getSnapshotsOfConflict),
	// );

	// expect(snapshots).toEqual([
	// 	{
	// 		snapshot: { text: "25" },
	// 		conflicting_snapshot: { text: "31" },
	// 	},
	// ]);
});
