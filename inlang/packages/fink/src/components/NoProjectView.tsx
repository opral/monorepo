import { useState } from "react";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../state.ts";
import Dropzone from "./Dropzone.tsx";
import CreateProjectDialog from "./layout/CreateProjectDialog.tsx";

const NoProjectView = () => {
	const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const handleOpen = (files: File[]) => {
		const file = files[0];
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

	return (
		<div className="flex flex-col items-center justify-center h-[full] gap-8 mt-32">
			<Dropzone handleOpen={handleOpen} />
			<div className="relative h-[20px] w-[340px] flex justify-center">
				<div className="absolute w-[340px] top-[50%] -translate-y-[50%] h-[1px] bg-zinc-200" />
				<p className="relative text-zinc-600 bg-zinc-50 px-3 z-5 w-fit">or</p>
			</div>

			<SlButton
				size="medium"
				variant="primary"
				onClick={() => setShowNewProjectDialog(true)}
				className="w-[340px]"
			>
				Create project
			</SlButton>
			<CreateProjectDialog
				showNewProjectDialog={showNewProjectDialog}
				setShowNewProjectDialog={setShowNewProjectDialog}
			/>
		</div>
	);
};

export default NoProjectView;
