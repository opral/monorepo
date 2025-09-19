import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
	ChevronRight,
	File,
	Folder,
	FolderOpen,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useLix, useQuery } from "@lix-js/react-utils";
import { selectFilesystemEntries } from "@/queries";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { nanoId } from "@lix-js/sdk";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { normalizeDirectoryPath, normalizeFilePath } from "@lix-js/sdk";
import {
	buildFilesystemTree,
	type FilesystemTreeNode,
} from "@/lib/build-filesystem-tree";

/**
 * Files tree for the left sidebar with optional inline "new file" creation row.
 *
 * @example
 * // Show the creator row from the parent and close it after create/cancel
 * <LeftSidebarFiles creating onRequestCloseCreate={() => setCreating(false)} />
 */

function ensureUniqueDirectoryPath(
	stem: string,
	existingPaths: Set<string>,
	parentDirectory: string = "/",
): string {
	const safeStem = stem.trim().replaceAll("/", "");
	const base = safeStem.length ? safeStem : "untitled";
	const normalizedParent =
		parentDirectory === "/" ? "/" : normalizeDirectoryPath(parentDirectory);
	const parentPrefix =
		normalizedParent === "/" ? "" : normalizedParent.slice(0, -1);
	let target = normalizeDirectoryPath(`${parentPrefix}/${base}/`);
	if (!existingPaths.has(target)) return target;
	let n = 2;
	while (true) {
		const candidate = normalizeDirectoryPath(`${parentPrefix}/${base} (${n})/`);
		if (!existingPaths.has(candidate)) return candidate;
		n++;
	}
}

function ensureUniqueFileDestination(
	fileName: string,
	targetDirectory: string,
	existingPaths: Set<string>,
	currentPath: string,
): string {
	const normalizedDir =
		targetDirectory === "/"
			? "/"
			: normalizeDirectoryPath(
					targetDirectory.endsWith("/")
						? targetDirectory
						: `${targetDirectory}/`,
				);
	const dirPrefix = normalizedDir === "/" ? "" : normalizedDir.slice(0, -1);
	const dot = fileName.lastIndexOf(".");
	const stem = dot === -1 ? fileName : fileName.slice(0, dot);
	const ext = dot === -1 ? "" : fileName.slice(dot);

	const initialPath = normalizeFilePath(
		dirPrefix ? `${dirPrefix}/${fileName}` : `/${fileName}`,
	);
	if (initialPath === currentPath || !existingPaths.has(initialPath)) {
		return initialPath;
	}

	let n = 2;
	while (true) {
		const candidateName = `${stem} (${n})${ext}`;
		const candidatePath = normalizeFilePath(
			dirPrefix ? `${dirPrefix}/${candidateName}` : `/${candidateName}`,
		);
		if (candidatePath === currentPath || !existingPaths.has(candidatePath)) {
			return candidatePath;
		}
		n++;
	}
}

