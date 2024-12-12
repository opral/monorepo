import IconUpload from "@/components/icons/IconUpload.tsx";
import SectionHeader from "@/components/SectionHeader.tsx";
import ListItems from "@/components/ListItems.tsx";
import { discussionSearchParamsAtom, fileIdSearchParamsAtom, filesAtom, lixAtom } from "@/state.ts";
import { useAtom } from "jotai";
import { saveLixToOpfs } from "@/helper/saveLixToOpfs.ts";
import { Button } from "@/components/ui/button.tsx"
import { Separator } from "@/components/ui/separator.tsx"
import { activeFileAtom, allChangesDynamicGroupingAtom, changesCurrentVersionAtom } from "@/state-active-file.ts";
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
import { Plug } from "lucide-react";

const isCsvFile = (path: string) => {
	return path.toLowerCase().endsWith(".csv");
};

const getFileExtension = (path: string) => {
	const parts = path.split(".");
	return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
};

const NoPluginMessage = ({ extension }: { extension: string }) => (
	<div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-slate-200 h-[calc(100%_-_15px)]">
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
			<div className="max-w-[340px] flex-1 flex flex-col h-full">
				<SectionHeader title="Files">
					<Button
						variant="ghost"
						onClick={async (e) => {
							e.stopPropagation();
							// @ts-expect-error - globally defined
							await window.deleteLix();
							window.location.href = "/";
						}}
					>
						Reset
					</Button>
					<Button
						variant="secondary"
						onClick={(e) => {
							e.stopPropagation();
							handleUpload();
						}}
					>
						<IconUpload />
						Upload
					</Button>
				</SectionHeader>
				<div className="flex-1 flex flex-col overflow-hidden relative">
					<div className="flex-1 overflow-y-auto relative">
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
					<div
						className="p-4 mt-auto border-t border-slate-100 relative z-20"
						onClick={(e) => e.stopPropagation()}
					>
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
						fileActions={[<VersionDropdown />]}
					>
						<Button
							variant="default"
							size="default"
							onClick={() =>
								activeFile?.path
									? isCsvFile(activeFile.path)
										? navigate(`/app/csv/editor?f=${fileIdSearchParams}`)
										: window.open(
												"https://github.com/opral/monorepo/tree/main/lix",
												"_blank"
											)
									: null
							}
							className={activeFile?.path ? "" : "hidden"}
						>
							{activeFile?.path && isCsvFile(activeFile.path)
								? "Open in CSV app"
								: "Build a Lix App"}
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