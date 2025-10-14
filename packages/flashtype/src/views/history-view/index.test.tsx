import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { HistoryView } from "./index";

vi.mock("@lix-js/react-utils", () => ({
	useQuery: vi.fn(() => [
		{
			id: "cp-1",
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

	test("opens commit without stealing focus when the panel is focused", () => {
		const handleOpenCommit = vi.fn();

		render(
			<HistoryView
				context={{
					onOpenCommit: handleOpenCommit,
					isPanelFocused: true,
					setTabBadgeCount: () => {},
					lix: {} as any,
				}}
			/>,
		);

		const commitButton = screen.getByRole("button", { name: /Checkpoint/ });
		fireEvent.click(commitButton);

		expect(handleOpenCommit).toHaveBeenCalledWith(
			"cp-1",
			expect.stringContaining("Checkpoint"),
			{ focus: false },
		);
	});

	test("falls back to default focusing when the panel is not focused", () => {
		const handleOpenCommit = vi.fn();

		render(
			<HistoryView
				context={{
					onOpenCommit: handleOpenCommit,
					isPanelFocused: false,
					setTabBadgeCount: () => {},
					lix: {} as any,
				}}
			/>,
		);

		const commitButton = screen.getByRole("button", { name: /Checkpoint/ });
		fireEvent.click(commitButton);

		expect(handleOpenCommit).toHaveBeenCalledWith(
			"cp-1",
			expect.stringContaining("Checkpoint"),
			undefined,
		);
	});
});