export function LeftSidebarFiles({
	creatingFile = false,
	creatingDirectory = false,
	onRequestCloseCreateFile,
	onRequestCloseCreateDirectory,
}: {
	creatingFile?: boolean;
	creatingDirectory?: boolean;
	onRequestCloseCreateFile?: () => void;
	onRequestCloseCreateDirectory?: () => void;
}) {
	const [activeFileId, setActiveFileId] = useKeyValue(
		"flashtype_active_file_id",
	);
	const [selectedPath, setSelectedPath] = useState<string>("/");
	const entries = useQuery(({ lix }) => selectFilesystemEntries(lix));
	const lix = useLix();

	const tree = useMemo(() => buildFilesystemTree(entries), [entries]);

	const pathToId = useMemo(() => {
		const map = new Map<string, string>();
		for (const entry of entries) {
			if (entry.kind === "file") {
				map.set(entry.path, entry.id);
			}
		}
		return map;
	}, [entries]);

	const directoryPathSet = useMemo(() => {
		const set = new Set<string>();
		for (const entry of entries) {
			if (entry.kind === "directory") {
				set.add(normalizeDirectoryPath(entry.path));
			}
		}
		return set;
	}, [entries]);

	const filePathSet = useMemo(() => {
		const set = new Set<string>();
		for (const entry of entries) {
			if (entry.kind === "file") {
				set.add(normalizeFilePath(entry.path));
			}
		}
		return set;
	}, [entries]);

	const filePathList = useMemo(() => {
		const list: string[] = [];
		for (const entry of entries) {
			if (entry.kind === "file") {
				list.push(entry.path);
			}
		}
		return list;
	}, [entries]);

	const activeFilePath = useMemo(() => {
		for (const entry of entries) {
			if (entry.kind === "file" && entry.id === activeFileId) {
				return entry.path;
			}
		}
		return undefined;
	}, [entries, activeFileId]);

	const handleSelect = useCallback(
		async (path: string, isFile: boolean) => {
			setSelectedPath(path);
			if (isFile) {
				const id = pathToId.get(path);
				if (id) {
					await setActiveFileId(id);
				}
			}
		},
		[pathToId, setActiveFileId],
	);

	const getTargetDirectory = useCallback(
		(selected: string): string => {
			const selectedEntry = entries.find((entry) => entry.path === selected);
			if (selectedEntry?.kind === "directory") {
				return selectedEntry.path === "/"
					? "/"
					: normalizeDirectoryPath(selectedEntry.path);
			}
			if (!selected || selected === "/") {
				return "/";
			}
			const lastSlash = selected.lastIndexOf("/");
			if (lastSlash <= 0) {
				return "/";
			}
			return normalizeDirectoryPath(`${selected.slice(0, lastSlash)}/`);
		},
		[entries],
	);

	const createFileInDirectory = useCallback(
		async (stem: string, directory: string) => {
			const path = ensureUniqueMarkdownPath(stem, filePathList, directory);
			const id = await nanoId({ lix });
			await lix.db
				.insertInto("file")
				.values({ id, path, data: new TextEncoder().encode("") })
				.execute();
			await setActiveFileId(id);
			setSelectedPath(path);
			return path;
		},
		[filePathList, lix, setActiveFileId, setSelectedPath],
	);

	const createDirectoryInDirectory = useCallback(
		async (stem: string, directory: string) => {
			const path = ensureUniqueDirectoryPath(stem, directoryPathSet, directory);
			await lix.db
				.insertInto("directory")
				.values({ path } as any)
				.execute();
			setSelectedPath(path);
			return path;
		},
		[directoryPathSet, lix.db, setSelectedPath],
	);

	const targetDirectory = getTargetDirectory(selectedPath);

	const createFileAndClose = useCallback(
		async (stem: string, directory: string) => {
			try {
				await createFileInDirectory(stem, directory);
			} finally {
				onRequestCloseCreateFile?.();
			}
		},
		[createFileInDirectory, onRequestCloseCreateFile],
	);

	const createDirectoryAndClose = useCallback(
		async (stem: string, directory: string) => {
			try {
				await createDirectoryInDirectory(stem, directory);
			} finally {
				onRequestCloseCreateDirectory?.();
			}
		},
		[createDirectoryInDirectory, onRequestCloseCreateDirectory],
	);

	// Sync selection with active file
	useEffect(() => {
		if (!activeFilePath) return;
		setSelectedPath((prev) =>
			prev === activeFilePath ? prev : activeFilePath,
		);
	}, [activeFilePath]);

	const moveFileToDirectory = useCallback(
		async (fileId: string, currentPath: string, targetDirectory: string) => {
			const currentNormalized = normalizeFilePath(currentPath);
			const fileName = currentNormalized.split("/").filter(Boolean).pop();
			if (!fileName) return;
			const existing = new Set(filePathSet);
			existing.delete(currentNormalized);
			const destination = ensureUniqueFileDestination(
				fileName,
				targetDirectory,
				existing,
				currentNormalized,
			);
			if (destination === currentNormalized) return;
			await lix.db
				.updateTable("file")
				.set({ path: destination })
				.where("id", "=", fileId)
				.execute();
		},
		[lix.db, filePathSet],
	);

	const [dragOverPath, setDragOverPath] = useState<string | null>(null);
	async function handleDeleteFile(targetId: string) {
		await lix.db.transaction().execute(async (trx) => {
			await trx.deleteFrom("state").where("file_id", "=", targetId).execute();
			await trx.deleteFrom("file").where("id", "=", targetId).execute();
		});

		if (activeFileId === targetId) {
			await setActiveFileId(null);
		}
	}

	return (
		<SidebarMenu
			data-droptarget={dragOverPath === "/" ? "true" : undefined}
			onDragOver={(event) => {
				const data = event.dataTransfer.getData("application/json");
				if (!data) return;
				try {
					const parsed = JSON.parse(data);
					if (parsed?.kind === "file") {
						event.preventDefault();
						event.dataTransfer.dropEffect = "move";
						setDragOverPath("/");
					}
				} catch {}
			}}
			onDrop={async (event) => {
				const data = event.dataTransfer.getData("application/json");
				setDragOverPath(null);
				if (!data) return;
				try {
					const parsed = JSON.parse(data);
					if (parsed?.kind === "file") {
						await moveFileToDirectory(parsed.id, parsed.path, "/");
					}
				} catch {}
			}}
			onDragLeave={(event) => {
				if (event.currentTarget === event.target) {
					setDragOverPath((prev) => (prev === "/" ? null : prev));
				}
			}}
			className="data-[droptarget=true]:bg-secondary/40"
		>
			{creatingDirectory && targetDirectory === "/" ? (
				<InlineNewDirectoryRow
					onCancel={() => onRequestCloseCreateDirectory?.()}
					onCreate={async (stem) => {
						await createDirectoryAndClose(stem, targetDirectory);
					}}
				/>
			) : null}
			{creatingFile && targetDirectory === "/" ? (
				<InlineNewFileRow
					onCancel={() => onRequestCloseCreateFile?.()}
					onCreate={async (stem) => {
						await createFileAndClose(stem, targetDirectory);
					}}
				/>
			) : null}
			{tree.map((node) => (
				<Tree
					key={`${node.type}-${node.path}`}
					node={node}
					onSelect={handleSelect}
					pathToId={pathToId}
					onRequestDelete={async (fullPath) => {
						const id = pathToId.get(fullPath);
						if (!id) return;
						const ok = window.confirm(`Delete "${fullPath}"?`);
						if (!ok) return;
						await handleDeleteFile(id);
					}}
					onMoveFile={moveFileToDirectory}
					dragOverPath={dragOverPath}
					setDragOverPath={setDragOverPath}
					activeFilePath={activeFilePath}
					selectedPath={selectedPath}
					creatingFile={creatingFile}
					creatingDirectory={creatingDirectory}
					targetDirectory={targetDirectory}
					createFileInDirectory={createFileAndClose}
					createDirectoryInDirectory={createDirectoryAndClose}
					onCancelCreateFile={onRequestCloseCreateFile}
					onCancelCreateDirectory={onRequestCloseCreateDirectory}
				/>
			))}
		</SidebarMenu>
	);
}

