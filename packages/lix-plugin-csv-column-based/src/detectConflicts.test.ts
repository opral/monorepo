import { test, expect } from "vitest";
import { detectConflicts } from "./detectConflicts.js";
import { mockConflicts } from "./utilities/mockConflicts.js";

test("it should detect a conflict if the same row has been updated", async () => {
	const common = new TextEncoder().encode(
		// Anna is 20 years old
		"Name,Age\nAnna,20\nPeter,50",
	);
	const source = new TextEncoder().encode(
		// Anna is 20 -> 25 years old
		"Name,Age\nAnna,25\nPeter,50",
	);
	const target = new TextEncoder().encode(
		// Anna is 20 -> 31 years old
		"Name,Age\nAnna,31\nPeter,50",
	);

	const metadata = { unique_column: "Name" };

	const mock = await mockConflicts({
		common,
		source,
		target,
		metadata,
	});

	const conflicts = await detectConflicts(mock);

	const snapshots = await Promise.all(
		conflicts.map(mock.getSnapshotsOfConflict),
	);

	expect(snapshots).toEqual([
		{
			snapshot: { text: "25" },
			conflicting_snapshot: { text: "31" },
		},
	]);
});
