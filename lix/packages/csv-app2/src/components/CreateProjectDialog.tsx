import { SetStateAction, useAtom } from "jotai";
import { useMemo, useState } from "react";
import { selectedProjectPathAtom } from "../state.ts";
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import plugin from "../csv-plugin.ts";
import { useNavigate } from "react-router-dom";

export const CreateProjectDialog = (props: {
	showNewProjectDialog: boolean;
	setShowNewProjectDialog: React.Dispatch<SetStateAction<boolean>>;
}) => {
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);
	const isValid = useMemo(() => fileName.endsWith(".lix"), [fileName]);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const navigate = useNavigate();

	const handleCreateNewProject = async () => {
		setLoading(true);
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName, {
			create: true,
		});
		const writable = await fileHandle.createWritable();
		const blob = await newLixFile();
		const newProject = await openLixInMemory({
			blob,
			providePlugins: [plugin],
		});
		const file = await newProject.toBlob();
		await writable.write(file);
		await writable.close();

		setSelectedProjectPath(fileName);
		setLoading(false);
		props.setShowNewProjectDialog(false);

		navigate("/editor");
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
						: "Enter the name of your project"
				}
				placeholder="my-website"
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				onInput={(e: any) =>
					setFileName(e.target.value ? e.target.value + ".lix" : "")
				}
			></SlInput>
			<SlButton
				loading={loading}
				disabled={!isValid}
				slot="footer"
				onClick={handleCreateNewProject}
			>
				Create Project
			</SlButton>
		</SlDialog>
	);
};
