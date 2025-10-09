import React, { Suspense } from "react";
import { describe, expect, test } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

import { CheckpointView } from "./index";

async function countCommits(lix: Awaited<ReturnType<typeof openLix>>) {
	const rows = await lix.db.selectFrom("commit").select("id").execute();
	return rows.length;
}

describe("CheckpointView", () => {
	test("creates a checkpoint and clears the message", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		const fileId = "checkpoint_view_test_file";

		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/docs/checkpoint.md",
				data: new TextEncoder().encode("Initial content"),
			})
			.execute();

		await createCheckpoint({ lix });

		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Updated content") })
			.where("id", "=", fileId)
			.execute();
		const before = await countCommits(lix);

		let utils: ReturnType<typeof render>;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<Suspense fallback={null}>
						<CheckpointView />
					</Suspense>
				</LixProvider>,
			);
		});

		const { findByTestId } = utils!;

		const textarea = (await findByTestId(
			"checkpoint-message",
		)) as HTMLTextAreaElement;
		const button = (await findByTestId(
			"checkpoint-submit",
		)) as HTMLButtonElement;

		fireEvent.change(textarea, { target: { value: "Integration checkpoint" } });
		await waitFor(() => expect(button).not.toBeDisabled());

		fireEvent.click(button);
		await waitFor(() => expect(button).toBeDisabled());

		await waitFor(async () => {
			const after = await countCommits(lix);
			expect(after).toBe(before + 1);
			expect(textarea.value).toBe("");
		});

		await waitFor(() => expect(button).toBeDisabled());
	});
});
