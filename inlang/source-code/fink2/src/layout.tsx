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
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import { loadProjectInMemory, newProject } from "@inlang/sdk2";
import {
	SlInput,
	SlButton,
	SlDropdown,
	SlMenu,
	SlMenuItem,
} from "@shoelace-style/shoelace/dist/react";
import { Link } from "react-router-dom";
import { merge } from "../../../../lix/packages/sdk/dist/merge/merge.js";
import { SlSelectEvent } from "@shoelace-style/shoelace";
import SubNavigation from "./components/SubNavigation.tsx";
import { handleDownload } from "./helper/utils.ts";
import Footer from "./components/Footer.tsx";

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
	}, [authorName, project?.lix.currentAuthor])

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
					<DownloadButton />
					<MergeButton />
					<SettingsButton />
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
			<div className="w-8 h-8 flex justify-center items-center">
				<svg
					width="20"
					viewBox="0 0 18 19"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M10.4023 2H4.80234C4.43104 2 4.07495 2.15804 3.81239 2.43934C3.54984 2.72064 3.40234 3.10218 3.40234 3.5V15.5C3.40234 15.8978 3.54984 16.2794 3.81239 16.5607C4.07495 16.842 4.43104 17 4.80234 17H13.2023C13.5736 17 13.9297 16.842 14.1923 16.5607C14.4548 16.2794 14.6023 15.8978 14.6023 15.5V6.5L10.4023 2ZM13.2023 15.5H4.80234V3.5H9.70234V7.25H13.2023V15.5Z"
						fill="currentColor"
					/>
				</svg>
			</div>
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
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
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

