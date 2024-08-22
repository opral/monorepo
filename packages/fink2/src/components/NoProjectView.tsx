import { useState } from "react";
import { CreateProjectDialog } from "../layout.tsx";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../state.ts";

const NoProjectView = () => {
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

	return (
		<div className="flex flex-col items-center justify-center h-[full] gap-8 mt-32">
			<div
				className="border border-zinc-300 bg-zinc-50 flex flex-col items-center w-[340px] rounded-xl px-4 py-12 gap-3 border-dashed cursor-pointer hover:border-zinc-600 hover:bg-zinc-100"
				onClick={() => handleOpen()}
			>
				<div className="bg-zinc-200 h-12 w-12 rounded-xl text-zinc-500 flex justify-center items-center">
					<svg
						width="32"
						viewBox="0 0 43 46"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M25.0612 3.96094H10.8279C9.88414 3.96094 8.97906 4.36261 8.31174 5.07759C7.64443 5.79258 7.26953 6.7623 7.26953 7.77344V38.2734C7.26953 39.2846 7.64443 40.2543 8.31174 40.9693C8.97906 41.6843 9.88414 42.0859 10.8279 42.0859H32.1779C33.1216 42.0859 34.0267 41.6843 34.694 40.9693C35.3613 40.2543 35.7362 39.2846 35.7362 38.2734V15.3984L25.0612 3.96094ZM32.1779 38.2734H10.8279V7.77344H23.282V17.3047H32.1779V38.2734Z"
							fill="currentColor"
						/>
					</svg>
				</div>
				<p className="text-[14px] text-gray-500 text-center">.inlang</p>
				<p className="text-[14px] text-gray-950 text-center pt-4 font-medium">
					Drag and drop or click to choose file
				</p>
			</div>
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
				Create new project
			</SlButton>
			<CreateProjectDialog
				showNewProjectDialog={showNewProjectDialog}
				setShowNewProjectDialog={setShowNewProjectDialog}
			/>
		</div>
	);
};

export default NoProjectView;
