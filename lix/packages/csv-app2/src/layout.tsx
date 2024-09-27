/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAtom } from "jotai";
import { useEffect } from "react";
import {
	authorNameAtom,
	isProjectSyncedAtom,
	projectAtom,
	selectedProjectPathAtom,
	withPollingAtom,
} from "./state.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	SlAlert,
	SlAvatar,
	SlButton,
	SlTag,
	SlTooltip,
} from "@shoelace-style/shoelace/dist/react";
import SubNavigation from "./components/SubNavigation.tsx";

export default function Layout(props: {
	children: React.ReactNode;
	setShowImportDialog: (value: boolean) => void;
}) {
	const [, setWithPolling] = useAtom(withPollingAtom);
	const [selectedProjectPath, setSelectedProjectPath] = useAtom(
		selectedProjectPathAtom
	);
	const [authorName] = useAtom(authorNameAtom);
	const [project] = useAtom(projectAtom);
	const [isProjectSynced] = useAtom(isProjectSyncedAtom);

	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const handleShare = async () => {
		if (project === undefined) {
			return;
		}
		const { project_id } = JSON.parse(
			new TextDecoder().decode(
				(
					await project!.db
						.selectFrom("file")
						.where("path", "=", "/project_meta")
						.select("data")
						.executeTakeFirstOrThrow()
				).data
			)
		);

		const file = await project.toBlob();
		await fetch("https://monorepo-6hl2.onrender.com/lix-file/" + project_id, {
			method: "POST",
			headers: {
				"Content-Type": "application/octet-stream",
			},
			body: file,
		});
	};

	const handleDownload = async () => {
		const file = await project?.db
			.selectFrom("file")
			.selectAll()
			.where("path", "=", "/data.csv")
			.executeTakeFirst();
		if (!file) return;

		const blob = new Blob([file.data]);
		if (!blob) return;

		//create download link
		const blobUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = blobUrl;
		link.download = selectedProjectPath!.replace("lix", "csv");
		document.body.appendChild(link);
		link.dispatchEvent(
			new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				view: window,
			})
		);
		document.body.removeChild(link);
	};

	const handleSetSearchParams = async () => {
		if (selectedProjectPath && project) {
			const file = await project.db
				.selectFrom("file")
				.where("path", "=", "/project_meta")
				.select("data")
				.executeTakeFirst();

			//console.log("handle", file);

			if (file) {
				const projectMeta = JSON.parse(new TextDecoder().decode(file.data));
				if (projectMeta) {
					setSearchParams(
						new URLSearchParams({ project: projectMeta.project_id })
					);
				}
			}
		}
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setWithPolling(Date.now());
			// put it down to 500 ms to show seamless loading
		}, 500);
		return () => clearInterval(interval);
	});

	useEffect(() => {
		if (selectedProjectPath && project) {
			handleSetSearchParams();
		}
	}, [selectedProjectPath, project]);

	useEffect(() => {
		if (searchParams.get("project") && !selectedProjectPath) {
			const project_id = searchParams.get("project");
			setSelectedProjectPath(project_id + "___" + "test.lix");
		}
	});

	return (
		<div className="w-full min-h-screen bg-zinc-50 relative">
			<div className="w-full border-b border-zinc-200 bg-white relative z-90 -mb-[1px]">
				<div className="w-full flex items-center justify-between px-3 min-h-[54px] gap-1">
					<div className="flex items-center gap-1">
						<div
							className="flex justify-center items-center text-zinc-500 w-9 h-9 hover:bg-zinc-100 hover:text-zinc-950 rounded-lg cursor-pointer"
							onClick={() => navigate("/")}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24px"
								height="24px"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="M21 20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.49a1 1 0 0 1 .386-.79l8-6.223a1 1 0 0 1 1.228 0l8 6.223a1 1 0 0 1 .386.79zm-2-1V9.978l-7-5.444l-7 5.444V19z"
								/>
							</svg>
						</div>

						<p className="font-medium opacity-30">/</p>
						<div className="flex justify-center items-center text-zinc-950 h-9 rounded-lg px-2">
							<h1 className="font-medium">
								{selectedProjectPath?.split("___")[1]}
							</h1>
						</div>
					</div>
					<div className="mr-1 flex items-center gap-1.5">
						<SlTooltip content="Discover lix change control">
							<SlButton
								size="small"
								variant="text"
								className="md:hidden"
								onClick={() => navigate("https://lix.opral.com/")}
							>
								SDK
							</SlButton>
						</SlTooltip>
						<SlTooltip content="Discover lix change control">
							<SlButton
								size="small"
								variant="text"
								className="hidden md:block"
								onClick={() => navigate("https://lix.opral.com/")}
							>
								Discover SDK
							</SlButton>
						</SlTooltip>
						{
							// authorName === "Nils" &&
							!isProjectSynced && (
								<SlTooltip content="Press to share with your team">
									<SlButton
										size="small"
										variant="default"
										onClick={() => handleShare()}
									>
										Share
									</SlButton>
								</SlTooltip>
							)
						}
						{isProjectSynced && (
							<SlTag>
								<div className="flex gap-2 items-center">
									<div className="w-2 h-2 rounded-full bg-blue-500" />
									synced
								</div>
							</SlTag>
						)}
						<SlTooltip content="Download .csv">
							<SlButton
								size="small"
								variant="default"
								onClick={() => handleDownload()}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 16 16"
									style={{ margin: "0 -1px" }}
									// @ts-ignore
									slot="prefix"
								>
									<path
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.5"
										d="M3.25 13.25h9m-8.5-6.5l4 3.5l4-3.5m-4-5v8.5"
									/>
								</svg>
							</SlButton>
						</SlTooltip>
						<SlButton
							size="small"
							variant="primary"
							onClick={() => props.setShowImportDialog(true)}
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							style={{ "--sl-button-font-size-small": "13px" } as any}
						>
							Import .csv
						</SlButton>
						<SlTooltip content={authorName}>
							<SlAvatar initials={authorName?.slice(0, 2)} />
						</SlTooltip>
					</div>
				</div>
				<div className="w-full -mt-2 px-3">
					<SubNavigation />
				</div>
			</div>

			{props.children}

			<div className="absolute bottom-[24px] right-[24px] z-90">
				<SlAlert
					className="copied-link-alert"
					variant="primary"
					duration={3000}
					closable
				>
					<svg
						slot="icon"
						xmlns="http://www.w3.org/2000/svg"
						width="20px"
						height="20px"
						viewBox="0 0 16 16"
					>
						<g fill="currentColor">
							<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
							<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z" />
						</g>
					</svg>
					Copied link to clipboard
				</SlAlert>
			</div>
		</div>
	);
}

