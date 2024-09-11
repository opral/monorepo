import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../state.ts";
import Dropzone from "./Dropzone.tsx";

const NoDataView = () => {
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
		<div className="flex items-center justify-center h-[full] gap-8 mt-32">
			<Dropzone
				handleOpen={handleOpen}
				fileLable=".csv"
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="28"
						viewBox="0 0 15 15"
					>
						<path
							fill="none"
							stroke="currentColor"
							d="M.5 4.5h14m-10-4v14m-3-14h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"
						/>
					</svg>
				}
			/>
			<div className="relative h-[200px] w-[20px] flex items-center">
				<div className="absolute w-[1px] top-0 right-[50%] h-[200px] bg-zinc-200" />
				<p className="relative text-zinc-600 bg-zinc-50 py-3 z-5 w-full h-fit text-center">
					or
				</p>
			</div>
			<Dropzone
				handleOpen={handleOpen}
				fileLable=".lix"
				icon={
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
				}
			/>
		</div>
	);
};

export default NoDataView;
