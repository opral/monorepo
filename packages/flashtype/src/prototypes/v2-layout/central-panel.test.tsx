import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CentralPanel } from "./central-panel";
import type { PanelState } from "./types";

describe("CentralPanel", () => {
	test("shows the empty repository welcome when no views are open", () => {
		const emptyPanel: PanelState = { instances: [], activeInstanceId: null };

		render(
			<DndContext>
				<CentralPanel panel={emptyPanel} onSelectView={() => {}} onRemoveView={() => {}} />
			</DndContext>,
		);

		expect(screen.getByText("Welcome to Opral's repository.")).toBeInTheDocument();
	});

	test("renders the active view and wires tab selection", () => {
		const panelState: PanelState = {
			instances: [{ instanceId: "search-1", viewId: "search" }],
			activeInstanceId: "search-1",
		};
		const handleSelect = vi.fn();

		render(
			<DndContext>
				<CentralPanel panel={panelState} onSelectView={handleSelect} onRemoveView={() => {}} />
			</DndContext>,
		);

		expect(screen.getByPlaceholderText("Search project...")).toBeInTheDocument();

		const tabButton = screen.getByRole("button", { name: "Search" });
		fireEvent.click(tabButton);

		expect(handleSelect).toHaveBeenCalledWith("search-1");
	});
});