/**
 * Compute a unique markdown file path in the given directory.
 *
 * - Appends `.md` when missing
 * - Ensures leading slash
 * - De-duplicates with " (2)", "(3)" suffixes
 */
function ensureUniqueMarkdownPath(
	stem: string,
	existingPaths: string[],
	targetDirectory: string = "/",
): string {
	const safeStem = (stem ?? "").trim().replaceAll("/", "");
	const base = safeStem.length ? safeStem : "untitled";
	const dirPrefix =
		targetDirectory === "/" ? "" : targetDirectory.replace(/\/$/, "");
	let target = normalizeFilePath(`${dirPrefix}/${base}.md`);
	if (!existingPaths.includes(target)) return target;
	let n = 2;
	while (true) {
		const candidate = normalizeFilePath(`${dirPrefix}/${base} (${n}).md`);
		if (!existingPaths.includes(candidate)) return candidate;
		n++;
	}
}

/**
 * Base component for creating new items (files or directories) inline.
 */
function InlineNewItemRow({
	onCancel,
	onCreate,
	placeholder,
	ariaLabel,
	icon,
	suffix,
}: {
	onCancel: () => void;
	onCreate: (name: string) => Promise<void>;
	placeholder: string;
	ariaLabel: string;
	icon: React.ReactNode;
	suffix?: React.ReactNode;
}) {
	const [name, setName] = useState("");
	const [busy, setBusy] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const rowRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			if (!rowRef.current) return;
			const target = event.target as Node | null;
			if (target && rowRef.current.contains(target)) return;
			onCancel();
		}
		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	}, [onCancel]);

	async function handleSubmit() {
		if (busy) return;
		setBusy(true);
		try {
			await onCreate(name || "untitled");
		} finally {
			setBusy(false);
		}
	}

	return (
		<SidebarMenuItem>
			<div
				ref={rowRef}
				className="text-sidebar-foreground flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm"
			>
				{icon}
				{suffix ? (
					<div className="flex min-w-0 items-center gap-1">
						<Input
							ref={inputRef}
							value={name}
							onChange={(e) => setName(e.target.value.replaceAll("/", ""))}
							placeholder={placeholder}
							aria-label={ariaLabel}
							className="h-6 w-40 min-w-0 border-none bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									void handleSubmit();
								} else if (e.key === "Escape") {
									e.preventDefault();
									onCancel();
								}
							}}
							disabled={busy}
						/>
						{suffix}
					</div>
				) : (
					<Input
						ref={inputRef}
						value={name}
						onChange={(e) => setName(e.target.value.replaceAll("/", ""))}
						placeholder={placeholder}
						aria-label={ariaLabel}
						className="h-6 w-40 min-w-0 border-none bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								void handleSubmit();
							} else if (e.key === "Escape") {
								e.preventDefault();
								onCancel();
							}
						}}
						disabled={busy}
					/>
				)}
			</div>
		</SidebarMenuItem>
	);
}

