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
			{ id: fileA, path: "/docs/alpha.md" },
			{ id: fileB, path: "/docs/beta.md" },
		]);

		// Another edit to the same file should not duplicate entries
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Alpha updated again") })
			.where("id", "=", fileA)
			.execute();

		const deduped = await selectWorkingDiffFiles(lix).execute();
		expect(deduped).toHaveLength(2);

		// Checkpointing clears the working diff
		await createCheckpoint({ lix });
		const cleared = await selectWorkingDiffFiles(lix).execute();
		expect(cleared).toHaveLength(0);
	});
});
