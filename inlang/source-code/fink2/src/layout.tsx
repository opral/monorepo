/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAtom } from "jotai";
import {
	authorNameAtom,
	forceReloadProjectAtom,
	projectAtom,
	selectedProjectPathAtom,
	withPollingAtom,
} from "./state.ts";
import { SetStateAction, useEffect, useMemo, useState } from "react";
import { loadProjectInMemory, newProject, merge } from "@inlang/sdk2";
import {
	SlInput,
	SlButton,
	SlDropdown,
	SlMenu,
	SlMenuItem,
	SlDialog,
} from "@shoelace-style/shoelace/dist/react";
import { SlSelectEvent } from "@shoelace-style/shoelace";
import SubNavigation from "./components/SubNavigation.tsx";
import { handleDownload } from "./helper/utils.ts";
import Footer, { getFinkResourcesLinks } from "./components/Footer.tsx";
import { getOriginPrivateDirectory } from "native-file-system-adapter";

export default function Layout(props: { children: React.ReactNode }) {
	const [, setWithPolling] = useAtom(withPollingAtom);
	useEffect(() => {
		const interval = setInterval(() => {
			setWithPolling(Date.now());
			// put it down to 500 ms to show seamless loading
		}, 500);
		return () => clearInterval(interval);
	});

	const [authorName] = useAtom(authorNameAtom);
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [showAuthorDialog, setShowAuthorDialog] = useState(false);

	useEffect(() => {
		if (selectedProjectPath && !authorName) {
			setShowAuthorDialog(true);
		}
	}, [authorName, project?.lix.currentAuthor, selectedProjectPath]);

	useEffect(() => {
		if (authorName && project?.lix.currentAuthor.get() !== authorName) {
			project?.lix.currentAuthor.set(authorName);
		}
	}, [authorName, project?.lix.currentAuthor]);

	return (
		<>
			<div className="w-full min-h-screen bg-zinc-50">
				<div className="bg-white border-b border-zinc-200">
					<Grid>
						<MenuBar />
						<SubNavigation />
					</Grid>
				</div>
				{props.children}
				<UserAuthDialog
					showAuthorDialog={showAuthorDialog}
					setShowAuthorDialog={setShowAuthorDialog}
				/>
			</div>
			<Footer />
		</>
	);
}

export const Grid = (props: { children: React.ReactNode }) => {
	return <div className="max-w-7xl mx-auto px-4">{props.children}</div>;
};

const MenuBar = () => {
	return (
		<>
			<div className="relative flex gap-2 mb-4 pt-3 justify-between items-center">
				<div className="flex gap-4 items-center">
					<AppMenu />
					<p className="text-zinc-300 text-[16px]!">{"/"}</p>
					<SelectProject />
				</div>

				<div className="flex gap-[4px]">
					<HelpMenu />
					<DownloadButton />
					<MergeButton />
				</div>
			</div>
		</>
	);
};

const UserAuthDialog = (props: {
	showAuthorDialog: boolean;
	setShowAuthorDialog: (value: boolean) => void;
}) => {
	const [author, setAuthor] = useState("");
	const [, setAuthorName] = useAtom(authorNameAtom);

	const handleSetAuthor = async () => {
		setAuthorName(author);
		props.setShowAuthorDialog(false);
	};

	return (
		<SlDialog
			open={props.showAuthorDialog}
			onSlRequestClose={() => props.setShowAuthorDialog(false)}
			noHeader
		>
			<h2 className="text-lg font-medium pb-2">Set author information</h2>
			<p className="text-sm leading-[1.5]! max-w-[400px] pb-4 text-zinc-500">
				Your author name is appended to your changes and is visible in the
				project history.
			</p>
			<img
				src="/setAuthor.png"
				alt="set author image"
				className="rounded-lg pb-8"
			/>
			<SlInput
				label="Username"
				placeholder="Max Mustermann"
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				onInput={(e: any) => setAuthor(e.target.value)}
			></SlInput>
			<SlButton
				variant="primary"
				slot="footer"
				onClick={handleSetAuthor}
				className="w-full"
			>
				Save
			</SlButton>
		</SlDialog>
	);
};