/**
 * VSCode-like inline new file row. Edits only the stem and shows a fixed .md suffix.
 */
function InlineNewFileRow({
	onCancel,
	onCreate,
}: {
	onCancel: () => void;
	onCreate: (stem: string) => Promise<void>;
}) {
	return (
		<InlineNewItemRow
			onCancel={onCancel}
			onCreate={onCreate}
			placeholder="new-file"
			ariaLabel="New file name (without extension)"
			icon={<File className="h-4 w-4" />}
			suffix={<span className="shrink-0 text-muted-foreground">.md</span>}
		/>
	);
}

function InlineNewDirectoryRow({
	onCancel,
	onCreate,
}: {
	onCancel: () => void;
	onCreate: (name: string) => Promise<void>;
}) {
	return (
		<InlineNewItemRow
			onCancel={onCancel}
			onCreate={onCreate}
			placeholder="new-directory"
			ariaLabel="New directory name"
			icon={<Folder className="h-4 w-4" />}
		/>
	);
}

function Tree({
	node,
	onSelect,
	pathToId,
	onRequestDelete,
	onMoveFile,
	dragOverPath,
	setDragOverPath,
	activeFilePath,
	selectedPath,
	creatingFile,
	creatingDirectory,
	targetDirectory,
	createFileInDirectory,
	createDirectoryInDirectory,
	onCancelCreateFile,
	onCancelCreateDirectory,
}: {
	node: FilesystemTreeNode;
	onSelect: (path: string, isFile: boolean) => Promise<void>;
	pathToId: Map<string, string>;
	onRequestDelete: (fullPath: string) => Promise<void>;
	onMoveFile: (
		id: string,
		currentPath: string,
		targetDir: string,
	) => Promise<void>;
	dragOverPath: string | null;
	setDragOverPath: Dispatch<SetStateAction<string | null>>;
	activeFilePath?: string;
	selectedPath: string;
	creatingFile: boolean;
	creatingDirectory: boolean;
	targetDirectory: string;
	createFileInDirectory: (stem: string, directory: string) => Promise<void>;
	createDirectoryInDirectory: (
		stem: string,
		directory: string,
	) => Promise<void>;
	onCancelCreateFile?: () => void;
	onCancelCreateDirectory?: () => void;
}) {
	if (node.type === "file") {
		return (
			<FileTreeItem
				node={node}
				onSelect={onSelect}
				pathToId={pathToId}
				onRequestDelete={onRequestDelete}
				setDragOverPath={setDragOverPath}
				selectedPath={selectedPath}
			/>
		);
	}

	return (
		<FolderTreeItem
			node={node}
			onSelect={onSelect}
			pathToId={pathToId}
			onRequestDelete={onRequestDelete}
			onMoveFile={onMoveFile}
			dragOverPath={dragOverPath}
			setDragOverPath={setDragOverPath}
			activeFilePath={activeFilePath}
			selectedPath={selectedPath}
			creatingFile={creatingFile}
			creatingDirectory={creatingDirectory}
			targetDirectory={targetDirectory}
			createFileInDirectory={createFileInDirectory}
			createDirectoryInDirectory={createDirectoryInDirectory}
			onCancelCreateFile={onCancelCreateFile}
			onCancelCreateDirectory={onCancelCreateDirectory}
		/>
	);
}

