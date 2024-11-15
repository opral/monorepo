import { atom, useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";
import { Link } from "react-router-dom";
import Dropzone from "./Dropzone.tsx";
import { SlIconButton } from "@shoelace-style/shoelace/dist/react";
import { useState } from "react";

const filesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	return await lix.db.selectFrom("file").selectAll().execute();
});

export default function FileExplorer() {
	const [lix] = useAtom(lixAtom);
	const [files] = useAtom(filesAtom);

	const [hoveredFileId, setHoveredFileId] = useState<string | undefined>(
		undefined
	);

	const handleDeleteFile = async (id: string) => {
		await lix.db.deleteFrom("file").where("id", "=", id).execute();
	};

	const handleDownload = async (fileId: string) => {
		const file = await lix.db
			.selectFrom("file")
			.selectAll()
			.where("id", "=", fileId)
			.executeTakeFirstOrThrow();

		const blob = new Blob([file.data]);

		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		// remove prefixed root slash `/`
		a.download = file.path.slice(1);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	return (
		<div className="max-w-5xl mx-auto mt-6 px-4 flex flex-wrap gap-3 mb-16">
			<div
				className="border w-full border-zinc-200 rounded space-y-2"
				onMouseLeave={() => setHoveredFileId(undefined)}
			>
				{files.map((file) => {
					return (
						<div
							key={file.id}
							className="w-full flex gap-2 p-2 min-h-12 hover:bg-zinc-100"
							onMouseEnter={() => setHoveredFileId(file.id)}
						>
							<Link
								to={"/editor?f=" + file.id}
								className="w-full flex gap-2 items-center"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="22"
									height="22"
									viewBox="0 0 24 24"
									className="text-zinc-500"
								>
									<path
										fill="currentColor"
										d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5z"
									/>
								</svg>
								{/* remove prefixed root slash `/` */}
								<p>{file.path.slice(1)}</p>
							</Link>
							<div className="flex gap-1 items-center">
								{hoveredFileId === file.id && (
									<SlIconButton
										name="trash3"
										onClick={() => handleDeleteFile(file.id)}
									></SlIconButton>
								)}
								{hoveredFileId === file.id && (
									<SlIconButton
										name="download"
										onClick={() => handleDownload(file.id)}
									></SlIconButton>
								)}
							</div>
						</div>
					);
				})}
			</div>
			<Dropzone />
		</div>
	);
}
