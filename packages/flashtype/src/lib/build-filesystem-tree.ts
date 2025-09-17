import type { FilesystemEntryRow } from "@/queries";

export type FilesystemTreeFile = {
	type: "file";
	name: string;
	path: string;
	hidden: boolean;
};

export type FilesystemTreeDirectory = {
	type: "directory";
	name: string;
	path: string;
	hidden: boolean;
	children: FilesystemTreeNode[];
};

export type FilesystemTreeNode = FilesystemTreeFile | FilesystemTreeDirectory;

/**
 * Builds a nested tree from flat filesystem entries.
 *
 * @example
 * const tree = buildFilesystemTree(entries);
 */
export function buildFilesystemTree(
	entries: readonly FilesystemEntryRow[],
): FilesystemTreeNode[] {
	const directories = new Map<string, FilesystemTreeDirectory>();
	const roots: FilesystemTreeNode[] = [];

	for (const entry of entries) {
		if (entry.kind !== "directory") continue;
		directories.set(entry.id, {
			type: "directory",
			name: entry.display_name,
			path: entry.path,
			hidden: Boolean(entry.hidden),
			children: [],
		});
	}

	for (const entry of entries) {
		if (entry.kind !== "directory") continue;
		const node = directories.get(entry.id);
		if (!node) continue;
		if (entry.parent_id && directories.has(entry.parent_id)) {
			const parent = directories.get(entry.parent_id)!;
			node.hidden = node.hidden || parent.hidden;
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	for (const entry of entries) {
		if (entry.kind !== "file") continue;
		const fileNode: FilesystemTreeFile = {
			type: "file",
			name: entry.display_name,
			path: entry.path,
			hidden: Boolean(entry.hidden),
		};
		if (entry.parent_id && directories.has(entry.parent_id)) {
			const parent = directories.get(entry.parent_id)!;
			fileNode.hidden = fileNode.hidden || parent.hidden;
			parent.children.push(fileNode);
		} else {
			roots.push(fileNode);
		}
	}

	const sortChildren = (nodes: FilesystemTreeNode[]) => {
		nodes.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === "directory" ? -1 : 1;
			}
			return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
		});
		for (const node of nodes) {
			if (node.type === "directory") {
				sortChildren(node.children);
			}
		}
	};

	sortChildren(roots);
	return roots;
}
