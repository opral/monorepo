import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import { useAtom } from "jotai";
import { projectAtom, selectedProjectPathAtom } from "./state.ts";
import { useEffect, useMemo, useState } from "react";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import { loadProjectFromOpfs, newProject } from "@inlang/sdk2";
import {
	SlDropdown,
	SlInput,
	SlMenu,
	SlMenuItem,
} from "@shoelace-style/shoelace/dist/react";
import { poll } from "./poll.ts";

export default function Layout(props: { children: React.ReactNode }) {
	return (
		<div className="p-6 space-y-4">
			<MenuBar />
			<hr></hr>
			{props.children}
		</div>
	);
}

const MenuBar = () => {
	return (
		<>
			<div className="flex gap-2">
				<CreateNewProject />
				<SelectProject />
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

	useEffect(() => {
		poll({
			every: 2000,
			fn: async () => {
				const result: string[] = [];
				const opfsRoot = await navigator.storage.getDirectory();
				// @ts-expect-error - TS doesn't know about the keys method
				for await (const name of opfsRoot.keys()) {
					if (name.endsWith(".inlang")) {
						result.push(name);
					}
				}
				return result;
			},
			cb: (value) => setExistingProjects(value),
		});
	}, []);

	return (
		<div>
			<SlDropdown>
				<SlButton slot="trigger" caret size="small">
					{selectedProjectPath ? selectedProjectPath : "Select project"}
				</SlButton>
				<SlMenu>
					{existingProjects.map((name) => (
						<SlMenuItem
							type="checkbox"
							key={name}
							checked={name === selectedProjectPath}
							onClick={async () => {
								setSelectedProjectPath(name);
								const project = await loadProjectFromOpfs({ path: name });
								setProject(project);
							}}
						>
							{name}
						</SlMenuItem>
					))}
				</SlMenu>
			</SlDropdown>
		</div>
	);
};

const CreateNewProject = () => {
	const [showDialog, setShowDialog] = useState(false);
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);

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
	};

	return (
		<>
			<SlButton
				size="small"
				onClick={() => {
					setShowDialog(true);
				}}
			>
				Create new project
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
