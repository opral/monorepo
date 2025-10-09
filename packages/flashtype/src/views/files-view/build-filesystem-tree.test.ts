import { describe, expect, test } from "vitest";

import { buildFilesystemTree } from "./build-filesystem-tree.js";
import type { FilesystemEntryRow } from "@/queries";

const baseEntries: FilesystemEntryRow[] = [
	{
		id: "dir_docs",
		parent_id: null,
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
		id: "file_root",
		parent_id: null,
		path: "/README.md",
		display_name: "README.md",
		kind: "file",
		hidden: 0,
	},
	{
		id: "file_nested",
		parent_id: "dir_guides",
		path: "/docs/guides/intro.md",
		display_name: "intro.md",
		kind: "file",
		hidden: 0,
	},
];

describe("buildFilesystemTree", () => {
	test("nests directories and files with stable ordering", () => {
		const tree = buildFilesystemTree(baseEntries);
		expect(tree).toHaveLength(2); // directory + root file

		const [docs, rootFile] = tree;
		expect(docs.type).toBe("directory");
		if (docs.type === "directory") {
			expect(docs.path).toBe("/docs/");
			expect(docs.children).toHaveLength(1);
			const [guides] = docs.children;
			expect(guides.type).toBe("directory");
			if (guides.type === "directory") {
				expect(guides.children).toHaveLength(1);
				const [nestedFile] = guides.children;
				expect(nestedFile.type).toBe("file");
				expect(nestedFile.path).toBe("/docs/guides/intro.md");
			}
		}

		expect(rootFile.type).toBe("file");
		if (rootFile.type === "file") {
			expect(rootFile.path).toBe("/README.md");
		}
	});

	test("propagates hidden flag from ancestors", () => {
		const entries: FilesystemEntryRow[] = [
			{
				id: "dir_hidden",
				parent_id: null,
				path: "/private/",
				display_name: "private",
				kind: "directory",
				hidden: 1,
			},
			{
				id: "file_hidden",
				parent_id: "dir_hidden",
				path: "/private/secret.md",
				display_name: "secret.md",
				kind: "file",
				hidden: 0,
			},
			{
				id: "dir_visible",
				parent_id: null,
				path: "/public/",
				display_name: "public",
				kind: "directory",
				hidden: 0,
			},
			{
				id: "file_visible",
				parent_id: "dir_visible",
				path: "/public/note.md",
				display_name: "note.md",
				kind: "file",
				hidden: 0,
			},
		];

		const tree = buildFilesystemTree(entries);
		const hiddenDir = tree.find(
			(node) => node.type === "directory" && node.path === "/private/",
		);
		expect(hiddenDir?.hidden).toBe(true);
		if (hiddenDir?.type === "directory") {
			expect(hiddenDir.children[0]?.hidden).toBe(true);
		}

		const visibleDir = tree.find(
			(node) => node.type === "directory" && node.path === "/public/",
		);
		expect(visibleDir?.hidden).toBe(false);
		if (visibleDir?.type === "directory") {
			expect(visibleDir.children[0]?.hidden).toBe(false);
		}
	});
});
