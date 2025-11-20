import React, { Suspense } from "react";
import { describe, expect, test, vi } from "vitest";
import {
	render,
	fireEvent,
	waitFor,
	act,
	screen,
} from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, createCheckpoint } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

import { CheckpointView, view as checkpointViewDefinition } from "./index";
import type { ViewContext, ViewInstance } from "../../app/types";
import {
	CHECKPOINT_VIEW_KIND,
	DIFF_VIEW_KIND,
	HISTORY_VIEW_KIND,
	diffViewInstance,
	historyViewInstance,
} from "../../app/view-instance-helpers";

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
			instance: "checkpoint-1",
			kind: CHECKPOINT_VIEW_KIND,
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

	test("invokes openView for history when clicking View checkpoints", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		const openView = vi.fn();

		let utils: ReturnType<typeof render>;
		await act(async () => {
			utils = render(
				<LixProvider lix={lix}>
					<Suspense fallback={null}>
						<CheckpointView
							context={{
								openView,
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
		expect(openView).toHaveBeenCalledWith({
			panel: "central",
			kind: HISTORY_VIEW_KIND,
			instance: historyViewInstance(),
			focus: true,
		});
	});

	test("opens a diff as a pending preview when clicking a file row", async () => {
		const lix = await openLix({ providePlugins: [mdPlugin] });
		const fileId = "diff-preview-file";

		await lix.db
			.insertInto("file")
			.values({
				id: fileId,
				path: "/docs/diff-preview.md",
				data: new TextEncoder().encode("# Before"),
			})
			.execute();

		await createCheckpoint({ lix });

		await lix.db
			.updateTable("file")
			.set({ data: new TextEncoder().encode("# After") })
			.where("id", "=", fileId)
			.execute();

		const openView = vi.fn();

		await act(async () => {
			render(
				<LixProvider lix={lix}>
					<Suspense fallback={null}>
						<CheckpointView
							context={{
								openView,
								setTabBadgeCount: () => {},
								lix,
							}}
						/>
					</Suspense>
				</LixProvider>,
			);
		});

		const fileButton = await screen.findByRole("button", {
			name: /diff-preview\.md/i,
		});

		fireEvent.click(fileButton);

		expect(openView).toHaveBeenCalledTimes(1);
		const [args] = openView.mock.calls[0] ?? [];
		expect(args).toMatchObject({
			panel: "central",
			kind: DIFF_VIEW_KIND,
			instance: diffViewInstance(fileId),
			pending: true,
			focus: true,
		});
		expect(args.state).toMatchObject({
			fileId,
			filePath: "/docs/diff-preview.md",
			flashtype: { label: "diff-preview.md" },
		});
		expect(args.state?.diff).toBeDefined();
	});
});
