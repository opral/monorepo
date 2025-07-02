import * as React from "react";
import {
	Download,
	MoreVertical,
	PenSquare,
	Trash2,
	FileText,
	Plus,
	ArrowLeft,
	Folder,
	FolderOpen,
	FolderPlus,
	FileInput,
} from "lucide-react";
import posthog from "posthog-js";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { useSuspenseQuery, useSuspenseQueryTakeFirst } from "@lix-js/react-utils";
import {
	selectFiles,
	selectActiveFile,
	selectMdAstDocument,
} from "@/queries";
import { createNewLixFileInOpfs } from "@/helper/newLix";
import { updateUrlParams } from "@/helper/updateUrlParams";
import { saveLixName } from "@/helper/renameLix";
import { nanoid, openLix } from "@lix-js/sdk";

import {
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "@/components/ui/multisidebar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import InfoCard from "../InfoCard";
import { Separator } from "./separator";
import { generateHumanId } from "@/helper/generateHumanId";
import { useChat } from "../editor/use-chat";
import { serializeMdastEntities } from "../editor/mdast-plate-bridge";
import { useLix } from "@lix-js/react-utils";
import { findLixFilesInOpfs } from "@/helper/findLixInOpfs";

/**
 * Selects available lix files
 */
export const getAvailableLixes = async (): Promise<
	Array<{ id: string; name: string }>
> => {
	try {
		// Get all Lix files in OPFS
		const lixFiles = await findLixFilesInOpfs();

		// Convert to the format expected by consumers
		// We'll use a map to ensure no duplicate IDs
		const lixMap = new Map();

		for (const file of lixFiles) {
			// If we've already seen this ID, skip it (shouldn't happen with our cleanup, but just in case)
			if (!lixMap.has(file.id)) {
				lixMap.set(file.id, {
					id: file.id,
					name: file.name,
				});
			}
		}

		// Convert the map values to an array
		return Array.from(lixMap.values());
	} catch (error) {
		console.error("Failed to load available lixes:", error);
		return [];
	}
}

const availableLixes = await getAvailableLixes()

export function LixSidebar() {
	const lix = useLix();
	const [searchParams, setSearchParams] = useSearchParams();
	const files = useSuspenseQuery(selectFiles);
	const activeFile = useSuspenseQueryTakeFirst(selectActiveFile);
	// const currentLixName = useSuspenseQueryTakeFirst(selectCurrentLixName);
	const currentLixName = "TODO"
	const lixIdSearchParams = searchParams.get("lix");
	const fileIdSearchParams = searchParams.get("f");

	const [fileToDelete, setFileToDelete] = React.useState<string | null>(null);
	const [showDeleteProjectsDialog, setShowDeleteProjectsDialog] =
		React.useState(false);
	const [inlineEditingFile, setInlineEditingFile] = React.useState<{
		id: string;
		name: string;
	} | null>(null);
	const [isRenamingLix, setIsRenamingLix] = React.useState(false);
	const [lixName, setLixName] = React.useState(currentLixName || "");
	const [previousLixName, setPreviousLixName] = React.useState("");
	const [lixDropdownOpen, setLixDropdownOpen] = React.useState(false);
	const [fileDropdownOpen, setFileDropdownOpen] = React.useState<string | null>(
		null
	);
	const inlineInputRef = React.useRef<HTMLInputElement>(null);
	const lixInputRef = React.useRef<HTMLInputElement>(null);

	const navigate = useNavigate();

	const chat = useChat();
	const { status } = chat;
	const isLoading = status === "streaming" || status === "submitted";

	const switchToFile = (fileId: string) =>
		setSearchParams((currentParams) => {
			currentParams.set("f", fileId)
			return currentParams
		});

	const createNewFile = React.useCallback(async () => {
		if (!lix) return;

		try {
			const fileName = generateHumanId();

			const newFileId = nanoid();

			await lix.db
				.insertInto("file")
				.values({
					id: newFileId,
					path: `/${fileName}.md`,
					data: new TextEncoder().encode(``),
				})
				.executeTakeFirstOrThrow();

			// OpfsStorage now handles persistence automatically through the onStateCommit hook
			switchToFile(newFileId);
		} catch (error) {
			console.error("Failed to create new file:", error);
		}
	}, [lix, switchToFile]);

	const saveInlineRename = React.useCallback(async () => {
		if (!lix || !inlineEditingFile || !inlineEditingFile.name.trim()) {
			return;
		}

		try {
			// Find the file to check its current name
			const currentFile = files?.find((f) => f.id === inlineEditingFile.id);
			if (!currentFile) {
				console.error("File not found for inline renaming");
				setInlineEditingFile(null);
				return;
			}

			// Extract current filename without path and extension
			const currentFileName = currentFile.path
				.split("/")
				.pop()
				?.replace(/\.md$/, "");

			// Exit rename mode regardless of whether name changed
			setInlineEditingFile(null);

			// Only perform database operation if name actually changed
			if (currentFileName === inlineEditingFile.name.trim()) {
				return;
			}

			await lix.db
				.updateTable("file")
				.set({ path: `/${inlineEditingFile.name}.md` })
				.where("id", "=", inlineEditingFile.id)
				.execute();

			// OpfsStorage now handles persistence automatically through the onStateCommit hook
		} catch (error) {
			console.error("Failed to rename file:", error);
			setInlineEditingFile(null);
		}
	}, [lix, inlineEditingFile, files]);

	const handleSaveLixName = React.useCallback(async () => {
		if (!lix || !lixName?.trim()) {
			return;
		}

		try {
			// Exit rename mode regardless of whether name changed
			setIsRenamingLix(false);

			// Only perform database operation if name actually changed
			if (lixName?.trim() === currentLixName) {
				return;
			}

			// Use the imported saveLixName helper function which handles the file renaming
			// This will also update the URL
			await saveLixName({
				lix,
				newName: lixName || "",
			});

			// The currentLixId will be automatically updated via URL parameter
		} catch (error) {
			console.error("Failed to save lix name:", error);
			setIsRenamingLix(false);
		}
	}, [lix, lixName, currentLixName]);

	// Add click-outside detection for Lix rename input
	React.useEffect(() => {
		if (!isRenamingLix || !lixInputRef.current) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const lixInput = lixInputRef.current;

			// Check if the click is outside the input and its container
			if (
				lixInput &&
				!lixInput.contains(target) &&
				!lixInput.closest("#rename-lix-container")?.contains(target)
			) {
				handleSaveLixName();
			}
		};

		// Add event listener after a small delay to prevent immediate triggering
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isRenamingLix, handleSaveLixName]);

	// Add click-outside detection for file rename input
	React.useEffect(() => {
		if (!inlineEditingFile || !inlineInputRef.current) return;

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const fileInput = inlineInputRef.current;

			// Check if the click is outside the input and its container
			if (
				fileInput &&
				!fileInput.contains(target) &&
				!fileInput
					.closest(`#rename-file-container-${inlineEditingFile.id}`)
					?.contains(target)
			) {
				saveInlineRename();
			}
		};

		// Add event listener after a small delay to prevent immediate triggering
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [inlineEditingFile?.id, saveInlineRename]);

	const switchToLix = React.useCallback(
		(lixId: string) => {
			navigate(`?lix=${lixId}`);
		},
		[navigate]
	);

	const deleteFile = React.useCallback(
		async (fileId: string) => {
			if (!lix || !fileId) return;

			try {
				const isActiveFile = activeFile?.id === fileId;

				// Delete the file
				await lix.db.deleteFrom("file").where("id", "=", fileId).execute();

				// OpfsStorage now handles persistence automatically through the onStateCommit hook

				// If we deleted the active file, switch to another file
				if (isActiveFile) {
					const remainingFiles = files ? files.filter((f) => f.id !== fileId) : [];
					if (remainingFiles.length > 0) {
						await switchToFile(remainingFiles[0].id);
					}
				}

			} catch (error) {
				console.error("Failed to delete file:", error);
			}
		},
		[lix, files, activeFile, createNewFile]
	);

	const handleCreateNewLix = React.useCallback(async () => {
		try {
			// Create a new lix file
			const { id } = await createNewLixFileInOpfs();

			// Navigate to the new lix
			navigate(`?lix=${id}`);
		} catch (error) {
			console.error("Failed to create new lix:", error);
		}
	}, [navigate]);

	const handleImportFile = React.useCallback(async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".md";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (file && lix) {
				try {
					const fileContent = await file.text();
					const fileName = file.name.replace(/\.md$/, "");

					const importedFileId = nanoid();

					await lix.db
						.insertInto("file")
						.values({
							id: importedFileId,
							path: `/${fileName}.md`,
							data: new TextEncoder().encode(fileContent),
						})
						.executeTakeFirstOrThrow();

					posthog.capture("File Imported", {
						fileName: file.name,
					});

					// OpfsStorage now handles persistence automatically through the onStateCommit hook
					updateUrlParams({ f: importedFileId });
				} catch (error) {
					console.error("Failed to import file:", error);
				}
			}
		};
		input.click();
	}, [lix]);

	const handleOpenLixFile = React.useCallback(async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".lix";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (file) {
				try {
					const fileContent = await file.arrayBuffer();
					const opfsRoot = await navigator.storage.getDirectory();
					const lix = await openLix({
						blob: new Blob([fileContent]),
					});
					const lixId = await lix.db
						.selectFrom("key_value")
						.where("key", "=", "lix_id")
						.select("value")
						.executeTakeFirstOrThrow();

					const fileName = file.name.replace(/\.lix$/, "");
					const opfsFile = await opfsRoot.getFileHandle(`${fileName}.lix`, {
						create: true,
					});
					const writable = await opfsFile.createWritable();
					await writable.write(fileContent);
					await writable.close();
					navigate("?lix=" + lixId.value);
				} catch (error) {
					console.error("Failed to open Lix file:", error);
				}
			}
		};
		input.click();
	}, [navigate]);

	const handleExportLixFile = React.useCallback(async () => {
		if (!lix) return;

		try {
			// Use the current display name (from file name) or fall back to the ID
			const displayName =
				currentLixName ||
				(await lix.db
					.selectFrom("key_value")
					.where("key", "=", "lix_id")
					.select("value")
					.executeTakeFirstOrThrow()
					.then((result) => result.value));

			const blob = await lix.toBlob();
			const a = document.createElement("a");
			a.href = URL.createObjectURL(blob);
			a.download = `${displayName}.lix`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch (error) {
			console.error("Failed to export Lix file:", error);
		}
	}, [lix, currentLixName]);

	const handleExportFile = React.useCallback(
		async (fileId: string) => {
			if (!lix) return;

			try {
				// Get file metadata for the filename
				const file = await lix.db
					.selectFrom("file")
					.where("id", "=", fileId)
					.select(["path"])
					.executeTakeFirstOrThrow();

				const fileName = file.path.split("/").pop() || "document.md";

				// Get MD-AST content for the file
				const mdAstDocument = await selectMdAstDocument();
				
				if (mdAstDocument && mdAstDocument.entities.length > 0) {
					// Generate markdown content from MD-AST entities
					const fileContent = serializeMdastEntities(
						mdAstDocument.entities, 
						mdAstDocument.order
					);

					const blob = new Blob([fileContent], { type: "text/markdown" });
					const a = document.createElement("a");
					a.href = URL.createObjectURL(blob);
					a.download = fileName;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
				} else {
					console.warn("No MD-AST content found for export");
				}
			} catch (error) {
				console.error("Failed to export file:", error);
			}
		},
		[lix]
	);

	const handleDeleteCurrentLix = React.useCallback(async () => {
		if (!lix) return;

		try {
			const root = await navigator.storage.getDirectory();
			// Find another lix to navigate to
			const availableLixFiles = [];
			// @ts-expect-error - TS doesn't know about values() yet
			for await (const entry of root.values()) {
				if (
					entry.kind === "file" &&
					entry.name.endsWith(".lix") &&
					entry.name !== `${currentLixName || ""}.lix`
				) {
					availableLixFiles.push(entry.name);
				}
			}

			if (availableLixFiles.length > 0) {
				// The file is saved with the current name displayed in the UI (with .lix extension)
				if (currentLixName) {
					await root.removeEntry(`${currentLixName}.lix`);
				}

				// Navigate to another lix
				const nextLixId = availableLixFiles[0].replace(/\.lix$/, "");
				navigate(`?lix=${nextLixId}`);
			} else {
				// No lixes left, create a new one by navigating to root
				navigate("/");
			}

			setShowDeleteProjectsDialog(false);
		} catch (error) {
			console.error("Error deleting current lix:", error);
		}
	}, [lix, navigate]);

	const handleResetAllOpfs = React.useCallback(async () => {
		try {
			const root = await navigator.storage.getDirectory();

			// First collect all entries to avoid modification during iteration
			const entriesToRemove = [];
			// @ts-expect-error - TS doesn't know about values() yet
			for await (const entry of root.values()) {
				if (entry.kind === "file" || entry.kind === "directory") {
					entriesToRemove.push(entry.name);
				}
			}

			// Then remove all collected entries
			for (const name of entriesToRemove) {
				try {
					await root.removeEntry(name, { recursive: true });
				} catch (err) {
					console.error(`Failed to remove ${name}:`, err);
				}
			}

			updateUrlParams({ lix: "", f: "" });
		} catch (error) {
			console.error("Error resetting OPFS:", error);
		}
	}, [navigate]);

	// Get current lix ID, with fallback to first available lix
	const currentLixId = React.useMemo(() => {
		// Prefer the URL parameter as it's immediately available
		if (lixIdSearchParams && lixIdSearchParams.trim() !== "") {
			return lixIdSearchParams;
		}
		// If no URL parameter and we have available lixes, use the first one with a valid ID
		if (availableLixes && availableLixes.length > 0) {
			const validLix = availableLixes.find(lix => lix.id && lix.id.trim() !== "");
			if (validLix) {
				return validLix.id;
			}
		}
		// Return undefined if no URL parameter and no available lixes with valid IDs
		// This prevents the Select from having an empty string value
		return undefined;
	}, [lixIdSearchParams, availableLixes]);

	const startRenamingLix = React.useCallback(() => {
		// Close the dropdown first
		setLixDropdownOpen(false);

		// Use the current display name from our atom
		const displayName = currentLixName || lixName || "";
		setLixName(displayName);

		setPreviousLixName(displayName);
		setIsRenamingLix(true);
	}, [currentLixName, lixName]);

	// Focus the lix input when starting to rename
	React.useEffect(() => {
		if (isRenamingLix && lixInputRef.current) {
			const input = lixInputRef.current;

			// Use requestAnimationFrame for proper DOM timing
			const rafId = requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (input && document.contains(input)) {
						input.focus();
						input.select();
					}
				});
			});

			return () => {
				cancelAnimationFrame(rafId);
			};
		}
	}, [isRenamingLix]);

	// Focus the file input when starting to rename
	React.useEffect(() => {
		if (inlineEditingFile && inlineInputRef.current) {
			const input = inlineInputRef.current;

			// Use requestAnimationFrame for proper DOM timing
			const rafId = requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (input && document.contains(input)) {
						input.focus();
						input.select();
					}
				});
			});

			return () => {
				cancelAnimationFrame(rafId);
			};
		}
	}, [inlineEditingFile]);

	const cancelRenameLix = React.useCallback(() => {
		setLixName(previousLixName);
		setIsRenamingLix(false);
	}, [previousLixName]);


	// Update lix name when the current lix name changes
	React.useEffect(() => {
		if (currentLixName) {
			setLixName(currentLixName || "");
		}
	}, [currentLixName]);

	const mdFiles = files ? files.filter((file) => file.path.endsWith(".md")) : [];

	const backlink = React.useCallback(() => {
		return `https://lix.host/app/fm?lix=${lixIdSearchParams}&f=${fileIdSearchParams}`;
	}, [lixIdSearchParams, fileIdSearchParams]);

	return (
		<>
			<SidebarHeader className="flex flex-row justify-between items-center gap-1 h-11">
				{window.location.hostname !== "flashtype.ai" && (
					<a href={backlink()}>
						<Button
							variant="ghost"
							size="icon"
							className="shrink-0 mr-1"
							title="To lix file manager"
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
					</a>
				)}

				{isRenamingLix ? (
					<div
						className="h-7 flex-1 flex items-center border-b border-input max-w-[calc(100%-4rem)]"
						id="rename-lix-container"
					>
						{/* Instead of using portals which are complex, we'll use the inert attribute on parent containers */}
						<input
							ref={lixInputRef}
							type="text"
							value={lixName || ""}
							onChange={(e) => setLixName(e.target.value)}
							onFocus={(e) => e.target.select()}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleSaveLixName();
								} else if (e.key === "Escape") {
									cancelRenameLix();
								}
							}}
							className="bg-transparent outline-none h-7 pl-2 pr-0 text-sm font-semibold w-full mt-[1px]"
							// Add data attribute to help with debugging accessibility
							data-lix-rename-input
							// Ensure the input has a label for accessibility
							aria-label="Rename Lix"
							tabIndex={0}
						/>
					</div>
				) : (
					<div className="flex-1 min-w-0 mx-1 -my-0.5 max-w-[calc(100%-4rem)]">
						{/* Workspace selector using Select component */}
						<Select
							onValueChange={(value) => {
								if (value === "new") {
									handleCreateNewLix();
								} else {
									switchToLix(value);
								}
							}}
								value={currentLixId || ""}
						>
							<SelectTrigger
								size="sm"
								className="max-w-full border-0 shadow-none bg-transparent font-semibold text-sm px-1 hover:bg-muted rounded justify-between"
							>
								<SelectValue placeholder="Select Workspace">
									<div className="flex items-center justify-between w-full">
										<span className="truncate mr-1">
											{currentLixName || lixName || ""}
										</span>
									</div>
								</SelectValue>
							</SelectTrigger>
							<SelectContent align="center" className="w-60 -ml-0.5">
								<SelectGroup>
									<SelectLabel className="font-medium">Lixes</SelectLabel>
									{availableLixes?.filter((lix: { id: string; name: string }) => lix.id && lix.id.trim() !== "").map((lix: { id: string; name: string }) => (
										<SelectItem key={lix.id} value={lix.id}>
											<div className="flex items-center w-full">
												<Folder className="h-4 w-4 mr-2 shrink-0" />
												<span className="truncate flex-1">{lix.name}</span>
											</div>
										</SelectItem>
									))}
									<SelectSeparator />
									<SelectItem value="new">
										<div className="flex items-center w-full">
											<FolderPlus className="h-4 w-4 mr-2 shrink-0" />
											<span>New Lix</span>
										</div>
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				<DropdownMenu open={lixDropdownOpen} onOpenChange={setLixDropdownOpen}>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" title="Workspace Options">
							<MoreVertical className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-60 py-1"
						onCloseAutoFocus={(e) => {
							if (isRenamingLix) {
								e.preventDefault();
							}
						}}
					>
						<DropdownMenuItem onClick={handleCreateNewLix}>
							<FolderPlus className="h-4 w-4 mr-2" />
							<span>New Lix</span>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleOpenLixFile}>
							<FolderOpen className="h-4 w-4 mr-2" />
							<span>Open Lix</span>
						</DropdownMenuItem>
						<Separator className="my-1" />
						<DropdownMenuItem onClick={handleExportLixFile}>
							<Download className="h-4 w-4 mr-2" />
							<span>Download Lix</span>
						</DropdownMenuItem>
						<Separator className="my-1" />
						<DropdownMenuItem onClick={startRenamingLix}>
							<PenSquare className="h-4 w-4 mr-2" />
							<span>Rename Lix</span>
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => setShowDeleteProjectsDialog(true)}
						>
							<Trash2 className="h-4 w-4 mr-2 text-current" />
							<span>Delete Lix</span>
						</DropdownMenuItem>

						{/* Development-only option */}
						{import.meta.env.DEV && (
							<>
								<Separator className="my-1" />
								<DropdownMenuItem
									className="text-amber-600 focus:text-amber-600mt-1 pt-1"
									onClick={handleResetAllOpfs}
								>
									<Trash2 className="h-4 w-4 mr-2 text-current" />
									<span>Reset OPFS (Dev)</span>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarHeader>

			<div className="w-full px-2">
				<SidebarSeparator className="mx-0" />
			</div>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex items-center pr-0">
						Local files{" "}
						{mdFiles.length > 0 && (
							<span className="ml-1.5 text-xs text-muted-foreground">
								({mdFiles.length})
							</span>
						)}
						<div className="flex flex-grow" />
						<Button
							variant="ghost"
							size="icon"
							title="Import Markdown Document"
							onClick={handleImportFile}
							disabled={isLoading}
						>
							<FileInput className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							title="New File"
							onClick={createNewFile}
							disabled={isLoading}
						>
							<Plus className="size-4" />
						</Button>
					</SidebarGroupLabel>

					<SidebarMenu className="pt-1">
						{mdFiles.map((file) => (
							<SidebarMenuItem key={file.id}>
								{inlineEditingFile?.id === file.id ? (
									// Rename state - match the exact height and padding of the SidebarMenuButton
									<div
										className="flex items-center w-full h-8 p-2 rounded-md"
										id={`rename-file-container-${file.id}`}
									>
										<FileText
											className={`h-4 w-4 mr-2 shrink-0 ${file.id === activeFile?.id ? "text-primary" : ""}`}
										/>
										<div className="flex items-center border-b border-input min-w-0">
											<input
												autoFocus
												ref={inlineInputRef}
												type="text"
												value={inlineEditingFile.name}
												data-current-editing-id={inlineEditingFile.id}
												onChange={(e) =>
													setInlineEditingFile((prev) =>
														prev ? { ...prev, name: e.target.value } : null
													)
												}
												onFocus={(e) => e.target.select()}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														console.log("Enter");
														saveInlineRename();
													} else if (e.key === "Escape") {
														setInlineEditingFile(null);
													}
												}}
												className="bg-transparent outline-none text-sm min-w-0 mt-[1px]"
												data-file-rename-input
												aria-label={`Rename file ${inlineEditingFile.name}`}
												tabIndex={0}
											/>
											<span className="text-muted-foreground text-sm whitespace-nowrap">
												.md
											</span>
										</div>
									</div>
								) : (
									<SidebarMenuButton
										isActive={file.id === activeFile?.id}
										onClick={() => switchToFile(file.id)}
										onDoubleClick={() => {
											const fileName =
												file.path.split("/").pop()?.replace(/\.md$/, "") || "";
											setInlineEditingFile({ id: file.id, name: fileName });
											// Focus is now handled by useEffect
										}}
										disabled={isLoading}
										className={`w-full justify-start ${file.id === activeFile?.id ? "font-medium" : ""}`}
									>
										<FileText
											className={`h-4 w-4 ${file.id === activeFile?.id ? "text-primary" : ""}`}
										/>
										<span>{file.path.split("/").pop()}</span>
									</SidebarMenuButton>
								)}

								<DropdownMenu
									open={fileDropdownOpen === file.id}
									onOpenChange={(open) =>
										setFileDropdownOpen(open ? file.id : null)
									}
								>
									<DropdownMenuTrigger asChild>
										<SidebarMenuAction showOnHover>
											<MoreVertical className="h-4 w-4" />
										</SidebarMenuAction>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="w-48 py-1"
										onCloseAutoFocus={(e) => {
											if (inlineEditingFile?.id === file.id) {
												e.preventDefault();
											}
										}}
									>
										<DropdownMenuItem
											onClick={() => {
												const fileName =
													file.path.split("/").pop()?.replace(/\.md$/, "") ||
													"";
												setInlineEditingFile({ id: file.id, name: fileName });
												setFileDropdownOpen(null);
											}}
										>
											<PenSquare className="h-4 w-4 mr-2" />
											<span>Rename</span>
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleExportFile(file.id)}>
											<Download className="h-4 w-4 mr-2" />
											<span>Export File</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => setFileToDelete(file.id)}
										>
											<Trash2 className="h-4 w-4 mr-2 text-current" />
											<span>Delete</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</SidebarMenuItem>
						))}

						{mdFiles.length === 0 && (
							<div className="px-2 py-4 text-center">
								<div className="text-sm text-muted-foreground mb-2">
									No documents found.
								</div>
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={createNewFile}
								>
									<Plus className="h-3.5 w-3.5 mr-1" />
									Create New Document
								</Button>
							</div>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="p-2">
				<InfoCard />
			</SidebarFooter>

			{/* Delete File Confirmation Dialog */}
			<Dialog
				open={!!fileToDelete}
				onOpenChange={(open) => !open && setFileToDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Document</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this document? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button
							variant="destructive"
							onClick={() => {
								if (fileToDelete) {
									deleteFile(fileToDelete);
									setFileToDelete(null);
								}
							}}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Current Lix Confirmation Dialog */}
			<Dialog
				open={showDeleteProjectsDialog}
				onOpenChange={setShowDeleteProjectsDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Current Lix</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete the current lix? This will remove
							all files in this lix and cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button variant="destructive" onClick={handleDeleteCurrentLix}>
							Delete Lix
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
