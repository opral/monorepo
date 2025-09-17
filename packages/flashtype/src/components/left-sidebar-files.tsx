import { useCallback, useEffect, useMemo, useState } from "react";
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
): string {
	const safeStem = stem.trim().replaceAll("/", "");
	const base = safeStem.length ? safeStem : "untitled";
	let target = normalizeDirectoryPath(`/${base}/`);
	if (!existingPaths.has(target)) return target;
	let n = 2;
	while (true) {
		const candidate = normalizeDirectoryPath(`/${base} (${n})/`);
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

	const handleCreateDirectory = useCallback(
		async (stem: string) => {
			const path = ensureUniqueDirectoryPath(stem, directoryPathSet);
			await lix.db
				.insertInto("directory")
				.values({ path } as any)
				.execute();
		},
		[lix.db, directoryPathSet],
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
			{creatingDirectory ? (
				<InlineNewDirectoryRow
					onCancel={() => onRequestCloseCreateDirectory?.()}
					onCreate={async (stem) => {
						try {
							await handleCreateDirectory(stem);
						} finally {
							onRequestCloseCreateDirectory?.();
						}
					}}
				/>
			) : null}
			{creatingFile ? (
				<InlineNewFileRow
					onCancel={() => onRequestCloseCreateFile?.()}
					onCreate={async (stem) => {
						try {
							const path = ensureUniqueMarkdownPath(stem, filePathList);
							const id = await nanoId({ lix });
							await lix.db
								.insertInto("file")
								.values({ id, path, data: new TextEncoder().encode("") })
								.execute();
							await setActiveFileId(id);
						} finally {
							onRequestCloseCreateFile?.();
						}
					}}
				/>
			) : null}
			{tree.map((node) => (
				<Tree
					key={`${node.type}-${node.path}`}
					node={node}
					activeId={activeFileId}
					onSelect={async (id) => {
						await setActiveFileId(id);
					}}
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
				/>
			))}
		</SidebarMenu>
	);
}

/**
 * Compute a unique markdown file path in the root folder given a desired name.
 *
 * - Appends `.md` when missing
 * - Ensures leading slash
 * - De-duplicates with " (2)", "(3)" suffixes
 */
function ensureUniqueMarkdownPath(
	stem: string,
	existingPaths: string[],
): string {
	const safeStem = (stem ?? "").trim().replaceAll("/", "");
	const base = safeStem.length ? safeStem : "untitled";
	let target = normalizeFilePath(`/${base}.md`);
	if (!existingPaths.includes(target)) return target;
	let n = 2;
	while (true) {
		const candidate = normalizeFilePath(`/${base} (${n}).md`);
		if (!existingPaths.includes(candidate)) return candidate;
		n++;
	}
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
	const [stem, setStem] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit() {
		if (busy) return;
		setBusy(true);
		try {
			await onCreate(stem || "untitled");
		} finally {
			setBusy(false);
		}
	}

	return (
		<SidebarMenuItem>
			<div
				className={
					"text-sidebar-foreground flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm"
				}
			>
				<File className="h-4 w-4" />
				<div className="flex min-w-0 items-center gap-1">
					<Input
						value={stem}
						onChange={(e) => setStem(e.target.value.replaceAll("/", ""))}
						placeholder="new-file"
						aria-label="New file name (without extension)"
						className="h-6 w-40 min-w-0 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								void handleSubmit();
							} else if (e.key === "Escape") {
								e.preventDefault();
								onCancel();
							}
						}}
					/>
					<span className="shrink-0 text-muted-foreground">.md</span>
				</div>
			</div>
		</SidebarMenuItem>
	);
}

function InlineNewDirectoryRow({
	onCancel,
	onCreate,
}: {
	onCancel: () => void;
	onCreate: (name: string) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [busy, setBusy] = useState(false);

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
			<div className="text-sidebar-foreground flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm">
				<Folder className="h-4 w-4" />
				<Input
					value={name}
					onChange={(e) => setName(e.target.value.replaceAll("/", ""))}
					placeholder="new-directory"
					aria-label="New directory name"
					className="h-6 w-40 min-w-0 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
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
				<Button
					variant="ghost"
					size="sm"
					className="h-6 px-2"
					onClick={handleSubmit}
					disabled={busy}
				>
					Create
				</Button>
			</div>
		</SidebarMenuItem>
	);
}

function Tree({
	node,
	activeId,
	onSelect,
	pathToId,
	onRequestDelete,
	onMoveFile,
	dragOverPath,
	setDragOverPath,
	activeFilePath,
}: {
	node: FilesystemTreeNode;
	activeId: string | null;
	onSelect: (id: string) => Promise<void>;
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
}) {
	if (node.type === "file") {
		return (
			<FileTreeItem
				node={node}
				activeId={activeId}
				onSelect={onSelect}
				pathToId={pathToId}
				onRequestDelete={onRequestDelete}
				setDragOverPath={setDragOverPath}
			/>
		);
	}

	return (
		<FolderTreeItem
			node={node}
			activeId={activeId}
			onSelect={onSelect}
			pathToId={pathToId}
			onRequestDelete={onRequestDelete}
			onMoveFile={onMoveFile}
			dragOverPath={dragOverPath}
			setDragOverPath={setDragOverPath}
			activeFilePath={activeFilePath}
		/>
	);
}

function FileTreeItem({
	node,
	activeId,
	onSelect,
	pathToId,
	onRequestDelete,
	setDragOverPath,
}: {
	node: FilesystemTreeNode & { type: "file" };
	activeId: string | null;
	onSelect: (id: string) => Promise<void>;
	pathToId: Map<string, string>;
	onRequestDelete: (fullPath: string) => Promise<void>;
	setDragOverPath: Dispatch<SetStateAction<string | null>>;
}) {
	const id = pathToId.get(node.path);
	const isActive = activeId === id;
	return (
		<SidebarMenuItem>
			<div
				data-active={isActive ? "true" : undefined}
				data-hidden={node.hidden ? "true" : undefined}
				className={cn(
					"group/menu-item flex w-full items-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-secondary",
					node.hidden && "text-muted-foreground opacity-60",
				)}
			>
				<SidebarMenuButton
					isActive={false}
					onClick={() => {
						if (id) onSelect(id);
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
	activeId,
	onSelect,
	pathToId,
	onRequestDelete,
	onMoveFile,
	dragOverPath,
	setDragOverPath,
	activeFilePath,
}: {
	node: FilesystemTreeNode & { type: "directory" };
	activeId: string | null;
	onSelect: (id: string) => Promise<void>;
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
}) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (activeFilePath && activeFilePath.startsWith(node.path)) {
			setOpen(true);
		}
	}, [activeFilePath, node.path]);

	const isDragOver = dragOverPath === node.path;

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
						className={cn(
							"cursor-pointer",
							isDragOver && "bg-secondary/40",
							node.hidden && "text-muted-foreground opacity-60",
						)}
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
						{node.children.map((child) => (
							<Tree
								key={`${child.type}-${child.path}`}
								node={child}
								activeId={activeId}
								onSelect={onSelect}
								pathToId={pathToId}
								onRequestDelete={onRequestDelete}
								onMoveFile={onMoveFile}
								dragOverPath={dragOverPath}
								setDragOverPath={setDragOverPath}
								activeFilePath={activeFilePath}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}