// export const Grid = (props: { children: React.ReactNode }) => {
// 	return <div className="max-w-7xl mx-auto px-4">{props.children}</div>;
// };

// const MenuBar = () => {
// 	return (
// 		<>
// 			<div className="relative flex gap-2 mb-4 pt-3 justify-between items-center">
// 				<div className="flex gap-4 items-center">
// 					<AppMenu />
// 					<p className="text-zinc-300 text-[16px]!">{"/"}</p>
// 					<SelectProject />
// 				</div>

// 				<div className="flex gap-[4px]">
// 					<DownloadButton />
// 					<MergeButton />
// 					<SettingsButton />
// 				</div>
// 			</div>
// 		</>
// 	);
// };

// const DownloadButton = () => {
// 	const [project] = useAtom(projectAtom);
// 	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);

// 	return (
// 		<SlButton
// 			disabled={project === undefined}
// 			slot="trigger"
// 			size="small"
// 			variant="default"
// 			onClick={() => handleDownload(project, selectedProjectPath)}
// 		>
// 			<div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
// 				<svg
// 					width="20"
// 					viewBox="0 0 18 19"
// 					fill="none"
// 					xmlns="http://www.w3.org/2000/svg"
// 				>
// 					<path
// 						d="M9 12.5L5.25 8.75L6.3 7.6625L8.25 9.6125V3.5H9.75V9.6125L11.7 7.6625L12.75 8.75L9 12.5ZM4.5 15.5C4.0875 15.5 3.7345 15.3533 3.441 15.0597C3.1475 14.7662 3.0005 14.413 3 14V11.75H4.5V14H13.5V11.75H15V14C15 14.4125 14.8533 14.7657 14.5597 15.0597C14.2662 15.3538 13.913 15.5005 13.5 15.5H4.5Z"
// 						fill="currentColor"
// 					/>
// 				</svg>
// 				Download
// 			</div>
// 		</SlButton>
// 	);
// };

// const MergeButton = () => {
// 	const [project] = useAtom(projectAtom);
// 	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
// 	const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);

