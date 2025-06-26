import IconUpload from "@/components/icons/IconUpload.tsx";
import SectionHeader from "@/components/SectionHeader.tsx";
import ListItems from "@/components/ListItems.tsx";
import {
	threadSearchParamsAtom,
	fileIdSearchParamsAtom,
	filesAtom,
	lixAtom,
	lixIdSearchParamsAtom,
	supportedFileTypes,
} from "@/state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
	activeFileAtom,
	checkpointChangeSetsAtom,
	intermediateChangesAtom,
} from "@/state-active-file.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatInput from "@/components/ChatInput.tsx";
// import ConnectedChanges from "@/components/ConnectedChanges.tsx";
import DiscussionThread from "@/components/DiscussionThread.tsx";
import { VersionDropdown } from "@/components/VersionDropdown.tsx";
import CustomLink from "@/components/CustomLink.tsx";
import DropArea from "@/components/DropArea.js";
import { Download, Ellipsis, Plug, TrashIcon, File } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import IconMerge from "@/components/icons/IconMerge.tsx";
import { Lix, openLix, toBlob } from "@lix-js/sdk";
import { posthog } from "posthog-js";
import CheckpointComponent from "@/components/CheckpointComponent.tsx";
import IntermediateCheckpointComponent from "@/components/IntermediateCheckpointComponent.tsx";

const isSupportedFile = (path: string) => {
	return supportedFileTypes.some(
		(supportedFileType) => supportedFileType.extension === getFileExtension(path)
	);
};

const getFileExtension = (path: string) => {
	const parts = path.split(".");
	return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
};

const NoPluginMessage = ({ extension }: { extension: string }) => (
	<div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-slate-200 h-[calc(100%_-_10px)]">
		<Plug className="w-12 h-12 text-slate-400 mb-4" />
		<div className="text-lg text-slate-700 mb-4">
			There is no lix plugin for "{extension}" extension.
		</div>
		<Button
			variant="default"
			onClick={() =>
				window.open("https://github.com/opral/monorepo/tree/main/lix", "_blank")
			}
		>
			Get started building a plugin
		</Button>
	</div>
);