function FileTreeItem({
	node,
	onSelect,
	pathToId,
	onRequestDelete,
	setDragOverPath,
	selectedPath,
}: {
	node: FilesystemTreeNode & { type: "file" };
	onSelect: (path: string, isFile: boolean) => Promise<void>;
	pathToId: Map<string, string>;
	onRequestDelete: (fullPath: string) => Promise<void>;
	setDragOverPath: Dispatch<SetStateAction<string | null>>;
	selectedPath: string;
}) {
	const id = pathToId.get(node.path);
	const isSelected = selectedPath === node.path;
	return (
		<SidebarMenuItem>
			<div
				data-active={isSelected ? "true" : undefined}
				data-hidden={node.hidden ? "true" : undefined}
				className={cn(
					"group/menu-item flex w-full items-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-secondary",
					node.hidden && "text-muted-foreground opacity-60",
				)}
			>
				<SidebarMenuButton
					isActive={false}
					onClick={() => {
						onSelect(node.path, true);
					}}
					className={cn(
						"cursor-pointer flex-1 hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent",
						node.hidden && "text-muted-foreground",
					)}
					draggable
					onDragStart={(event) => {
						if (!id) return;
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setData(
							"application/json",
							JSON.stringify({ kind: "file", id, path: node.path }),
						);
					}}
					onDragEnd={() => setDragOverPath(null)}
				>
					<File />
					{node.name}
				</SidebarMenuButton>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="ml-1 h-6 w-6 p-0 text-muted-foreground opacity-0 transition-opacity group-hover/menu-item:opacity-100"
							aria-label={`More actions for ${node.path}`}
							title="More actions"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="h-3.5 w-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40 p-1">
						<DropdownMenuItem
							className="cursor-pointer text-red-600 hover:text-red-600 focus:text-red-600"
							onClick={async (e) => {
								e.stopPropagation();
								await onRequestDelete(node.path);
							}}
						>
							<Trash2 className="mr-2 h-3.5 w-3.5 text-red-600" /> Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</SidebarMenuItem>
	);
}

