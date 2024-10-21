import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { atom, useAtom } from "jotai";
import { lixAtom, withPollingAtom } from "../../state.ts";
import { Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { CreateProjectDialog } from "../../components/CreateProjectDialog.tsx";
import { DemoCard } from "../../components/DemoCard.tsx";

const filesAtom = atom(async (get) => {
	get(withPollingAtom);
	const lix = await get(lixAtom);
	return await lix.db.selectFrom("file").selectAll().execute();
});

export default function Page() {
	const [lix] = useAtom(lixAtom);

	const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

	return (
		<div className="w-full">
			<input
				id="fileInput"
				type="file"
				accept=".csv"
				style={{ display: "none" }}
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (file) {
						await lix.db
							.insertInto("file")
							.values({
								path: `/${file.name}`,
								data: await file.arrayBuffer(),
								// @ts-expect-error - metadata is a json column
								metadata: JSON.stringify({ unique_column: "id" }),
							})
							.execute();
					}
				}}
			/>
			<div className="w-full border-b border-zinc-200 bg-white flex items-center px-4 min-h-[54px] gap-2">
				<img src="/lix.svg" alt="logo" className="w-8 h-8" />
				<h1 className="font-medium">CSV Demo App</h1>
			</div>

			<div className="max-w-5xl mx-auto mt-8 px-4">
				<h2 className="text-4xl md:text-5xl max-w-[500px] text-center mx-auto leading-[44px] md:leading-[54px]">
					Lix brings change control to your{" "}
					<span className="bg-zinc-200 text-zinc-700 px-1">.csv</span> files
				</h2>
				<DemoCard />
				<div className="flex items-end mt-6 w-full justify-between">
					<div className="flex items-center gap-2">
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
						<p className="text-md text-zinc-700 font-medium">Your files</p>
					</div>
					<SlButton
						size="medium"
						style={{ "--sl-button-font-size-small": "13px" } as any}
						onClick={() => setShowNewProjectDialog(true)}
					>
						Import file
					</SlButton>
				</div>
			</div>
			<Suspense fallback={<p>Loading</p>}>
				<FileExplorer></FileExplorer>
			</Suspense>
			<CreateProjectDialog
				showNewProjectDialog={showNewProjectDialog}
				setShowNewProjectDialog={setShowNewProjectDialog}
			/>
		</div>
	);
}

function FileExplorer() {
	const [files] = useAtom(filesAtom);

	return (
		<div className="max-w-5xl mx-auto mt-6 px-4 flex flex-wrap gap-3 mb-16">
			{files.length === 0 && (
				<div
					className="flex flex-col justify-center items-center gap-4 w-full md:w-[calc((100%_-_12px)_/_2)] bg-transparent border border-zinc-300 rounded-lg px-6 py-5 hover:border-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer min-h-[140px] border-dashed text-zinc-400 hover:text-zinc-950"
					onClick={() => document.getElementById("fileInput")?.click()}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
					>
						<path
							fill="currentColor"
							d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"
						/>
					</svg>
				</div>
			)}
			<div className="border w-full border-zinc-200 px-4 py-2 rounded">
				{files.map((file) => {
					return (
						<Link key={file.id} to={"/editor?fileId=" + file.id}>
							{file.path}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
