import { DndContext } from "@dnd-kit/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { FilesystemEntryRow } from "@/queries";
import { SidePanel } from "./side-panel";
import type { PanelState, ViewContext } from "./types";
import type { Lix } from "@lix-js/sdk";

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

vi.mock("./view-registry", async () => {
	const definitions = [
		{
			key: "files" as const,
			label: "Files",
			description: "Files view",
			icon: () => <svg></svg>,
			render: ({
				context,
				target,
			}: {
				context: ViewContext;
				target: HTMLElement;
			}) => {
				const button = document.createElement("button");
				button.type = "button";
				button.textContent = "writing-style.md";
				button.addEventListener("click", () => {
					context.onOpenFile?.("file-writing", {
						focus: false,
						filePath: "/docs/guides/writing-style.md",
					});
				});
				target.replaceChildren(button);
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

describe("SidePanel", () => {
	test("renders the empty state helper when nothing is open", () => {
		const emptyPanel: PanelState = { views: [], activeInstanceKey: null };

		render(
			<DndContext>
				<SidePanel
					side="left"
					title="Navigator"
					panel={emptyPanel}
					onSelectView={() => {}}
					onAddView={() => {}}
					onRemoveView={() => {}}
					viewContext={createViewContext()}
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

	test("renders the active view and forwards interactions", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "files-1", viewKey: "files" }],
			activeInstanceKey: "files-1",
		};
		const handleSelect = vi.fn();
		const handleAdd = vi.fn();
		const handleRemove = vi.fn();
		const handleOpenFile = vi.fn();
		const viewContext = createViewContext({
			onOpenFile: handleOpenFile,
			isPanelFocused: true,
		});

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

		const filesTab = await screen.findByRole("button", { name: "Files" });

		fireEvent.click(filesTab);
		expect(handleSelect).toHaveBeenCalledWith("files-1");

		expect(filesTab.getAttribute("data-focused")).toBe("true");

		const fileRow = await screen.findByRole(
			"button",
			{ name: "writing-style.md" },
			{ timeout: 5000 },
		);
		fireEvent.click(fileRow);
		expect(handleOpenFile).toHaveBeenCalledWith("file-writing", {
			focus: false,
			filePath: "/docs/guides/writing-style.md",
		});
	});

	test("removes focus flag when panel not focused", async () => {
		const panelState: PanelState = {
			views: [{ instanceKey: "files-1", viewKey: "files" }],
			activeInstanceKey: "files-1",
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
					viewContext={createViewContext()}
					isFocused={false}
					onFocusPanel={vi.fn()}
				/>
			</DndContext>,
		);

		const filesTab = await screen.findByRole("button", { name: "Files" });
		expect(filesTab.getAttribute("data-focused")).toBeNull();
	});
});
