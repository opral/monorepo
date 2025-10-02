import { describe, expect, test } from "vitest";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

import { selectWorkingDiffFiles } from "./queries";

describe("selectWorkingDiffFiles", () => {
	test("returns changed files sorted by path and clears after checkpoint", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });

		const fileA = "checkpoint_view_a";
		const fileB = "checkpoint_view_b";

		await lix.db
			.insertInto("file")
			.values({
				id: fileA,
				path: "/docs/alpha.md",
				data: new TextEncoder().encode("Alpha"),
			})
			.execute();

		await lix.db
			.insertInto("file")
			.values({
				id: fileB,
				path: "/docs/beta.md",
				data: new TextEncoder().encode("Beta"),
			})
			.execute();

		// Establish baseline so subsequent edits appear in the working diff
		await createCheckpoint({ lix });

		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Alpha updated") })
			.where("id", "=", fileA)
			.execute();

		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Beta updated") })
			.where("id", "=", fileB)
			.execute();

	const rows = await selectWorkingDiffFiles(lix).execute();
	expect(rows).toEqual([
		{ id: fileA, path: "/docs/alpha.md", status: "modified" },
		{ id: fileB, path: "/docs/beta.md", status: "modified" },
	]);

		// Another edit to the same file should not duplicate entries
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Alpha updated again") })
			.where("id", "=", fileA)
			.execute();

	const deduped = await selectWorkingDiffFiles(lix).execute();
	expect(deduped).toEqual([
		{ id: fileA, path: "/docs/alpha.md", status: "modified" },
		{ id: fileB, path: "/docs/beta.md", status: "modified" },
	]);

		// New file appears as added
		const fileC = "checkpoint_view_c";
		await lix.db
			.insertInto("file")
			.values({
				id: fileC,
				path: "/docs/gamma.md",
				data: new TextEncoder().encode("Gamma"),
			})
			.execute();

	const withAdded = await selectWorkingDiffFiles(lix).execute();
	expect(withAdded).toEqual([
		{ id: fileA, path: "/docs/alpha.md", status: "modified" },
		{ id: fileB, path: "/docs/beta.md", status: "modified" },
		{ id: fileC, path: "/docs/gamma.md", status: "added" },
	]);

	// TODO: add a regression test for deletions once file history joins are re-introduced

	// Checkpointing clears the working diff
	await createCheckpoint({ lix });
	const cleared = await selectWorkingDiffFiles(lix).execute();
	expect(cleared).toHaveLength(0);
	});

	test.skip("annotates removed files with their last known path", async () => {
		// TODO: Implement when path reconstruction for deletions is reinstated
	});
});
