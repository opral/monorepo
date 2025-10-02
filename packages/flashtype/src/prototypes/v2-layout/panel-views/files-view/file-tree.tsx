import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { FilesystemTreeNode } from "@/lib/build-filesystem-tree";

export type FileTreeProps = {
	readonly nodes?: FilesystemTreeNode[];
	readonly onOpenFile?: (path: string) => void;
};

/**
 * Minimal prototype file tree that mirrors the structure of the left sidebar.
 *
 * @example
 * <FileTree onOpenFile={(path) => console.log(path)} />
 */
export function FileTree({ nodes = [], onOpenFile }: FileTreeProps) {
	const directoryPaths = useMemo(() => collectDirectoryPaths(nodes), [nodes]);
	const [openDirectories, setOpenDirectories] = useState(
		() => new Set(directoryPaths),
	);

	useEffect(() => {
		setOpenDirectories(new Set(directoryPaths));
	}, [directoryPaths]);

	const sortedNodes = useMemo(() => sortNodes(nodes), [nodes]);

	const toggleDirectory = (path: string) => {
		setOpenDirectories((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

	return (
		<ul className="space-y-1 text-[13px] text-neutral-900">
			{sortedNodes.map((node) => (
				<FileTreeNode
					key={node.path}
					node={node}
					onToggleDirectory={toggleDirectory}
					openDirectories={openDirectories}
					onOpenFile={onOpenFile}
				/>
			))}
		</ul>
	);
}

function FileTreeNode({
	node,
	onToggleDirectory,
	openDirectories,
	onOpenFile,
}: {
	readonly node: FilesystemTreeNode;
	readonly onToggleDirectory: (path: string) => void;
	readonly openDirectories: Set<string>;
	readonly onOpenFile?: (path: string) => void;
}) {
	if (node.type === "file") {
		return (
			<li>
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-neutral-100"
					onClick={() => onOpenFile?.(node.path)}
				>
					<FileText className="h-3.5 w-3.5 text-neutral-500" />
					<span>{node.name}</span>
				</button>
			</li>
		);
	}

	const isOpen = openDirectories.has(node.path);
	const Icon = isOpen ? FolderOpen : Folder;

	return (
		<li>
			<div className="flex items-center">
				<button
					type="button"
					aria-expanded={isOpen}
					className="flex items-center gap-1 rounded px-2 py-1 text-left text-[13px] font-medium text-neutral-700 hover:bg-neutral-100"
					onClick={() => onToggleDirectory(node.path)}
				>
					<ChevronRight
						className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
					/>
					<Icon className="h-3.5 w-3.5 text-neutral-500" />
					<span>{node.name}</span>
				</button>
			</div>
			{isOpen && node.children.length > 0 ? (
				<ul className="ml-4 space-y-1 border-l border-neutral-200 pl-2">
					{sortNodes(node.children).map((child) => (
						<FileTreeNode
							key={child.path}
							node={child}
							onToggleDirectory={onToggleDirectory}
							openDirectories={openDirectories}
							onOpenFile={onOpenFile}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

function sortNodes(nodes: FilesystemTreeNode[]): FilesystemTreeNode[] {
	return [...nodes].sort((a, b) => {
		if (a.type === b.type) {
			return a.name.localeCompare(b.name);
		}
		return a.type === "directory" ? -1 : 1;
	});
}

function collectDirectoryPaths(nodes: FilesystemTreeNode[]): string[] {
	const paths: string[] = [];
	for (const node of nodes) {
		if (node.type === "directory") {
			paths.push(node.path);
			paths.push(...collectDirectoryPaths(node.children));
		}
	}
	return paths;
}
