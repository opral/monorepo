/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAtom } from "jotai";
import { projectAtom, selectedProjectPathAtom } from "./state.ts";
import { useEffect, useMemo, useState } from "react";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import { loadProjectInMemory, newProject } from "@inlang/sdk2";
import {
	SlInput,
	SlButton,
	SlOption,
	SlSelect,
} from "@shoelace-style/shoelace/dist/react";
import ImportComponent from "./components/Import.tsx";
import { Link } from "react-router-dom";
import ModeSwitcher from "./components/ModeSwitcher.tsx";

export default function Layout(props: { children: React.ReactNode }) {
	const [project] = useAtom(projectAtom);
	const [numUncommittedChanges, setNumUncommittedChanges] = useState(0);
	const [numCommittedChanges, setNumCommittedChanges] = useState(0);
	const [numCommits, setNumCommits] = useState(0);

	useEffect(() => {
		setInterval(async () => {
			const uncommittedChanges = await project?.lix.db
				.selectFrom("change")
				.selectAll()
				.where("commit_id", "is", null)
				.execute();
			const committedChanges = await project?.lix.db
				.selectFrom("change")
				.selectAll()
				.where("commit_id", "is not", null)
				.execute();
			const numCommits = await project?.lix.db
				.selectFrom("commit")
				.selectAll()
				.execute();
			if (uncommittedChanges) {
				setNumUncommittedChanges(uncommittedChanges.length);
			}
			if (committedChanges) {
				setNumCommittedChanges(committedChanges.length);
			}
			if (numCommits) {
				setNumCommits(numCommits.length);
			}
		}, 1500);
	});

	return (
		<div className="p-6 max-w-7xl mx-auto px-4 h-full">
			<MenuBar />
			{window && window.location.pathname === "/changes" && (
				<>
					<hr></hr>
					<div className="flex gap-2">
						<p>Outstanding changes: {numUncommittedChanges}</p>
						<p>Committed changes: {numCommittedChanges}</p>
						<p>Commits: {numCommits}</p>
						<SlButton
							onClick={async () => {
								console.log("executing commit");
								await project?.lix.commit({
									userId: "Samuel",
									description:
										"Nils, extra wieder ne nachtschicht für dich geschoben",
								});
							}}
						>
							commit changes
						</SlButton>
					</div>
					<hr></hr>
				</>
			)}
			{props.children}
		</div>
	);
}

const MenuBar = () => {
	return (
		<>
			<div className="flex gap-2 mb-12 justify-between">
				<SelectProject />
				<ModeSwitcher />
				<div>
					<CreateNewProject />
					<ImportComponent />
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
	const [, setProject] = useAtom(projectAtom);
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
				size="small"
				placeholder={
					selectedProjectPath ? selectedProjectPath : "Select project"
				}
				onSlChange={async (e: any) => {
					setSelectedProjectPath(e.target.value);
					const opfsRoot = await navigator.storage.getDirectory();
					const fileHandle = await opfsRoot.getFileHandle(e.target.value);
					const file = await fileHandle.getFile();
					const project = await loadProjectInMemory({ blob: file });
					setProject(project);
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

const CreateNewProject = () => {
	const [showDialog, setShowDialog] = useState(false);
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);

	const [, setProject] = useAtom(projectAtom);
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
		const project = await loadProjectInMemory({ blob: file });
		setProject(project);
		setSelectedProjectPath(fileName);
	};

	return (
		<>
			<SlButton
				size="small"
				onClick={() => {
					setShowDialog(true);
				}}
			>
				New project
			</SlButton>
			<SlDialog
				label="Create new project"
				open={showDialog}
				onSlRequestClose={() => setShowDialog(false)}
			>
				<SlInput
					label="Filename"
					helpText="The file name must end with .inlang"
					placeholder="happy-elephant.inlang"
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onInput={(e: any) => setFileName(e.target.value)}
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
		</>
	);
};

const SettingsButton = () => {
	// check if window.location.pathname === "/settings"

	return (
		<Link to="/settings">
			<SlButton slot="trigger" size="small" variant="default">
				Settings
			</SlButton>
		</Link>
	);
};
