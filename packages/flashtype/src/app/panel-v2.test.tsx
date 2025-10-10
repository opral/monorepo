import { vi, describe, expect, test } from "vitest";

vi.mock("@dnd-kit/core", async () => {
	const actual =
		await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
	return {
		...actual,
		useDroppable: vi.fn().mockReturnValue({
			setNodeRef: vi.fn(),
			isOver: false,
		}),
		useDraggable: vi.fn().mockReturnValue({
			attributes: {},
			listeners: {},
			setNodeRef: vi.fn(),
			isDragging: false,
		}),
	};
});

import { fireEvent, render, screen } from "@testing-library/react";
import { PanelV2 } from "./panel-v2";
import type { PanelState } from "./types";
import { useDroppable } from "@dnd-kit/core";

const emptyPanel: PanelState = { views: [], activeInstanceKey: null };

const singleSearchPanel: PanelState = {
	views: [{ instanceKey: "search-1", viewKey: "search" }],
	activeInstanceKey: "search-1",
};

const pendingSearchPanel: PanelState = {
	views: [{ instanceKey: "search-1", viewKey: "search", isPending: true }],
	activeInstanceKey: "search-1",
};

describe("PanelV2", () => {
	test("renders content container without padding or margin utilities", () => {
		render(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				emptyStatePlaceholder={<div data-testid="empty-placeholder">Empty</div>}
			/>,
		);

		const placeholder = screen.getByTestId("empty-placeholder");
		let contentElement: HTMLElement | null = placeholder.parentElement;
		while (
			contentElement &&
			!contentElement.className.includes("overflow-hidden")
		) {
			contentElement = contentElement.parentElement;
		}

		expect(contentElement).not.toBeNull();
		const classList = (contentElement?.className ?? "")
			.split(/\s+/)
			.filter(Boolean);

		const expectedClasses = [
			"flex",
			"min-h-0",
			"flex-1",
			"flex-col",
			"overflow-hidden",
		];
		expect(classList.sort()).toEqual([...expectedClasses].sort());
		// Keep the host padding-free so we don't assume what individual views render.
		expect(classList.some((token) => /^p[trblxy]?-/u.test(token))).toBe(false);
		expect(classList.some((token) => /^m[trblxy]?-/u.test(token))).toBe(false);
	});

	test("renders the active view content", async () => {
		render(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
			/>,
		);

		const input = await screen.findByPlaceholderText("Search project...");
		expect(input).toBeInTheDocument();
	});

	test("uses the tab label resolver when provided", () => {
		render(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				tabLabel={() => "Custom Search"}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Custom Search" }),
		).toBeInTheDocument();
	});

	test("renders any extra tab bar content", () => {
		render(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				extraTabBarContent={<button data-testid="add-btn">+</button>}
			/>,
		);

		expect(screen.getByTestId("add-btn")).toBeInTheDocument();
	});

	test("invokes the pending finalizer when the active view is interacted with", async () => {
		const finalize = vi.fn();
		render(
			<PanelV2
				side="left"
				panel={pendingSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				onActiveViewInteraction={finalize}
			/>,
		);

		const input = await screen.findByPlaceholderText("Search project...");
		fireEvent.pointerDown(input);
		expect(finalize).toHaveBeenCalledWith("search-1");
	});

	test("renders the provided empty state placeholder when no views are open", () => {
		render(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				emptyStatePlaceholder={<div>No tabs</div>}
			/>,
		);

		expect(screen.getByText("No tabs")).toBeInTheDocument();
		expect(screen.queryByRole("button")).toBeNull();
	});

	test("passes the custom drop id and panel metadata to useDroppable", () => {
		const mocked = vi.mocked(useDroppable);
		mocked.mockClear();
		render(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				emptyStatePlaceholder={<div />}
				dropId="custom-drop"
			/>,
		);

		expect(mocked).toHaveBeenCalledWith({
			id: "custom-drop",
			data: { panel: "left" },
		});
	});
});
