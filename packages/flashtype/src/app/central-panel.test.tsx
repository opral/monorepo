import { Suspense, act, type ReactNode } from "react";
import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { CentralPanel } from "./central-panel";
import type { PanelState, ViewContext } from "./types";
import type { Lix } from "@lix-js/sdk";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";

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
					context.openFileView?.("search", { focus: false });
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

let lix: Awaited<ReturnType<typeof openLix>> | null = null;

beforeAll(async () => {
	lix = await openLix({ providePlugins: [mdPlugin] });
});

afterAll(async () => {
	await lix?.close();
	lix = null;
});

const renderWithProviders = async (ui: ReactNode) => {
	let result: ReturnType<typeof render> | undefined;
	await act(async () => {
		result = render(
			<Suspense fallback={<div data-testid="loading-state" />}>
				{ui}
			</Suspense>,
		);
	});
	return result!;
};

const createViewContext = (
	overrides: Partial<ViewContext> = {},
): ViewContext => ({
	lix: lix ?? (() => {
		throw new Error("Lix instance not initialized");
	})(),
	isPanelFocused: false,
	setTabBadgeCount: () => {},
	...overrides,
});

describe("CentralPanel", () => {
	test("shows the welcome screen when no views are open", async () => {
		const emptyPanel: PanelState = { views: [], activeInstanceKey: null };

		await renderWithProviders(
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

		expect(await screen.findByTestId("welcome-screen")).toBeInTheDocument();
	});

	test("renders the active view and wires tab selection", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "search-1", viewKey: "search" }],
			activeInstanceKey: "search-1",
		};
		const handleSelect = vi.fn();

		await renderWithProviders(
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

		await renderWithProviders(
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

		await renderWithProviders(
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

	test("triggers create-new-file callback from welcome screen", async () => {
		const emptyPanel: PanelState = { views: [], activeInstanceKey: null };
		const handleCreateNewFile = vi.fn();

		await renderWithProviders(
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

		const createButton = await screen.findByTestId("welcome-create-file");
		fireEvent.click(createButton);

		expect(handleCreateNewFile).toHaveBeenCalledTimes(1);
	});
});
