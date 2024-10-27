import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { lixAtom } from "../../state.ts";
import { saveLixToOpfs } from "../../helper/saveLixToOpfs.ts";

export default function Dropzone() {
	const [lix] = useAtom(lixAtom);

	const onDrop = useCallback(async (acceptedFiles: any) => {
		await lix.db
			.insertInto("file")
			.values(
				await Promise.all(
					acceptedFiles.map(async (file: File) => ({
						path: "/" + file.name,
						data: await file.arrayBuffer(),
					}))
				)
			)
			.execute();
		await saveLixToOpfs({ lix });
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div {...getRootProps()} className="w-full">
			<input {...getInputProps()} />
			<div
				className={clsx(
					"border  flex flex-col items-center w-full rounded px-2 py-6 gap-3 border-dashed cursor-pointer hover:border-zinc-600 hover:bg-zinc-100",
					isDragActive
						? "bg-blue-50 border-blue-500"
						: "bg-zinc-50 border-zinc-300"
				)}
			>
				<div className="bg-zinc-200 h-12 w-12 rounded-xl text-zinc-500 flex justify-center items-center">
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
				</div>
				<p className="text-lg pt-2 text-gray-500 text-center font-medium">
					Import your own .csv file
				</p>
				{isDragActive ? (
					<p className=" text-gray-950 text-center font-medium">
						Release to import
					</p>
				) : (
					<p className=" text-gray-500 text-center">
						Import your own .csv file to experience lix change control.
					</p>
				)}
			</div>
		</div>
	);
}