// 	const handleImport = async () => {
// 		const input = document.createElement("input");
// 		input.type = "file";
// 		input.accept = ".inlang";
// 		input.onchange = async (e) => {
// 			const file = (e.target as HTMLInputElement).files?.[0];
// 			if (file) {
// 				const reader = new FileReader();
// 				reader.onload = async () => {
// 					const blob = new Blob([reader.result as ArrayBuffer]);
// 					const incoming = await loadProjectInMemory({ blob });
// 					// TODO remove workaround for https://github.com/opral/lix-sdk/issues/47
// 					const opfsRoot = await navigator.storage.getDirectory();
// 					const fileHandle = await opfsRoot.getFileHandle(
// 						selectedProjectPath!,
// 						{
// 							create: true,
// 						}
// 					);
// 					const writable = await fileHandle.createWritable();
// 					await merge({
// 						sourceLix: incoming.lix,
// 						targetLix: project!.lix,
// 					});
// 					const mergedBlob = await project!.toBlob();
// 					await writable.write(mergedBlob);
// 					await writable.close();
// 					setForceReloadProject(Date.now());
// 				};

// 				reader.readAsArrayBuffer(file);
// 			}
// 		};
// 		input.click();
// 	};

// 	return (
// 		<SlButton
// 			disabled={project === undefined}
// 			slot="trigger"
// 			size="small"
// 			variant="default"
// 			onClick={() => handleImport()}
// 		>
// 			<div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
// 				<svg
// 					width="20"
// 					viewBox="0 0 18 19"
// 					fill="none"
// 					xmlns="http://www.w3.org/2000/svg"
// 				>
// 					<path
// 						d="M13.1925 2.75L14.25 3.8075L10.6275 7.43C10.065 7.9925 9.75 8.7575 9.75 9.5525V13.3775L10.9425 12.1925L12 13.25L9 16.25L6 13.25L7.0575 12.1925L8.25 13.3775V9.5525C8.25 8.7575 7.935 7.9925 7.3725 7.43L3.75 3.8075L4.8075 2.75L9 6.9425L13.1925 2.75Z"
// 						fill="currentColor"
// 					/>
// 				</svg>
// 				Merge
// 			</div>
// 		</SlButton>
// 	);
// };

// const AppMenu = () => {
// 	const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
// 	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

// 	const handleOpen = async () => {
// 		const input = document.createElement("input");
// 		input.type = "file";
// 		input.accept = ".inlang";
// 		input.onchange = async (e) => {
// 			const file = (e.target as HTMLInputElement).files?.[0];
// 			if (file) {
// 				const reader = new FileReader();
// 				reader.onload = async () => {
// 					const blob = new Blob([reader.result as ArrayBuffer]);
// 					const opfsRoot = await navigator.storage.getDirectory();
// 					const fileHandle = await opfsRoot.getFileHandle(file.name, {
// 						create: true,
// 					});
// 					const writable = await fileHandle.createWritable();
// 					await writable.write(blob);
// 					await writable.close();
// 					setSelectedProjectPath(file!.name);
// 				};
// 				reader.readAsArrayBuffer(file);
// 			}
// 		};
// 		input.click();
// 	};

// 	const handleSelect = async (event: SlSelectEvent) => {
// 		switch (event.detail.item.value) {
// 			case "new":
// 				setShowNewProjectDialog(true);
// 				break;
// 			case "open":
// 				handleOpen();
// 				break;
// 			default:
// 				break;
// 		}
// 	};

// 	return (
// 		<>
// 			<SlDropdown distance={8}>
// 				<div
// 					slot="trigger"
// 					className="flex justify-center items-center w-8 h-8 text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer -ml-[2px]"
// 				>
// 					{/* Burger menu icon */}
// 					<svg
// 						className="-mx-2 mt-0.5"
// 						xmlns="http://www.w3.org/2000/svg"
// 						viewBox="0 -960 960 960"
// 						width="20px"
// 						fill="currentColor"
// 					>
// 						<path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
// 					</svg>
// 				</div>
// 				<SlMenu onSlSelect={handleSelect}>
// 					<SlMenuItem value="new">New project</SlMenuItem>
// 					<SlMenuItem value="open">Open file</SlMenuItem>
// 				</SlMenu>
// 			</SlDropdown>
// 			<CreateProjectDialog
// 				showNewProjectDialog={showNewProjectDialog}
// 				setShowNewProjectDialog={setShowNewProjectDialog}
// 			/>
// 		</>
// 	);
// };