const SelectProject = () => {
	const [selectedProjectPath, setSelectedProjectPath] = useAtom(
		selectedProjectPathAtom
	);
	const [existingProjects, setExistingProjects] = useState<string[]>([]);

	const getProjects = async () => {
		const projects: string[] = [];
		const opfsRoot = await navigator.storage.getDirectory();
		// @ts-expect-error - TS doesn't know about the keys method
		for await (const name of opfsRoot.keys()) {
			if (name.endsWith(".inlang")) {
				projects.push(name);
			}
		}
		return projects;
	};

	const handleSetExistingProjects = async () => {
		setExistingProjects(await getProjects());
	};

	useEffect(() => {
		handleSetExistingProjects();
	}, [selectedProjectPath]);

	return (
		<div className="flex items-center gap-1">
			{selectedProjectPath ? (
				<>
					<p className="text-[16px]">
						{selectedProjectPath?.replace(".inlang", "")}
					</p>
					<SlDropdown
						onSlShow={async () => {
							const projects = await getProjects();
							setExistingProjects(projects);
						}}
						placement="bottom-end"
						distance={4}
					>
						<div
							slot="trigger"
							className="h-8 px-1 hover:bg-zinc-100 flex justify-center items-center rounded-lg text-zinc-500 hover:text-zinc-950 cursor-pointer"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								viewBox="0 0 24 24"
							>
								<path
									fill="currentColor"
									d="m6 9.657l1.414 1.414l4.243-4.243l4.243 4.243l1.414-1.414L11.657 4zm0 4.786l1.414-1.414l4.243 4.243l4.243-4.243l1.414 1.414l-5.657 5.657z"
								/>
							</svg>
						</div>
						<SlMenu>
							{existingProjects.map((name, index) => (
								<SlMenuItem key={index}>
									<p
										className="py-2"
										onClick={() => setSelectedProjectPath(name)}
									>
										{name}
									</p>
								</SlMenuItem>
							))}
						</SlMenu>
					</SlDropdown>
				</>
			) : (
				<p className="text-[16px]">no project</p>
			)}
		</div>
	);
};

export const CreateProjectDialog = (props: {
	showNewProjectDialog: boolean;
	setShowNewProjectDialog: React.Dispatch<SetStateAction<boolean>>;
}) => {
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);
	const isValid = useMemo(() => fileName.endsWith(".inlang"), [fileName]);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const handleCreateNewProject = async () => {
		setLoading(true);

		const rootHandle = await getOriginPrivateDirectory();
		const fileHandle = await rootHandle.getFileHandle(fileName, {
			create: true,
		});
		const writable = await fileHandle.createWritable();
		const file = await newProject();
		await writable.write(file);
		await writable.close();
		setLoading(false);
		props.setShowNewProjectDialog(false);
		setSelectedProjectPath(fileName);
	};

	return (
		<SlDialog
			label="Create new project"
			open={props.showNewProjectDialog}
			onSlRequestClose={() => props.setShowNewProjectDialog(false)}
		>
			<SlInput
				label="Filename"
				helpText={
					fileName
						? `Create project file ${fileName}`
						: "Enter the name of your inlang file"
				}
				placeholder="my-website"
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				onInput={(e: any) =>
					setFileName(e.target.value ? e.target.value + ".inlang" : "")
				}
			></SlInput>
			<SlButton
				loading={loading}
				variant="primary"
				disabled={!isValid}
				slot="footer"
				onClick={handleCreateNewProject}
			>
				Create project
			</SlButton>
		</SlDialog>
	);
};

const HelpMenu = () => {
	return (
		<SlDropdown placement="bottom-end" className="peer">
			<button
				slot="trigger"
				className="h-8 px-2 flex justify-center items-center text-zinc-500 hover:text-zinc-950 cursor-pointer"
			>
				Need Help?
			</button>
			<SlMenu className="w-fit">
				{getFinkResourcesLinks().map((link) => (
					<>
						<SlMenuItem>
						<a href={link.href} target="_blank">
							{link.name}
						</a>
						</SlMenuItem>
						{link.name === "About the ecosystem" && (
							<div className="w-full border-b border-zinc-200 my-1" />
						)}
					</>
				))}
			</SlMenu>
		</SlDropdown>
	);
};

