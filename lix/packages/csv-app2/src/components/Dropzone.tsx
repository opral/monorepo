/* eslint-disable @typescript-eslint/ban-ts-comment */
import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const Dropzone = (props: {
	handleOpen: (value: File[]) => void;
	fileLable: string;
	icon?: JSX.Element;
}) => {
	//@ts-ignore
	const onDrop = useCallback((acceptedFiles) => {
		// Do something with the files
		props.handleOpen(acceptedFiles);
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	return (
		<div {...getRootProps()}>
			<input {...getInputProps()} />
			<div
				className={clsx(
					"border  flex flex-col items-center w-[340px] rounded-xl px-4 py-12 gap-3 border-dashed cursor-pointer hover:border-zinc-600 hover:bg-zinc-100",
					isDragActive
						? "bg-blue-50 border-blue-500"
						: "bg-zinc-50 border-zinc-300"
				)}
			>
				<div className="bg-zinc-200 h-12 w-12 rounded-xl text-zinc-500 flex justify-center items-center">
					{props.icon}
				</div>
				<p className="text-[20px] pt-4 text-gray-500 text-center">
					{props.fileLable}
				</p>
				{isDragActive ? (
					<p className="text-[14px] text-gray-950 text-center pt-4 font-medium">
						Release to upload file
					</p>
				) : (
					<p className="text-[14px] text-gray-950 text-center pt-4 font-medium">
						Drag and drop or click to choose file
					</p>
				)}
			</div>
		</div>
	);
};

export default Dropzone;
