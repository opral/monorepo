import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import type { FilesystemTreeNode } from "@/views/files-view/build-filesystem-tree";

export type FileTreeDraft = {
	readonly kind: "file" | "directory";
	directoryPath: string;
	value: string;
	onChange: (next: string) => void;
	onCommit: () => void;
	onCancel: () => void;
};

export type FileTreeProps = {
	readonly nodes?: FilesystemTreeNode[];
	readonly onOpenFile?: (path: string) => void;
	readonly draft?: FileTreeDraft | null;
	readonly selectedPath?: string;
	readonly isPanelFocused?: boolean;
	readonly onSelectItem?: (path: string, kind: "file" | "directory") => void;
};

const sanitizeForTestId = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "") || "root";

/**
 * Minimal prototype file tree that mirrors the structure of the left sidebar.
 *
 * @example
 * <FileTree onOpenFile={(path) => console.log(path)} />
 */
export function FileTree({
	nodes = [],
	onOpenFile,
	draft,
	selectedPath,
	isPanelFocused = false,
	onSelectItem,
}: FileTreeProps) {
	const directoryPaths = useMemo(() => collectDirectoryPaths(nodes), [nodes]);
	const [openDirectories, setOpenDirectories] = useState(
		() => new Set(directoryPaths),
	);

	useEffect(() => {
		setOpenDirectories(new Set(directoryPaths));
	}, [directoryPaths]);

	const sortedNodes = useMemo(() => sortNodes(nodes), [nodes]);

	const toggleDirectory = useCallback((path: string) => {
		setOpenDirectories((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	}, []);

	const selectedClasses = isPanelFocused
		? "bg-brand-200/80 border border-brand-500 text-neutral-900"
		: "bg-neutral-200/70 border border-neutral-300 text-neutral-900";

	return (
		<ul className="space-y-1 text-[13px] text-neutral-900">
			{draft?.directoryPath === "/" ? (
				<DraftRow
					key="draft:root"
					draft={draft}
					isPanelFocused={isPanelFocused}
				/>
			) : null}
			{sortedNodes.map((node) => (
				<FileTreeNode
					key={node.path}
					node={node}
					onToggleDirectory={toggleDirectory}
					openDirectories={openDirectories}
					onOpenFile={onOpenFile}
					draft={draft}
					selectedPath={selectedPath}
					onSelectItem={onSelectItem}
					selectedClasses={selectedClasses}
					isPanelFocused={isPanelFocused}
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
	draft,
	selectedPath,
	onSelectItem,
	selectedClasses,
	isPanelFocused,
}: {
	readonly node: FilesystemTreeNode;
	readonly onToggleDirectory: (path: string) => void;
	readonly openDirectories: Set<string>;
	readonly onOpenFile?: (path: string) => void;
	readonly draft?: FileTreeDraft | null;
	readonly selectedPath?: string;
	readonly onSelectItem?: (path: string, kind: "file" | "directory") => void;
	readonly selectedClasses: string;
	readonly isPanelFocused: boolean;
}) {
	if (node.type === "file") {
		const isSelected = selectedPath === node.path;
		const buttonClass = clsx(
			"flex w-full items-center gap-2 rounded border border-transparent px-2 py-1 text-left text-[13px] transition-colors",
			!isSelected && "hover:bg-neutral-100",
			isSelected ? selectedClasses : "text-neutral-700",
		);
		const itemTestId = `file-tree-item-${sanitizeForTestId(node.path)}`;
		return (
			<li>
				<button
					type="button"
					data-selected={isSelected ? "true" : undefined}
					data-testid={itemTestId}
					className={buttonClass}
					onClick={() => {
						onSelectItem?.(node.path, "file");
						onOpenFile?.(node.path);
					}}
				>
					<FileText className="h-3.5 w-3.5 text-neutral-500" />
					<span>{formatDisplayName(node.name)}</span>
				</button>
			</li>
		);
	}

	const containsDraft = draft?.directoryPath === node.path;
	const isOpen = containsDraft || openDirectories.has(node.path);
	const Icon = isOpen ? FolderOpen : Folder;
	const suppressSelection = Boolean(draft && draft.directoryPath === node.path);
	const isSelected = !suppressSelection && selectedPath === node.path;
	const buttonClass = clsx(
		"flex items-center gap-1 rounded border border-transparent px-2 py-1 text-left text-[13px] font-medium transition-colors",
		!isSelected && "hover:bg-neutral-100",
		isSelected ? selectedClasses : "text-neutral-700",
	);

	return (
		<li>
			<div className="flex items-center">
				<button
					type="button"
					aria-expanded={isOpen}
					data-selected={isSelected ? "true" : undefined}
					data-testid={`file-tree-directory-${sanitizeForTestId(node.path)}`}
					className={buttonClass}
					onClick={() => {
						onSelectItem?.(node.path, "directory");
						onToggleDirectory(node.path);
					}}
				>
					<ChevronRight
						className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
					/>
					<Icon className="h-3.5 w-3.5 text-neutral-500" />
					<span>{formatDisplayName(node.name)}</span>
				</button>
			</div>
			{isOpen ? (
				<ul className="ml-4 space-y-1 border-l border-neutral-200 pl-2">
					{containsDraft ? (
						<DraftRow
							key={`draft:${node.path}`}
							draft={draft!}
							isPanelFocused={isPanelFocused}
						/>
					) : null}
					{sortNodes(node.children).map((child) => (
						<FileTreeNode
							key={child.path}
							node={child}
							onToggleDirectory={onToggleDirectory}
							openDirectories={openDirectories}
							onOpenFile={onOpenFile}
							draft={draft}
							selectedPath={selectedPath}
							onSelectItem={onSelectItem}
							selectedClasses={selectedClasses}
							isPanelFocused={isPanelFocused}
						/>
					))}
				</ul>
			) : null}
		</li>
	);
}

function DraftRow({
	draft,
	isPanelFocused,
}: {
	readonly draft: FileTreeDraft;
	readonly isPanelFocused: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const rowRef = useRef<HTMLDivElement | null>(null);
	const [value, setValue] = useState(draft.value);
	const [busy, setBusy] = useState(false);
	const isFile = draft.kind === "file";
	const Icon = isFile ? FileText : Folder;
	const suffix = isFile ? (
		<span className="shrink-0 text-neutral-400">.md</span>
	) : null;
	const ringClasses = isPanelFocused
		? "border border-brand-500/70 shadow-[inset_0_0_0_2px_rgba(10,132,255,0.55)]"
		: "border border-neutral-300 shadow-[inset_0_0_0_2px_rgba(120,120,120,0.35)]";

	useEffect(() => {
		setValue(draft.value);
	}, [draft.value]);

	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!rowRef.current) return;
			const target = event.target as Node | null;
			if (target && rowRef.current.contains(target)) return;
			draft.onCancel();
		};
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [draft]);

	const handleCommit = useCallback(async () => {
		if (busy) return;
		setBusy(true);
		try {
			draft.onChange(value);
			await draft.onCommit();
		} finally {
			setBusy(false);
		}
	}, [busy, draft, value]);

	return (
		<li>
			<div
				ref={rowRef}
				className={clsx(
					"flex items-center gap-2 rounded bg-neutral-0 px-2 py-1 text-left text-[13px] text-neutral-900 shadow-sm",
					ringClasses,
				)}
			>
				<Icon className="h-3.5 w-3.5 text-neutral-400" />
				<input
					ref={inputRef}
					data-testid="files-view-draft-input"
					className="min-w-0 flex-1 bg-transparent px-0 py-0 text-[13px] outline-none focus:outline-none"
					value={value}
					onChange={(event) => {
						const next = event.target.value.replaceAll("/", "");
						setValue(next);
						draft.onChange(next);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							void handleCommit();
						} else if (event.key === "Escape") {
							event.preventDefault();
							draft.onCancel();
						}
					}}
					disabled={busy}
				/>
				{suffix}
			</div>
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

function formatDisplayName(name: string): string {
	return decodeURIComponent(name);
}