const SettingsButton = () => {
	const [project] = useAtom(projectAtom);

	return (
		<Link to="/settings">
			<SlButton
				disabled={project === undefined}
				slot="trigger"
				size="small"
				variant="default"
			>
				<div className="h-full aspect-squere flex items-center justify-center -mx-[3px]">
					<svg
						width="18"
						viewBox="0 0 16 19"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M8.00059 6.91248C7.31522 6.91248 6.65792 7.18474 6.17329 7.66937C5.68865 8.154 5.41639 8.8113 5.41639 9.49667C5.41639 10.182 5.68865 10.8393 6.17329 11.324C6.65792 11.8086 7.31522 12.0809 8.00059 12.0809C8.68596 12.0809 9.34326 11.8086 9.82789 11.324C10.3125 10.8393 10.5848 10.182 10.5848 9.49667C10.5848 8.8113 10.3125 8.154 9.82789 7.66937C9.34326 7.18474 8.68596 6.91248 8.00059 6.91248ZM6.70849 9.49667C6.70849 9.15399 6.84462 8.82534 7.08694 8.58302C7.32925 8.34071 7.6579 8.20457 8.00059 8.20457C8.34327 8.20457 8.67192 8.34071 8.91424 8.58302C9.15656 8.82534 9.29269 9.15399 9.29269 9.49667C9.29269 9.83936 9.15656 10.168 8.91424 10.4103C8.67192 10.6526 8.34327 10.7888 8.00059 10.7888C7.6579 10.7888 7.32925 10.6526 7.08694 10.4103C6.84462 10.168 6.70849 9.83936 6.70849 9.49667ZM11.3833 4.84253C11.1451 4.8856 10.8995 4.83277 10.7 4.69553C10.5006 4.5583 10.3635 4.3478 10.3186 4.10992L9.98267 2.2803C9.96685 2.19092 9.9245 2.10837 9.86112 2.04339C9.79775 1.9784 9.71629 1.93399 9.62734 1.91593C8.55422 1.68948 7.44566 1.68948 6.37254 1.91593C6.28359 1.93399 6.20213 1.9784 6.13876 2.04339C6.07539 2.10837 6.03304 2.19092 6.01722 2.2803L5.68256 4.10992C5.65813 4.24022 5.60574 4.36369 5.529 4.47181C5.45226 4.57992 5.353 4.67012 5.23806 4.73619C5.12311 4.80226 4.99521 4.84263 4.86316 4.85452C4.73112 4.86641 4.59806 4.84954 4.47316 4.80506L2.7172 4.17969C2.63189 4.15002 2.53979 4.14583 2.45215 4.16763C2.3645 4.18942 2.28509 4.23627 2.22362 4.30244C1.48799 5.11276 0.932257 6.06965 0.59299 7.11017C0.564671 7.19619 0.562832 7.28874 0.587713 7.37582C0.612593 7.4629 0.663046 7.5405 0.732537 7.59858L2.15643 8.80152C2.19519 8.83339 2.23008 8.86828 2.26109 8.90618C2.33894 8.99733 2.39801 9.10297 2.43489 9.21702C2.47178 9.33107 2.48577 9.45129 2.47604 9.57076C2.46631 9.69023 2.43307 9.80661 2.37822 9.91319C2.32337 10.0198 2.248 10.1145 2.15643 10.1918L0.732537 11.3948C0.663046 11.4528 0.612593 11.5304 0.587713 11.6175C0.562832 11.7046 0.564671 11.7972 0.59299 11.8832C0.93264 12.9238 1.48881 13.8807 2.22491 14.6909C2.28638 14.7571 2.36579 14.8039 2.45344 14.8257C2.54109 14.8475 2.63318 14.8433 2.71849 14.8137L4.47574 14.1883C4.60063 14.1433 4.73379 14.1261 4.86599 14.1378C4.9982 14.1495 5.12627 14.1898 5.24134 14.2559C5.35641 14.3221 5.4557 14.4125 5.53234 14.5208C5.60898 14.6292 5.66112 14.7529 5.68515 14.8834L6.01851 16.713C6.0521 16.8939 6.19294 17.0386 6.37384 17.0761C7.44737 17.3028 8.55639 17.3028 9.62992 17.0761C9.71846 17.0579 9.79952 17.0136 9.86262 16.9489C9.92573 16.8842 9.96799 16.802 9.98396 16.713L10.3199 14.8834C10.3443 14.7531 10.3967 14.6297 10.4735 14.5215C10.5502 14.4134 10.6495 14.3232 10.7644 14.2572C10.8794 14.1911 11.0073 14.1507 11.1393 14.1388C11.2714 14.1269 11.4044 14.1438 11.5293 14.1883L13.2853 14.8137C13.4597 14.8757 13.6548 14.8266 13.7789 14.6909C14.5145 13.8806 15.0702 12.9237 15.4095 11.8832C15.4378 11.7972 15.4396 11.7046 15.4148 11.6175C15.3899 11.5304 15.3394 11.4528 15.2699 11.3948L13.846 10.1918C13.7447 10.1066 13.6632 10.0002 13.6073 9.88007C13.5514 9.75999 13.5224 9.62913 13.5224 9.49667C13.5224 9.36421 13.5514 9.23335 13.6073 9.11327C13.6632 8.99319 13.7447 8.88679 13.846 8.80152L15.2699 7.59858C15.3394 7.5405 15.3899 7.4629 15.4148 7.37582C15.4396 7.28874 15.4378 7.19619 15.4095 7.11017C15.0694 6.06943 14.5128 5.11252 13.7763 4.30244C13.7148 4.23627 13.6354 4.18942 13.5477 4.16763C13.4601 4.14583 13.368 4.15002 13.2827 4.17969L11.5254 4.80506C11.4784 4.82072 11.4305 4.83367 11.382 4.84383M2.82832 5.59324L4.03902 6.02351C4.34027 6.13076 4.66121 6.17134 4.97967 6.14245C5.29814 6.11356 5.60653 6.01588 5.88357 5.85618C6.1606 5.69647 6.39966 5.47853 6.58425 5.21741C6.76884 4.9563 6.89455 4.65823 6.9527 4.34378L7.1814 3.09045C7.72404 3.02125 8.27326 3.02125 8.8159 3.09045L9.0459 4.34378C9.10364 4.65844 9.2291 4.95678 9.41358 5.21814C9.59807 5.47949 9.83717 5.69761 10.1143 5.85739C10.3915 6.01717 10.7001 6.11478 11.0187 6.14347C11.3373 6.17215 11.6583 6.13122 11.9596 6.02351L13.169 5.59066C13.4998 6.02394 13.7711 6.49082 13.983 6.99129L13.0088 7.81436C12.764 8.02104 12.5672 8.27865 12.4323 8.56922C12.2973 8.85978 12.2274 9.1763 12.2274 9.49667C12.2274 9.81705 12.2973 10.1336 12.4323 10.4241C12.5672 10.7147 12.764 10.9723 13.0088 11.179L13.9843 12.002C13.7728 12.5012 13.4993 12.9718 13.1703 13.4027L11.9596 12.9711C11.6583 12.8639 11.3374 12.8233 11.0189 12.8522C10.7005 12.8811 10.3921 12.9788 10.115 13.1385C9.83799 13.2982 9.59893 13.5161 9.41434 13.7772C9.22975 14.0383 9.10404 14.3364 9.0459 14.6509L8.8159 15.9042C8.27326 15.9734 7.72404 15.9734 7.1814 15.9042L6.9527 14.6509C6.89496 14.3362 6.7695 14.0379 6.58501 13.7765C6.40052 13.5151 6.16142 13.297 5.88427 13.1372C5.60712 12.9775 5.29854 12.8799 4.97992 12.8512C4.6613 12.8225 4.34025 12.8634 4.03902 12.9711L2.8322 13.4027C2.50316 12.9718 2.22967 12.5012 2.01817 12.002L2.99242 11.1777C3.23699 10.971 3.43353 10.7135 3.56835 10.423C3.70317 10.1326 3.77301 9.81623 3.77301 9.49603C3.77301 9.17582 3.70317 8.85947 3.56835 8.56902C3.43353 8.27858 3.23699 8.02104 2.99242 7.81436L2.01688 6.99129C2.23051 6.49082 2.50185 6.02394 2.8309 5.59066"
							fill="currentColor"
						/>
					</svg>
				</div>
			</SlButton>
		</Link>
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