import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CentralPanel } from "./central-panel";
import type { PanelState, ViewContext } from "./types";
import type { Lix } from "@lix-js/sdk";

vi.mock("./view-registry", () => {
	const definitions = [
		{
			key: "search" as const,
			label: "Search",
			description: "Search view",
			icon: () => <svg></svg>,
			render: ({
				context,
				target,
			}: {
				context: ViewContext;
				target: HTMLElement;
			}) => {
				const input = document.createElement("input");
				input.setAttribute("data-testid", "search-view-input");
				input.setAttribute("placeholder", "Search project...");
				input.addEventListener("pointerdown", () => {
					context.onOpenFile?.("search", { focus: false });
				});
				target.replaceChildren(input);
				return () => {
					target.replaceChildren();
				};
			},
		},
	];
	return {
		VIEW_DEFINITIONS: definitions,
		VIEW_MAP: new Map(definitions.map((def) => [def.key, def])),
	};
});

const mockLix = {} as Lix;

const createViewContext = (
	overrides: Partial<ViewContext> = {},
): ViewContext => ({
	lix: mockLix,
	isPanelFocused: false,
	setTabBadgeCount: () => {},
	...overrides,
});

describe("CentralPanel", () => {
	test("shows the welcome screen when no views are open", () => {
		const emptyPanel: PanelState = { views: [], activeInstanceKey: null };

		render(
			<DndContext>
				<CentralPanel
					panel={emptyPanel}
					onSelectView={() => {}}
					onRemoveView={() => {}}
					viewContext={createViewContext()}
					isFocused={false}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		expect(screen.getByTestId("welcome-screen")).toBeInTheDocument();
	});

	test("renders the active view and wires tab selection", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "search-1", viewKey: "search" }],
			activeInstanceKey: "search-1",
		};
		const handleSelect = vi.fn();

		render(
			<DndContext>
				<CentralPanel
					panel={panelState}
					onSelectView={handleSelect}
					onRemoveView={() => {}}
					viewContext={createViewContext({ isPanelFocused: true })}
					isFocused={true}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		expect(await screen.findByTestId("search-view-input")).toBeInTheDocument();

		const tabButton = await screen.findByRole("button", { name: "Search" });
		fireEvent.click(tabButton);

		expect(handleSelect).toHaveBeenCalledWith("search-1");
		expect(tabButton.getAttribute("data-focused")).toBe("true");
	});

	test("active tab is not focused when panel loses focus", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "search-1", viewKey: "search" }],
			activeInstanceKey: "search-1",
		};

		render(
			<DndContext>
				<CentralPanel
					panel={panelState}
					onSelectView={() => {}}
					onRemoveView={() => {}}
					viewContext={createViewContext()}
					isFocused={false}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		const tabButton = await screen.findByRole("button", { name: "Search" });
		expect(tabButton.getAttribute("data-focused")).toBeNull();
	});

	test("finalizes pending view when interacting with content", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "search-1", viewKey: "search", isPending: true }],
			activeInstanceKey: "search-1",
		};
		const handleFinalize = vi.fn();

		render(
			<DndContext>
				<CentralPanel
					panel={panelState}
					onSelectView={() => {}}
					onRemoveView={() => {}}
					viewContext={createViewContext({ isPanelFocused: true })}
					isFocused={true}
					onFocusPanel={vi.fn()}
					onFinalizePendingView={handleFinalize}
				/>
			</DndContext>,
		);

		const input = await screen.findByTestId("search-view-input");
		fireEvent.pointerDown(input);

		expect(handleFinalize).toHaveBeenCalledWith("search-1");
	});

	test("triggers create-new-file callback from welcome screen", () => {
		const emptyPanel: PanelState = { views: [], activeInstanceKey: null };
		const handleCreateNewFile = vi.fn();

		render(
			<DndContext>
				<CentralPanel
					panel={emptyPanel}
					onSelectView={() => {}}
					onRemoveView={() => {}}
					viewContext={createViewContext()}
					isFocused={false}
					onFocusPanel={vi.fn()}
					onCreateNewFile={handleCreateNewFile}
				/>
			</DndContext>,
		);

		fireEvent.click(screen.getByRole("button", { name: /create a new file/i }));

		expect(handleCreateNewFile).toHaveBeenCalledTimes(1);
	});
});
