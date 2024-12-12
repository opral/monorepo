import IconUpload from "@/components/icons/IconUpload.tsx";
import SectionHeader from "@/components/SectionHeader.tsx";
import ListItems from "@/components/ListItems.tsx";
import {
	discussionSearchParamsAtom,
	fileIdSearchParamsAtom,
	filesAtom,
	lixAtom,
} from "@/state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { Button } from "@/components/ui/button.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
	activeFileAtom,
	allChangesDynamicGroupingAtom,
	changesCurrentVersionAtom,
} from "@/state-active-file.ts";
import { useNavigate } from "react-router-dom";
import { ChangeComponent } from "@/components/ChangeComponent.tsx";
import { DynamicChangeGroup } from "@/components/DynamicChangeGroup.tsx";
import FilterSelect from "@/components/FilterSelect.tsx";
import ChatInput from "@/components/ChatInput.tsx";
import ConnectedChanges from "@/components/ConnectedChanges.tsx";
import DiscussionThread from "@/components/DiscussionThread.tsx";
import { VersionDropdown } from "@/components/VersionDropdown.tsx";
import CustomLink from "@/components/CustomLink.tsx";
import { useCallback } from "react";
import DropArea from "@/components/DropArea.js";
import { Download, Ellipsis, Plug, TrashIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";

const isCsvFile = (path: string) => {
	return path.toLowerCase().endsWith(".csv");
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
	const [changesCurrentVersion] = useAtom(changesCurrentVersionAtom);
	const [allChangesDynamicGrouping] = useAtom(allChangesDynamicGroupingAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [fileIdSearchParams, setFileIdSearchParams] = useAtom(
		fileIdSearchParamsAtom
	);
	const [discussionSearchParams] = useAtom(discussionSearchParamsAtom);

	//hooks
	const navigate = useNavigate();

	// handlers
	const handleUpload = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				await lix.db
					.insertInto("file")
					.values({
						path: "/" + file.name,
						data: await file.arrayBuffer(),
					})
					.execute();
				await saveLixToOpfs({ lix });
			}
		};
		input.click();
	};

	const handleBackgroundClick = useCallback(
		(e: React.MouseEvent) => {
			// Only trigger if clicking the background container itself
			if (e.target === e.currentTarget) {
				setFileIdSearchParams(undefined);
				navigate("/");
			}
		},
		[setFileIdSearchParams, navigate]
	);

	return (
		<div className="flex bg-white h-full">
			<div
				// min 300px, max 600px – change also in JS beneath
				className="min-w-[300px] max-w-[600px] w-[450px] flex flex-col h-full relative"
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
							<DropdownMenuItem onClick={handleUpload}>
								<IconUpload />
								Upload
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={async () => {
									// @ts-expect-error - globally defined
									await window.deleteLix();
									window.location.href = "/";
								}}
							>
								<TrashIcon />
								Reset
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									alert("Not implemented");
								}}
							>
								<Download />
								Download Lix
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SectionHeader>
				<div className="flex-1 flex flex-col overflow-hidden">
					<div className="flex-1 overflow-y-auto">
						{files.map((file) => (
							<ListItems
								key={file.id}
								id={file.id}
								type="file"
								name={file.path.replace("/", "")}
								appLink={
									file.path.endsWith(".csv")
										? `/app/csv/editor?f=${file.id}`
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
					<CustomLink
						to="/file-manager"
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
					</CustomLink>
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
							const newWidth = Math.min(Math.max(startWidth + delta, 300), 600);
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
			<Separator orientation="vertical" className="h-screen" />

			{fileIdSearchParams && discussionSearchParams && (
				<div className="flex-1 h-full">
					<SectionHeader
						backaction={() => navigate(`/?f=${fileIdSearchParams}`)}
						title={`Discussion`}
					/>
					<div className="flex flex-col px-2.5 h-[calc(100%_-_60px)] overflow-y-auto flex-shrink-0">
						<ConnectedChanges />
						<div className="flex-1 mt-6">
							<DiscussionThread />
						</div>
						<ChatInput />
					</div>
				</div>
			)}
			{fileIdSearchParams && !discussionSearchParams && (
				<div className="flex-1 h-full">
					<SectionHeader
						backaction={() => navigate("/")}
						title={
							activeFile?.path.replace("/", "")
								? `/ ${activeFile?.path.replace("/", "")}`
								: "Graph"
						}
					>
						<Button
							variant="default"
							size="default"
							className={activeFile?.path ? "" : "hidden"}
						>
							<CustomLink
								to={
									activeFile?.path && isCsvFile(activeFile.path)
										? `/app/csv/editor?f=${fileIdSearchParams}`
										: "https://github.com/opral/monorepo/tree/main/lix"
								}
								target={isCsvFile(activeFile?.path || "") ? "_self" : "_blank"}
							>
							{activeFile?.path && isCsvFile(activeFile.path)
								? "Open in CSV app"
								: "Build a Lix App"}
							</CustomLink>
						</Button>
					</SectionHeader>
					<div className="px-2.5 h-[calc(100%_-_60px)] overflow-y-auto flex-shrink-0">
						{activeFile?.path && !isCsvFile(activeFile.path) ? (
							<NoPluginMessage extension={getFileExtension(activeFile.path)} />
						) : (
							<>
								<FilterSelect />
								{changesCurrentVersion.map((change, i) => (
									<ChangeComponent
										key={change.id}
										change={{
											...change,
											snapshot_content: change.snapshot_content as Record<
												string,
												any
											> | null,
											parent_snapshot_content:
												change.parent_snapshot_content as Record<
													string,
													any
												> | null,
											discussion_count: Number(change.discussion_count),
											discussion_ids: String(change.discussion_ids),
										}}
										showTopLine={i !== 0}
										showBottomLine={i !== changesCurrentVersion.length - 1}
									/>
								))}
							</>
						)}
					</div>
				</div>
			)}
			{!fileIdSearchParams && !discussionSearchParams && (
				<div className="flex-1 h-full">
					<SectionHeader title="Overview" />
					<div className="px-[10px] h-[calc(100%_-_60px)] overflow-y-auto">
						{Object.entries(allChangesDynamicGrouping).map(
							([date, changes], i) => {
								return (
									<DynamicChangeGroup
										key={date}
										changes={changes}
										showTopLine={i !== 0}
										showBottomLine={
											i !== Object.keys(allChangesDynamicGrouping).length - 1
										}
									/>
								);
							}
						)}
					</div>
				</div>
			)}
		</div>
	);
}
