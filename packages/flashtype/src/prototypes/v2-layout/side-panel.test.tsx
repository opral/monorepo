import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { FilesystemEntryRow } from "@/queries";
import { SidePanel } from "./side-panel";
import type { PanelState, ViewContext } from "./types";

const mockEntries: FilesystemEntryRow[] = [
	{
		id: "dir_root",
		parent_id: null,
		path: "/",
		display_name: "/",
		kind: "directory",
		hidden: 0,
	},
	{
		id: "dir_docs",
		parent_id: "dir_root",
		path: "/docs/",
		display_name: "docs",
		kind: "directory",
		hidden: 0,
	},
	{
		id: "dir_guides",
		parent_id: "dir_docs",
		path: "/docs/guides/",
		display_name: "guides",
		kind: "directory",
		hidden: 0,
	},
	{
		id: "file_writing",
		parent_id: "dir_guides",
		path: "/docs/guides/writing-style.md",
		display_name: "writing-style.md",
		kind: "file",
		hidden: 0,
	},
	{
		id: "file_readme",
		parent_id: "dir_docs",
		path: "/docs/README.md",
		display_name: "README.md",
		kind: "file",
		hidden: 0,
	},
];

vi.mock("@lix-js/react-utils", async () => {
	const actual = await vi.importActual<typeof import("@lix-js/react-utils")>(
		"@lix-js/react-utils",
	);
	return {
		...actual,
		useQuery: () => mockEntries,
		useLix: () => ({}) as any,
	};
});

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
					isFocused={false}
					onFocusPanel={vi.fn()}
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
					isFocused={true}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Files" }));
		expect(handleSelect).toHaveBeenCalledWith("files-1");

		const filesTab = screen.getByRole("button", { name: "Files" });
		expect(filesTab.getAttribute("data-focused")).toBe("true");

		fireEvent.click(screen.getByText("writing-style.md"));
		expect(viewContext.onOpenFile).toHaveBeenCalledWith(
			"/docs/guides/writing-style.md",
		);
	});

	test("removes focus flag when panel not focused", () => {
		const panelState: PanelState = {
			instances: [{ instanceId: "files-1", viewId: "files" }],
			activeInstanceId: "files-1",
		};

		render(
			<DndContext>
				<SidePanel
					side="left"
					title="Navigator"
					panel={panelState}
					onSelectView={() => {}}
					onAddView={() => {}}
					onRemoveView={() => {}}
					isFocused={false}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		const filesTab = screen.getByRole("button", { name: "Files" });
		expect(filesTab.getAttribute("data-focused")).toBeNull();
	});
});