function FolderTreeItem({
	node,
	onSelect,
	pathToId,
	onRequestDelete,
	onMoveFile,
	dragOverPath,
	setDragOverPath,
	activeFilePath,
	selectedPath,
	creatingFile,
	creatingDirectory,
	targetDirectory,
	createFileInDirectory,
	createDirectoryInDirectory,
	onCancelCreateFile,
	onCancelCreateDirectory,
}: {
	node: FilesystemTreeNode & { type: "directory" };
	onSelect: (path: string, isFile: boolean) => Promise<void>;
	pathToId: Map<string, string>;
	onRequestDelete: (fullPath: string) => Promise<void>;
	onMoveFile: (
		id: string,
		currentPath: string,
		targetDir: string,
	) => Promise<void>;
	dragOverPath: string | null;
	setDragOverPath: Dispatch<SetStateAction<string | null>>;
	activeFilePath?: string;
	selectedPath: string;
	creatingFile: boolean;
	creatingDirectory: boolean;
	targetDirectory: string;
	createFileInDirectory: (stem: string, directory: string) => Promise<void>;
	createDirectoryInDirectory: (
		stem: string,
		directory: string,
	) => Promise<void>;
	onCancelCreateFile?: () => void;
	onCancelCreateDirectory?: () => void;
}) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (
			(activeFilePath && activeFilePath.startsWith(node.path)) ||
			(selectedPath && selectedPath.startsWith(node.path)) ||
			targetDirectory.startsWith(node.path)
		) {
			setOpen(true);
		}
	}, [activeFilePath, node.path, selectedPath, targetDirectory]);

	const isDragOver = dragOverPath === node.path;
	const isSelected = selectedPath === node.path;
	const showFileCreator = creatingFile && targetDirectory === node.path;
	const showDirectoryCreator =
		creatingDirectory && targetDirectory === node.path;

	return (
		<SidebarMenuItem>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
			>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						data-hidden={node.hidden ? "true" : undefined}
						data-selected={isSelected ? "true" : undefined}
						className={cn(
							"cursor-pointer",
							isDragOver && "bg-secondary/40",
							isSelected && "bg-secondary",
							node.hidden && "text-muted-foreground opacity-60",
						)}
						onClick={() => {
							onSelect(node.path, false);
						}}
						onDragOver={(event) => {
							const data = event.dataTransfer.getData("application/json");
							if (!data) return;
							try {
								const parsed = JSON.parse(data);
								if (parsed?.kind !== "file") return;
								if (parsed.path === node.path) return;
								setDragOverPath(node.path);
								event.preventDefault();
								event.dataTransfer.dropEffect = "move";
							} catch {
								// ignore invalid drag payloads
							}
						}}
						onDragLeave={() => {
							if (dragOverPath === node.path) setDragOverPath(null);
						}}
						onDrop={async (event) => {
							const data = event.dataTransfer.getData("application/json");
							if (!data) return;
							try {
								const parsed = JSON.parse(data);
								if (parsed?.kind !== "file") return;
								if (parsed.path.startsWith(node.path)) return;
								setDragOverPath(null);
								await onMoveFile(parsed.id, parsed.path, node.path);
							} catch {
								// ignore invalid drag payloads
							}
						}}
					>
						<div className="flex flex-1 items-center gap-2 text-left">
							<ChevronRight className="h-3 w-3 transition-transform" />
							{open ? (
								<FolderOpen className="h-4 w-4" />
							) : (
								<Folder className="h-4 w-4" />
							)}
							{node.name}
						</div>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{showFileCreator ? (
							<InlineNewFileRow
								onCancel={() => onCancelCreateFile?.()}
								onCreate={(stem) => createFileInDirectory(stem, node.path)}
							/>
						) : null}
						{showDirectoryCreator ? (
							<InlineNewDirectoryRow
								onCancel={() => onCancelCreateDirectory?.()}
								onCreate={(stem) => createDirectoryInDirectory(stem, node.path)}
							/>
						) : null}
						{node.children.map((child) => (
							<Tree
								key={`${child.type}-${child.path}`}
								node={child}
								onSelect={onSelect}
								pathToId={pathToId}
								onRequestDelete={onRequestDelete}
								onMoveFile={onMoveFile}
								dragOverPath={dragOverPath}
								setDragOverPath={setDragOverPath}
								activeFilePath={activeFilePath}
								selectedPath={selectedPath}
								creatingFile={creatingFile}
								creatingDirectory={creatingDirectory}
								targetDirectory={targetDirectory}
								createFileInDirectory={createFileInDirectory}
								createDirectoryInDirectory={createDirectoryInDirectory}
								onCancelCreateFile={onCancelCreateFile}
								onCancelCreateDirectory={onCancelCreateDirectory}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}
