/* eslint-disable @typescript-eslint/ban-ts-comment */
import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const Dropzone = (props: { handleOpen: (value: File[]) => void }) => {
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
					isDragActive ? "bg-blue-50 border-blue-500" : "bg-zinc-50 border-zinc-300"
				)}
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
