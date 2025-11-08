import { describe, expect, test } from "vitest";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist";
import { selectCheckpoints } from "@/queries";
import { selectCheckpointFiles } from "./queries";

describe("selectCheckpointFiles", () => {
	test("returns Markdown file summaries for a checkpoint", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		const encoder = new TextEncoder();
		const fileId = "commit_view_file";
		const filePath = "/docs/commit-view.md";

		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: filePath,
				data: encoder.encode("# Title\n\nInitial content.\n"),
			})
			.execute();

		// Baseline checkpoint for initial state
		await createCheckpoint({ lix });

		// Modify the file to generate Markdown entity changes
		await lix.db
			.updateTable("file")
			.set({
				data: encoder.encode("# Title\n\nInitial content.\n\nNew paragraph."),
			})
			.where("id", "=", fileId)
			.execute();

		// Capture the change in a new checkpoint
		await createCheckpoint({ lix });

		const checkpoints = await selectCheckpoints({ lix }).execute();
		expect(checkpoints.length).toBeGreaterThan(0);
		const latest = checkpoints[0]!;

		const rows = await selectCheckpointFiles({
			lix,
			changeSetId: latest.id,
		}).execute();

		expect(rows).toHaveLength(1);
		const [row] = rows;
		expect(row.file_id).toBe(fileId);
		expect(row.path).toBe(filePath);
		expect((row.added ?? 0) + (row.removed ?? 0)).toBeGreaterThan(0);
	});
});
