import { useMemo, useState } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { useKeyValue } from "@/key-value/use-key-value";
import { useLix, useQuery } from "@lix-js/react-utils";
import { selectFiles } from "@/queries";

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

type TreeNode = string | [string, ...TreeNode[]];

/**
 * Builds a nested tree of paths with directories sorted before files, then by name.
 */
function buildTree(paths: string[]): TreeNode[] {
	type Dir = { [name: string]: Dir | true };
	const root: Dir = {};
	for (const p of paths) {
		const segs = p.split("/").filter(Boolean);
		let dir = root;
		for (let i = 0; i < segs.length; i++) {
			const s = segs[i]!;
			const isFile = i === segs.length - 1;
			if (!(s in dir)) dir[s] = isFile ? true : {};
			if (!isFile) dir = dir[s] as Dir;
		}
	}

	function toTree(d: Dir): TreeNode[] {
		const entries = Object.entries(d);
		entries.sort(([aName, aVal], [bName, bVal]) => {
			const aDir = aVal !== true;
			const bDir = bVal !== true;
			if (aDir !== bDir) return aDir ? -1 : 1; // folders first
			return aName.localeCompare(bName, undefined, { sensitivity: "base" });
		});
		return entries.map(([name, v]) => {
			if (v === true) return name as TreeNode;
			return [name, ...toTree(v as Dir)] as TreeNode;
		});
	}

	return toTree(root);
}

/**
 * Files tree for the left sidebar with optional inline "new file" creation row.
 *
 * @example
 * // Show the creator row from the parent and close it after create/cancel
 * <LeftSidebarFiles creating onRequestCloseCreate={() => setCreating(false)} />
 */
export function LeftSidebarFiles({
	creating = false,
	onRequestCloseCreate,
}: {
	creating?: boolean;
	onRequestCloseCreate?: () => void;
}) {
	const [activeFileId, setActiveFileId] = useKeyValue(
		"flashtype_active_file_id",
	);
	const files = useQuery(({ lix }) => selectFiles(lix));
	const lix = useLix();

	// Memoize expensive derivations from the files query
	const paths = useMemo(() => files.map((f) => f.path as string), [files]);
	const tree = useMemo(() => buildTree(paths), [paths]);
	const pathToId = useMemo(
		() =>
			Object.fromEntries(files.map((f) => [f.path as string, f.id as string])),
		[files],
	);
	return (
		<SidebarMenu>
			{creating ? (
				<InlineNewFileRow
					existingPaths={paths}
					onCancel={() => onRequestCloseCreate?.()}
					onCreate={async (stem) => {
						try {
							const path = ensureUniqueMarkdownPath(stem, paths);
							const id = nanoId({ lix });
							await lix.db
								.insertInto("file")
								.values({ id, path, data: new TextEncoder().encode("") })
								.execute();
							await setActiveFileId(id);
						} finally {
							onRequestCloseCreate?.();
						}
					}}
				/>
			) : null}
			{tree.map((item, i) => (
				<Tree
					key={i}
					item={item}
					activeId={activeFileId}
					onSelect={async (id) => {
						await setActiveFileId(id);
					}}
					pathPrefix=""
					pathToId={pathToId}
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
	let target = `/${base}.md`;
	if (!existingPaths.includes(target)) return target;
	let n = 2;
	while (true) {
		const candidate = `/${base} (${n}).md`;
		if (!existingPaths.includes(candidate)) return candidate;
		n++;
	}
}

/**
 * VSCode-like inline new file row. Edits only the stem and shows a fixed .md suffix.
 */
function InlineNewFileRow({
	existingPaths,
	onCancel,
	onCreate,
}: {
	existingPaths: string[];
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
						autoFocus
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

function Tree({
	item,
	activeId,
	onSelect,
	pathPrefix,
	pathToId,
}: {
	item: TreeNode;
	activeId: string | null;
	onSelect: (id: string) => Promise<void>;
	pathPrefix: string;
	pathToId: Record<string, string>;
}) {
	const [name, ...items] = Array.isArray(item) ? item : [item];
	const fullPath = `${pathPrefix}/${name as string}`;
	const [open, setOpen] = useState(false);

	if (!items.length) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					isActive={activeId === pathToId[fullPath]}
					onClick={() => {
						const id = pathToId[fullPath];
						if (id) onSelect(id);
					}}
					className="data-[active=true]:bg-secondary cursor-pointer"
				>
					<File />
					{name as string}
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible
				open={open}
				onOpenChange={setOpen}
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
			>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton className="cursor-pointer">
						<ChevronRight className="transition-transform" />
						{open ? <FolderOpen /> : <Folder />}
						{name as string}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{items.map((subItem, idx) => (
							<Tree
								key={idx}
								item={subItem}
								activeId={activeId}
								onSelect={onSelect}
								pathPrefix={fullPath}
								pathToId={pathToId}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}
