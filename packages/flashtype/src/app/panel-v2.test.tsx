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

import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { PanelV2 } from "./panel-v2";
import { ViewHostRegistryProvider } from "./view-host-registry";
import type { PanelState, ViewContext, ViewDefinition } from "./types";
import type { Lix } from "@lix-js/sdk";
import { Flag, Search } from "lucide-react";
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

const mockLix = {} as Lix;

const createViewContext = (
	overrides: Partial<ViewContext> = {},
): ViewContext => ({
	lix: mockLix,
	isPanelFocused: false,
	setTabBadgeCount: () => {},
	...overrides,
});

const searchViewOverride: ViewDefinition = {
	key: "search",
	label: "Search",
	description: "Test search view",
	icon: Search,
	activate: () => undefined,
	render: ({ target }) => {
		const input = document.createElement("input");
		input.setAttribute("placeholder", "Search project...");
		target.replaceChildren(input);
		return () => {
			target.replaceChildren();
		};
	},
};

const renderWithinProvider = (ui: React.ReactNode) =>
	render(<ViewHostRegistryProvider>{ui}</ViewHostRegistryProvider>);

describe("PanelV2", () => {
	test("renders content container without padding or margin utilities", () => {
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
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
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				viewOverrides={[searchViewOverride]}
			/>,
		);

		const input = await screen.findByPlaceholderText("Search project...");
		expect(input).toBeInTheDocument();
	});

	test("registers the panel container as a droppable target", () => {
		const droppableMock = vi.mocked(useDroppable);
		droppableMock.mockClear();
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				viewOverrides={[searchViewOverride]}
			/>,
		);

		expect(droppableMock).toHaveBeenCalledWith({
			id: "left-panel",
			data: { panel: "left" },
		});
	});

	test("uses the tab label resolver when provided", () => {
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				tabLabel={() => "Custom Search"}
				viewContext={createViewContext()}
				viewOverrides={[searchViewOverride]}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Custom Search" }),
		).toBeInTheDocument();
	});

	test("registers sortable handlers for tabs", () => {
		const sortableMock = vi.mocked(useSortable);
		sortableMock.mockClear();
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				viewOverrides={[searchViewOverride]}
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
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={singleSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				extraTabBarContent={<button data-testid="add-btn">+</button>}
				viewOverrides={[searchViewOverride]}
			/>,
		);

		expect(screen.getByTestId("add-btn")).toBeInTheDocument();
	});

	test("invokes the pending finalizer when the active view is interacted with", async () => {
		const finalize = vi.fn();
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={pendingSearchPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				onActiveViewInteraction={finalize}
				viewContext={createViewContext()}
				viewOverrides={[searchViewOverride]}
			/>,
		);

		const input = await screen.findByPlaceholderText("Search project...");
		fireEvent.pointerDown(input);
		expect(finalize).toHaveBeenCalledWith("search-1");
	});

	test("renders the provided empty state placeholder when no views are open", () => {
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				emptyStatePlaceholder={<div>No tabs</div>}
			/>,
		);

		expect(screen.getByText("No tabs")).toBeInTheDocument();
		expect(screen.queryByRole("button")).toBeNull();
	});

	test("passes the custom drop id and panel metadata to useDroppable", () => {
		const mocked = vi.mocked(useDroppable);
		mocked.mockClear();
		renderWithinProvider(
			<PanelV2
				side="left"
				panel={emptyPanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				emptyStatePlaceholder={<div />}
				viewContext={createViewContext()}
				dropId="custom-drop"
			/>,
		);

		expect(mocked).toHaveBeenCalledWith({
			id: "custom-drop",
			data: { panel: "left" },
		});
	});

	test("renders tab badge counts and updates when the value changes", async () => {
		let updateBadge: ((value: number | null) => void) | undefined;

		const badgePanel: PanelState = {
			views: [{ instanceKey: "badge-1", viewKey: "badge-view" }],
			activeInstanceKey: "badge-1",
		};

		const badgeView: ViewDefinition = {
			key: "badge-view",
			label: "Badge",
			description: "Test badge view",
			icon: Flag,
			activate: ({ context }) => {
				updateBadge = (value) => context.setTabBadgeCount?.(value);
				return () => {
					context.setTabBadgeCount?.(null);
					if (updateBadge === context.setTabBadgeCount) {
						updateBadge = undefined;
					}
				};
			},
			render: ({ target }) => {
				target.textContent = "Badge view content";
				return () => {
					target.replaceChildren();
				};
			},
		};

		renderWithinProvider(
			<PanelV2
				side="left"
				panel={badgePanel}
				isFocused={false}
				onFocusPanel={vi.fn()}
				onSelectView={vi.fn()}
				onRemoveView={vi.fn()}
				viewContext={createViewContext()}
				viewOverrides={[badgeView]}
			/>,
		);

		await waitFor(() => {
			expect(updateBadge).toBeDefined();
		});

		act(() => updateBadge?.(3));
		expect(await screen.findByText("3")).toBeInTheDocument();

		act(() => updateBadge?.(7));
		expect(await screen.findByText("7")).toBeInTheDocument();
		expect(screen.queryByText("3")).not.toBeInTheDocument();
	});
});
