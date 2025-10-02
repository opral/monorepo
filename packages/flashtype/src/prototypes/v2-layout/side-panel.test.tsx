import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { SidePanel } from "./side-panel";
import type { PanelState, ViewContext } from "./types";

describe("SidePanel", () => {
	test("renders the empty state helper when nothing is open", () => {
		const emptyPanel: PanelState = { instances: [], activeInstanceId: null };

		render(
			<DndContext>
				<SidePanel
					side="left"
					title="Navigator"
					panel={emptyPanel}
					onSelectView={() => {}}
					onAddView={() => {}}
					onRemoveView={() => {}}
				/>
			</DndContext>,
		);

		expect(screen.getByText("Left Panel")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Open View" }),
		).toBeInTheDocument();
	});

	test("renders the active view and forwards interactions", () => {
		const panelState: PanelState = {
			instances: [{ instanceId: "files-1", viewId: "files" }],
			activeInstanceId: "files-1",
		};
		const handleSelect = vi.fn();
		const handleAdd = vi.fn();
		const handleRemove = vi.fn();
		const viewContext: ViewContext = { onOpenFile: vi.fn() };

		render(
			<DndContext>
				<SidePanel
					side="left"
					title="Navigator"
					panel={panelState}
					onSelectView={handleSelect}
					onAddView={handleAdd}
					onRemoveView={handleRemove}
					viewContext={viewContext}
				/>
			</DndContext>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Files" }));
		expect(handleSelect).toHaveBeenCalledWith("files-1");

		fireEvent.click(screen.getByText("writing-style.md"));
		expect(viewContext.onOpenFile).toHaveBeenCalledWith("writing-style.md");
	});
});