export default function Page() {
	// state atoms
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);
	const [intermediateChanges] = useAtom(intermediateChangesAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [fileIdSearchParams] = useAtom(fileIdSearchParamsAtom);
	const [lixIdSearchParams] = useAtom(lixIdSearchParamsAtom);
	const [threadSearchParams] = useAtom(threadSearchParamsAtom);
	const [searchParams] = useSearchParams();

	//hooks
	const navigate = useNavigate();

	// handlers
	const handleImport = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
					.insertInto("file")
					.values({
						path: "/" + file.name,
						data: new Uint8Array(await file.arrayBuffer()),
					})
					.execute();
				posthog.capture("File Imported", {
					fileName: file.name,
				});
				await saveLixToOpfs({ lix });
			}
		};
		input.click();
	};

	const handleOpenLixFile = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
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

				const opfsFile = await opfsRoot.getFileHandle(`${lixId.value}.lix`, {
					create: true,
				});
				const writable = await opfsFile.createWritable();
				await writable.write(fileContent);
				await writable.close();
				navigate("?lix=" + lixId.value);
			}
		};
		input.click();
	};

	const handleMerge = async () => {
		if (!lix) return;

		try {
			// Open file picker for .lix files
			const input = document.createElement("input");
			input.type = "file";
			// TODO: Add .lix to accept
			// input.accept = ".lix";

			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (!file) return;

				// Read the file and merge it
				const reader = new FileReader();
				reader.onload = async (event) => {
					const content = event.target?.result;
					if (!content || typeof content !== "string") return;

					try {
						// TODO: Implement actual merge logic here
						alert("Merge functionality not yet implemented");
					} catch (error) {
						console.error("Merge failed:", error);
					}
				};
				reader.readAsText(file);
			};

			input.click();
		} catch (error) {
			console.error("Merge failed:", error);
			alert("Merge failed. See console for details.");
		}
	};

	const handleExportLixFile = async (lix: Lix) => {
		const lixId = await lix.db
			.selectFrom("key_value")
			.where("key", "=", "lix_id")
			.select("value")
			.executeTakeFirstOrThrow();

		const blob = await toBlob({ lix });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${lixId.value}.lix`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleBackgroundClick = async (e: React.MouseEvent) => {
		// Only trigger if clicking the background container itself
		if (e.target === e.currentTarget) {
			const newParams = new URLSearchParams(searchParams);
			const openLix = newParams.get("lix");
			navigate(`/?lix=${openLix}`);
		}
	};

	return (
		<div className="flex bg-white h-full">
			<div
				// min 300px, max 600px – change also in JS beneath
				className="min-w-[380px] max-w-[600px] w-[450px] flex flex-col h-full relative"
				ref={(el) => {
					if (el) {
						el.style.width = el.offsetWidth + "px";
					}
				}}
			>
				<SectionHeader title="Files" fileActions={[<VersionDropdown />]}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="secondary" size="default">
								<Ellipsis />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={handleImport}>
								<IconUpload />
								Import File
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleOpenLixFile}>
								<File />
								Open Lix
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleExportLixFile(lix)}>
								<Download />
								Export Lix
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleMerge}>
								<IconMerge />
								Merge Lix
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={async () => {
									try {
										const root = await navigator.storage.getDirectory();
										// @ts-expect-error - TS doesn't know about values() yet
										for await (const entry of root.values()) {
											if (entry.kind === "file") {
												await root.removeEntry(entry.name);
											}
										}
										navigate("/");
										console.log("All files deleted from OPFS.");
									} catch (error) {
										console.error("Error deleting files from OPFS:", error);
									}
								}}
							>
								<TrashIcon />
								Reset OPFS
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SectionHeader>
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="mt-1.5 flex-1 overflow-y-auto flex flex-col gap-2">
						{files.map((file) => (
							<ListItems
								key={file.id}
								id={file.id}
								type="file"
								name={file.path.replace("/", "")}
								appLink={
									isSupportedFile(file.path)
										? `/app${supportedFileTypes.find((fileType) => fileType.extension === getFileExtension(file.path))?.route}?lix=${lixIdSearchParams}&f=${file.id}`
										: ""
								}
							/>
						))}
						<div className="flex-1" onClick={handleBackgroundClick}>
							<DropArea />
						</div>
					</div>
				</div>
				<div className="px-3 py-3 border-t border-slate-100">
					<a
						href="/file-manager"
						className="block p-4 bg-slate-50 hover:bg-slate-100 rounded-lg ring-1 ring-slate-200 transition-all"
					>
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-sm font-medium text-slate-900">
									Learn more about Lix File Manager
								</h3>
								<p className="text-sm text-slate-500 mt-1">
									Discover features and capabilities
								</p>
							</div>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-slate-400"
							>
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</div>
					</a>
				</div>

				<div
					className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-300 group"
					onMouseDown={(e) => {
						e.preventDefault();
						const container = e.currentTarget.parentElement;
						if (!container) return;

						const startX = e.clientX;
						const startWidth = container.offsetWidth;

						const handleMouseMove = (moveEvent: MouseEvent) => {
							const delta = moveEvent.clientX - startX;
							// min 300px, max 600px – change also in css
							const newWidth = Math.min(Math.max(startWidth + delta, 380), 600);
							if (container) {
								container.style.width = `${newWidth}px`;
							}
						};

						const handleMouseUp = () => {
							document.removeEventListener("mousemove", handleMouseMove);
							document.removeEventListener("mouseup", handleMouseUp);
							document.body.style.cursor = "";
						};

						document.addEventListener("mousemove", handleMouseMove);
						document.addEventListener("mouseup", handleMouseUp);
						document.body.style.cursor = "col-resize";
					}}
				>
					<div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-200 opacity-0 group-hover:opacity-100" />
				</div>
			</div>
			<Separator orientation="vertical" className="h-full" />

			{fileIdSearchParams && threadSearchParams && (
				<div className="flex-1 h-full pb-2">
					<SectionHeader
						backaction={() => navigate(`/?f=${fileIdSearchParams}`)}
						title={`Discussion`}
					/>
					<div className="flex flex-col px-2.5 h-[calc(100%_-_60px)] overflow-y-auto flex-shrink-0">
						{/* <ConnectedChanges /> */}
						<div className="flex-1 mt-6">
							<DiscussionThread />
						</div>
						<ChatInput />
					</div>
				</div>
			)}
			{!threadSearchParams && (
				<div className="flex-1 h-full pb-2">
					<SectionHeader
						backaction={activeFile ? () => navigate("/") : undefined}
						title={
							activeFile?.path.replace("/", "")
								? `/ ${activeFile?.path.replace("/", "")}`
								: "Graph"
						}
					>
						{fileIdSearchParams && (
							<Button
								variant="default"
								size="default"
								className={activeFile?.path ? "relative" : "hidden"}
							>
								<CustomLink
									to={
										activeFile?.path && isSupportedFile(activeFile.path)
											? ("/app"
												+ supportedFileTypes.find(supportedFileType =>
													supportedFileType.extension === getFileExtension(activeFile.path))?.route)
											+ `?lix=${lixIdSearchParams}&f=${fileIdSearchParams}`
											: "https://github.com/opral/monorepo/tree/main/lix"
									}
									target={isSupportedFile(activeFile?.path || "") ? "_self" : "_blank"}
								>
									{activeFile?.path && isSupportedFile(activeFile.path)
										? `Open in ${supportedFileTypes.find(
											supportedFileType =>
												supportedFileType.extension === getFileExtension(activeFile.path)
										)?.appName}`
										: "Build a Lix App"}
								</CustomLink>
								{/* indicator for user to click on the button */}
								{activeFile?.path && (
									<span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-900 rounded-full animate-ping" />
								)}
							</Button>
						)}
					</SectionHeader>
					<div className="relative h-full">
						{/* Fade effect at the top */}
						<div className="absolute top-0 left-0 w-full h-[20px] bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
						<div className="px-[10px] h-[calc(100%_-_60px)] overflow-y-auto">
							{activeFile?.path && !isSupportedFile(activeFile.path) ? (
								<NoPluginMessage extension={getFileExtension(activeFile.path)} />
							) : (
								<>
									{intermediateChanges.length > 0 && (
										<IntermediateCheckpointComponent />
									)}
										{checkpointChangeSets.map((checkpointChangeSet, index) => {
											const previousCheckpointId = checkpointChangeSets[index + 1]?.id ?? undefined;
										return (
											<CheckpointComponent
												key={checkpointChangeSet.id}
												checkpointChangeSet={checkpointChangeSet}
												previousChangeSetId={previousCheckpointId}
												showTopLine={index !== 0 || intermediateChanges.length > 0}
												showBottomLine={index !== checkpointChangeSets.length - 1}
											/>
										);
									})}
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
