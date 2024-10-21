import { atom, useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";
import { Link } from "react-router-dom";
import { DemoCard } from "./DemoCard.tsx";
import Dropzone from "./Dropzone.tsx";

const filesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	return await lix.db.selectFrom("file").selectAll().execute();
});

export default function Page() {
	return (
		<div className="w-full max-w-5xl mx-auto">
			<div className="mt-8 px-4">
				<DemoCard />
				<div className="flex items-end mt-6 w-full justify-between">
					<div className="flex items-center gap-2">
						<p className="text-xl text-zinc-700 font-medium">Files</p>
					</div>
				</div>
			</div>
			<FileExplorer></FileExplorer>
		</div>
	);
}

function FileExplorer() {
	const [files] = useAtom(filesAtom);

	return (
		<div className="max-w-5xl mx-auto mt-6 px-4 flex flex-wrap gap-3 mb-16">
			<div className="border w-full border-zinc-200 rounded space-y-2">
				{files.map((file) => {
					return (
						<Link key={file.id} to={"/editor?fileId=" + file.id}>
							<div className="w-full flex gap-2 p-2 hover:bg-zinc-100">
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
							</div>
						</Link>
					);
				})}
			</div>
			<Dropzone handleOpen={(files) => console.log(files)} />{" "}
		</div>
	);
}
