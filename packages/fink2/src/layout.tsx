/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAtom } from "jotai";
import { projectAtom, selectedProjectPathAtom, withPollingAtom } from "./state.ts";
import { useEffect, useMemo, useState } from "react";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import { newProject } from "@inlang/sdk2";
import {
	SlInput,
	SlButton,
	SlOption,
	SlSelect,
} from "@shoelace-style/shoelace/dist/react";
import { Link } from "react-router-dom";
import ModeSwitcher from "./components/ModeSwitcher.tsx";

export default function Layout(props: { children: React.ReactNode }) {
	const [, setWithPolling] = useAtom(withPollingAtom);
	useEffect(() => {
		const interval = setInterval(() => {
			setWithPolling(Date.now());
		}, 1000);
		return () => clearInterval(interval);
	});

	return (
		<div className="p-6 max-w-7xl mx-auto px-4 h-full">
			<MenuBar />
			{props.children}
		</div>
	);
}

const MenuBar = () => {
	return (
		<>
			<div className="relative flex gap-2 mb-12 justify-between items-center">
				<div className="absolute left-[50%] -translate-x-[50%]">
					<ModeSwitcher />
				</div>
				<SelectProject />

				<div>
					<CreateNewProject size="small" />
					<SettingsButton />
				</div>
			</div>
		</>
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

	return (
		<>
			<SlSelect
				disabled={selectedProjectPath === undefined}
				size="small"
				placeholder={
					selectedProjectPath ? selectedProjectPath : "Select project"
				}
				onSlChange={(e: any) => {
					setSelectedProjectPath(e.target.value);
				}}
				onSlShow={async () => {
					const projects = await getProjects();
					setExistingProjects(projects);
				}}
			>
				{existingProjects.map((name) => (
					<SlOption key={name} value={name}>
						{name}
					</SlOption>
				))}
			</SlSelect>
		</>
	);
};

export const CreateNewProject = (props: { size: "small" | "large" }) => {
	const [showDialog, setShowDialog] = useState(false);
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);

	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const isValid = useMemo(() => fileName.endsWith(".inlang"), [fileName]);

	const handleCreateNewProject = async () => {
		setLoading(true);
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
		const writable = await fileHandle.createWritable();
		const file = await newProject();
		await writable.write(file);
		await writable.close();
		setLoading(false);
		setShowDialog(false);
		setSelectedProjectPath(fileName);
	};

	return (
		<>
			{props.size === "small" ? (
				<SlButton
					size="small"
					variant="default"
					onClick={() => {
						setShowDialog(true);
					}}
				>
					New project
				</SlButton>
			) : (
				<SlButton
					size="medium"
					variant="primary"
					onClick={() => {
						setShowDialog(true);
					}}
				>
					<svg
						//@ts-ignore
						slot="prefix"
						xmlns="http://www.w3.org/2000/svg"
						width="20px"
						height="20px"
						viewBox="0 0 24 24"
						className="-mr-1"
					>
						<path
							fill="currentColor"
							d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"
						/>
					</svg>
					Create project
				</SlButton>
			)}
			<SlDialog
				label="Create new project"
				open={showDialog}
				onSlRequestClose={() => setShowDialog(false)}
			>
				<SlInput
					label="Filename"
					helpText={fileName ? `Create project file ${fileName}` : "Enter the name of your inlang file"}
					placeholder="my-website"
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onInput={(e: any) => setFileName(e.target.value ? e.target.value + ".inlang" : "")}
				></SlInput>
				<div className="mt-6 p-4 text-slate-600 bg-slate-200 border border-slate-600 rounded text-[14px]!">
					<span className="font-semibold">Info:</span> Demo data will be imported automatically until we can import your own data.
				</div>
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
		</>
	);
};

const SettingsButton = () => {
	const [project] = useAtom(projectAtom);

	return (
		<Link to="/settings">
			<SlButton
				disabled={project === undefined}
				slot="trigger" size="small" variant="default"
			>
				Settings
			</SlButton>
		</Link>
	);
};
