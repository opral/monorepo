import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import type { FilesystemTreeNode } from "@/lib/build-filesystem-tree";
import { FileTree } from "./file-tree";

describe("FileTree", () => {
	test("renders directories and files", () => {
		render(<FileTree nodes={mockTree} />);

		expect(screen.getByText("docs")).toBeInTheDocument();
		expect(screen.getByText("guides")).toBeInTheDocument();
		expect(screen.getByText("writing-style.md")).toBeInTheDocument();
	});

	test("collapses and expands directories", () => {
		render(<FileTree nodes={mockTree} />);

		const docsToggle = screen.getByRole("button", { name: /docs/i });
		fireEvent.click(docsToggle);

		expect(screen.queryByText("guides")).toBeNull();

		fireEvent.click(docsToggle);
		expect(screen.getByText("guides")).toBeInTheDocument();
	});

	test("invokes onOpenFile when a file is selected", () => {
		const nodes: FilesystemTreeNode[] = [
			{
				type: "file",
				name: "README.md",
				path: "/README.md",
				hidden: false,
			},
		];

		const handleOpen = vi.fn();
		render(<FileTree nodes={nodes} onOpenFile={handleOpen} />);

		fireEvent.click(screen.getByRole("button", { name: /README.md/i }));

		expect(handleOpen).toHaveBeenCalledWith("/README.md");
	});
});

const mockTree: FilesystemTreeNode[] = [
	{
		type: "directory",
		name: "docs",
		path: "/docs",
		hidden: false,
		children: [
			{
				type: "directory",
				name: "guides",
				path: "/docs/guides",
				hidden: false,
				children: [
					{
						type: "file",
						name: "writing-style.md",
						path: "/docs/guides/writing-style.md",
						hidden: false,
					},
				],
			},
			{
				type: "file",
				name: "README.md",
				path: "/docs/README.md",
				hidden: false,
			},
		],
	},
];
