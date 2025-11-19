import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { HistoryView } from "./index";
import {
	COMMIT_VIEW_KIND,
	commitViewInstance,
} from "../../app/view-instance-helpers";

const mockId = "cp-1";
vi.mock("@lix-js/react-utils", () => ({
	useQuery: vi.fn(() => [
		{
			id: mockId,
			added: 0,
			removed: 0,
			checkpoint_created_at: "2024-01-01T00:00:00.000Z",
		},
	]),
}));

describe("HistoryView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("opens commit without stealing focus when the panel is focused", async () => {
		const handleOpenCommit = vi.fn();

		render(
			<HistoryView
				context={{
					openView: handleOpenCommit,
					isPanelFocused: true,
					setTabBadgeCount: () => {},
					lix: {} as any,
				}}
			/>,
		);

		const commitButton = await screen.findByTestId(
			`history-checkpoint-${mockId}`,
		);
		fireEvent.click(commitButton);

		expect(handleOpenCommit).toHaveBeenCalledWith({
			panel: "central",
			kind: COMMIT_VIEW_KIND,
			instance: commitViewInstance(mockId),
			props: {
				checkpointId: mockId,
				label: expect.any(String),
			},
			focus: false,
		});
	});

	test("falls back to default focusing when the panel is not focused", async () => {
		const handleOpenCommit = vi.fn();

		render(
			<HistoryView
				context={{
					openView: handleOpenCommit,
					isPanelFocused: false,
					setTabBadgeCount: () => {},
					lix: {} as any,
				}}
			/>,
		);

		const commitButton = await screen.findByTestId(
			`history-checkpoint-${mockId}`,
		);
		fireEvent.click(commitButton);

		expect(handleOpenCommit).toHaveBeenCalledWith({
			panel: "central",
			kind: COMMIT_VIEW_KIND,
			instance: commitViewInstance(mockId),
			props: {
				checkpointId: mockId,
				label: expect.any(String),
			},
			focus: undefined,
		});
	});
});
