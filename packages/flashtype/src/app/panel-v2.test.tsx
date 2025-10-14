import { vi, describe, expect, test } from "vitest";
import React from "react";

vi.mock("@dnd-kit/core", async () => {
	const actual =
		await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
	return {
		...actual,
		useDroppable: vi.fn().mockReturnValue({
			setNodeRef: vi.fn(),
			isOver: false,
		}),
	};
});

vi.mock("@dnd-kit/sortable", async () => {
	const actual = await vi.importActual<any>("@dnd-kit/sortable");
	return {
		...actual,
		useSortable: vi.fn().mockReturnValue({
			attributes: {},
			listeners: {},
			setNodeRef: vi.fn(),
			transform: null,
			transition: null,
			isDragging: false,
		}),
		SortableContext: ({ children }: { children: React.ReactNode }) => (
			<div>{children}</div>
		),
	};
});

import { fireEvent, render, screen } from "@testing-library/react";
import { PanelV2 } from "./panel-v2";
import type { PanelState, ViewDefinition, ViewContext } from "./types";
import { Flag } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";

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

	test("registers the panel container as a droppable target", () => {
		const droppableMock = vi.mocked(useDroppable);
		droppableMock.mockClear();
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

		expect(droppableMock).toHaveBeenCalledWith({
			id: "left-panel",
			data: { panel: "left" },
		});
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

	test("registers sortable handlers for tabs", () => {
		const sortableMock = vi.mocked(useSortable);
		sortableMock.mockClear();
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

		expect(sortableMock).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "search-1",
				data: expect.objectContaining({
					instanceKey: "search-1",
					panel: "left",
					fromPanel: "left",
				}),
			}),
		);
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

test("renders tab badge counts and updates when the value changes", async () => {
	const BadgeViewComponent = ({
		context,
		count,
	}: {
		context?: ViewContext;
		count: number;
	}) => {
		const setCount = context?.setTabBadgeCount;
		const lastRef = React.useRef<number | null>(null);
		React.useEffect(() => {
			if (!setCount) return;
			if (lastRef.current !== count) {
				setCount(count);
				lastRef.current = count;
			}
			return () => {
				setCount(null);
				lastRef.current = null;
			};
		}, [setCount, count]);
		return <div data-testid="badge-view" />;
	};

	let currentCount = 3;
	const badgePanel: PanelState = {
		views: [{ instanceKey: "badge-1", viewKey: "badge-view" }],
		activeInstanceKey: "badge-1",
	};

	const badgeView: ViewDefinition = {
		key: "badge-view",
		label: "Badge",
		description: "Test badge view",
		icon: Flag,
		render: (context) => (
			<BadgeViewComponent context={context} count={currentCount} />
		),
	};

	const renderPanel = () =>
		render(
			<PanelV2
				side="left"
				panel={badgePanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewOverrides={[badgeView]}
			/>,
		);

	const { rerender } = renderPanel();
	expect(await screen.findByTestId("badge-view")).toBeInTheDocument();
	expect(await screen.findByText("3")).toBeInTheDocument();

	currentCount = 7;
	rerender(
		<PanelV2
			side="left"
			panel={badgePanel}
			isFocused={false}
			onFocusPanel={vi.fn()}
			onSelectView={vi.fn()}
			onRemoveView={vi.fn()}
			viewOverrides={[badgeView]}
		/>,
	);

	expect(await screen.findByText("7")).toBeInTheDocument();
	expect(screen.queryByText("3")).not.toBeInTheDocument();
});
});
