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
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { humanId } from "../helper/human-id/human-id.ts";

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
		//console.log("create new project", fileName);
		const projectId = humanId();

		const rootHandle = await getOriginPrivateDirectory();
		const fileHandle = await rootHandle.getFileHandle(
			projectId + "___" + fileName,
			{
				create: true,
			}
		);
		const writable = await fileHandle.createWritable();
		const blob = await newLixFile();
		const newProject = await openLixInMemory({
			blob,
			providePlugins: [plugin],
		});

		await newProject.db
			.insertInto("file")
			.values({
				path: "/project_meta",
				data: new TextEncoder().encode(
					JSON.stringify({ project_id: projectId, initial_file_name: fileName })
				),
			})
			.execute();

		const file = await newProject.toBlob();
		await writable.write(file);
		await writable.close();

		setSelectedProjectPath(projectId + "___" + fileName);
		setLoading(false);
		props.setShowNewProjectDialog(false);

		navigate("/editor?project=" + projectId);
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
