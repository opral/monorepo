import React, { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";
import { render, fireEvent, waitFor, act } from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

import { CheckpointView, view as checkpointViewDefinition } from "./index";
import type { ViewContext, ViewInstance } from "../../app/types";

async function countCommits(lix: Awaited<ReturnType<typeof openLix>>) {
	const rows = await lix.db.selectFrom("commit").select("id").execute();
	return rows.length;
}

describe("CheckpointView", () => {
	test("creates a checkpoint when clicking the button", async () => {
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

		const button = (await findByTestId(
			"checkpoint-submit",
		)) as HTMLButtonElement;

		fireEvent.click(button);
		await waitFor(() => expect(button).toBeDisabled());

		await waitFor(async () => {
			const after = await countCommits(lix);
			expect(after).toBe(before + 1);
		});

		await waitFor(() => expect(button).not.toBeDisabled());
	});

	test("updates tab badge count based on working changes", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		await lix.db
			.insertInto("file")
			.values({
				id: "badge-file",
				path: "/docs/example.md",
				data: new TextEncoder().encode("Initial"),
			})
			.execute();
		await createCheckpoint({ lix });
		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("Changed") })
			.where("id", "=", "badge-file")
			.execute();

		const setTabBadgeCount = vi.fn();
		const context = {
			isPanelFocused: true,
			setTabBadgeCount,
			lix,
		} satisfies ViewContext;

		const instance: ViewInstance = {
			instanceKey: "checkpoint-1",
			viewKey: "checkpoint",
		};

		const { unmount } = render(
			<LixProvider lix={lix}>
				<Suspense fallback={null}>
					<CheckpointView context={context} />
				</Suspense>
			</LixProvider>,
		);

		const cleanup = checkpointViewDefinition.activate?.({
			context,
			instance,
		});

		await waitFor(() => expect(setTabBadgeCount).toHaveBeenCalledWith(1));
		cleanup?.();
		unmount();
	});

	test("invokes openHistoryView when clicking View checkpoints", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		const openHistoryView = vi.fn();

		let utils: ReturnType<typeof render>;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<Suspense fallback={null}>
						<CheckpointView
							context={{
								openHistoryView,
								setTabBadgeCount: () => {},
								lix,
							}}
						/>
					</Suspense>
				</LixProvider>,
			);
		});

		const button = (await utils!.findByRole("button", {
			name: /view checkpoints/i,
		})) as HTMLButtonElement;

		fireEvent.click(button);
		expect(openHistoryView).toHaveBeenCalledTimes(1);
	});
});