const DownloadButton = () => {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);

	return (
		<SlButton
			disabled={project === undefined}
			slot="trigger"
			size="small"
			variant="default"
			onClick={() => handleDownload(project, selectedProjectPath)}
		>
			<div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
				<svg
					width="20"
					viewBox="0 0 18 19"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 12.5L5.25 8.75L6.3 7.6625L8.25 9.6125V3.5H9.75V9.6125L11.7 7.6625L12.75 8.75L9 12.5ZM4.5 15.5C4.0875 15.5 3.7345 15.3533 3.441 15.0597C3.1475 14.7662 3.0005 14.413 3 14V11.75H4.5V14H13.5V11.75H15V14C15 14.4125 14.8533 14.7657 14.5597 15.0597C14.2662 15.3538 13.913 15.5005 13.5 15.5H4.5Z"
						fill="currentColor"
					/>
				</svg>
				Download
			</div>
		</SlButton>
	);
};

const MergeButton = () => {
	const [project] = useAtom(projectAtom);
	const [selectedProjectPath] = useAtom(selectedProjectPathAtom);
	const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);

	const handleImport = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".inlang";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = async () => {
					const blob = new Blob([reader.result as ArrayBuffer]);
					const incoming = await loadProjectInMemory({ blob });
					// TODO remove workaround for https://github.com/opral/lix-sdk/issues/47
					const opfsRoot = await navigator.storage.getDirectory();
					const fileHandle = await opfsRoot.getFileHandle(
						selectedProjectPath!,
						{
							create: true,
						}
					);
					const writable = await fileHandle.createWritable();
					await merge({
						sourceLix: incoming.lix,
						targetLix: project!.lix,
					});
					const mergedBlob = await project!.toBlob();
					await writable.write(mergedBlob);
					await writable.close();
					setForceReloadProject(Date.now());
				};

				reader.readAsArrayBuffer(file);
			}
		};
		input.click();
	};

	return (
		<SlButton
			disabled={project === undefined}
			slot="trigger"
			size="small"
			variant="default"
			onClick={() => handleImport()}
		>
			<div className="text-[13px]! h-full aspect-squere flex items-center justify-center -mx-[3px] -ml-[4px] gap-[5px]">
				<svg
					width="20"
					viewBox="0 0 18 19"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M13.1925 2.75L14.25 3.8075L10.6275 7.43C10.065 7.9925 9.75 8.7575 9.75 9.5525V13.3775L10.9425 12.1925L12 13.25L9 16.25L6 13.25L7.0575 12.1925L8.25 13.3775V9.5525C8.25 8.7575 7.935 7.9925 7.3725 7.43L3.75 3.8075L4.8075 2.75L9 6.9425L13.1925 2.75Z"
						fill="currentColor"
					/>
				</svg>
				Merge
			</div>
		</SlButton>
	);
};

const AppMenu = () => {
	const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const handleOpen = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".inlang";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = async () => {
					const blob = new Blob([reader.result as ArrayBuffer]);
					const opfsRoot = await navigator.storage.getDirectory();
					const fileHandle = await opfsRoot.getFileHandle(file.name, {
						create: true,
					});
					const writable = await fileHandle.createWritable();
					await writable.write(blob);
					await writable.close();
					setSelectedProjectPath(file!.name);
				};
				reader.readAsArrayBuffer(file);
			}
		};
		input.click();
	};

	const handleSelect = async (event: SlSelectEvent) => {
		switch (event.detail.item.value) {
			case "new":
				setShowNewProjectDialog(true);
				break;
			case "open":
				handleOpen();
				break;
			default:
				break;
		}
	};

	return (
		<>
			<SlDropdown distance={8}>
				<div
					slot="trigger"
					className="flex justify-center items-center w-8 h-8 text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer -ml-[2px]"
				>
					{/* Burger menu icon */}
					<svg
						className="-mx-2 mt-0.5"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 -960 960 960"
						width="20px"
						fill="currentColor"
					>
						<path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
					</svg>
				</div>
				<SlMenu onSlSelect={handleSelect}>
					<SlMenuItem value="new">New project</SlMenuItem>
					<SlMenuItem value="open">Open file</SlMenuItem>
				</SlMenu>
			</SlDropdown>
			<CreateProjectDialog
				showNewProjectDialog={showNewProjectDialog}
				setShowNewProjectDialog={setShowNewProjectDialog}
			/>
		</>
	);
};
