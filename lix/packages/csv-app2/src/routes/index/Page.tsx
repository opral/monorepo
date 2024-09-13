/* eslint-disable @typescript-eslint/no-explicit-any */
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { projectAtom, selectedProjectPathAtom } from "../../state.ts";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { openLixInMemory } from "@lix-js/sdk";
import timeAgo from "./../../helper/timeAgo.js";
import { CreateProjectDialog } from "../../components/CreateProjectDialog.tsx";
import { DemoCard } from "../../components/DemoCard.tsx";

type ProjectPreview = {
	path: string;
	lastModified: string | undefined;
	lastAuthoredBy: string | undefined;
	lastCommitAnnotation: string | undefined;
};

export default function App() {
	const [project] = useAtom(projectAtom);

	const [projects, setProjects] = useState<ProjectPreview[]>([]);
	const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const navigate = useNavigate();

	const getProjects = async () => {
		const projects: ProjectPreview[] = [];
		const opfsRoot = await navigator.storage.getDirectory();
		// @ts-expect-error - TS doesn't know about the keys method
		for await (const path of opfsRoot.keys()) {
			if (path.endsWith(".lix")) {
				if (!path) return undefined;
				const opfsRoot = await navigator.storage.getDirectory();
				const fileHandle = await opfsRoot.getFileHandle(path);
				const file = await fileHandle.getFile();
				const lixProject = await openLixInMemory({
					blob: file,
				});
				const lastCommit = await lixProject.db
					.selectFrom("commit")
					.selectAll()
					.orderBy("created_at", "desc")
					.executeTakeFirst();

				projects.push({
					path: path,
					lastModified: lastCommit ? lastCommit.created_at : undefined,
					lastAuthoredBy: lastCommit ? `${lastCommit.author}` : undefined,
					lastCommitAnnotation: lastCommit
						? `${lastCommit?.description}`
						: undefined,
				});
			}
		}

		setProjects(projects);
	};

	useEffect(() => {
		getProjects();
	}, [project]);

	return (
		<div className="w-full">
			<div className="w-full border-b border-zinc-200 bg-white flex items-center px-4 min-h-[54px] gap-2">
				<img src="/lix.svg" alt="logo" className="w-8 h-8" />
				<h1 className="font-medium">CSV App</h1>
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
						<p className="text-md text-zinc-700 font-medium">Your projects</p>
					</div>
					<SlButton
						size="medium"
						style={{ "--sl-button-font-size-small": "13px" } as any}
						onClick={() => setShowNewProjectDialog(true)}
					>
						Create new
					</SlButton>
				</div>
			</div>
			<div className="max-w-5xl mx-auto mt-6 px-4 flex flex-wrap gap-3 mb-16">
				{!projects ||
					(projects.length === 0 && (
						<div
							className="flex flex-col justify-center items-center gap-4 w-full md:w-[calc((100%_-_12px)_/_2)] bg-transparent border border-zinc-300 rounded-lg px-6 py-5 hover:border-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer min-h-[140px] border-dashed text-zinc-400 hover:text-zinc-950"
							onClick={() => setShowNewProjectDialog(true)}
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
					))}
				{projects
					.sort((a, b) => {
						if (!a.lastModified || !b.lastModified) return 0;
						return (
							new Date(b.lastModified).getTime() -
							new Date(a.lastModified).getTime()
						);
					})
					.map((project) => {
						return (
							<div
								key={project.path}
								className="flex flex-col gap-4 w-full md:w-[calc((100%_-_12px)_/_2)] bg-white border border-zinc-200 rounded-lg px-6 py-5 hover:border-zinc-700 transition-all cursor-pointer min-h-[90px]"
								onClick={() => {
									setSelectedProjectPath(project.path);
									navigate("/editor");
								}}
							>
								<div className="flex items-center gap-3">
									<div className="border border-zinc-200 bg-zinc-50 rounded-full flex items-center justify-center text-2xl h-12 w-12">
										{project.path[0].toUpperCase()}
									</div>
									<div className="flex flex-col gap-2">
										<p className="text-lg font-medium">
											{project.path.replace(".lix", "")}
										</p>
										<p className="bg-zinc-100 border border-zinc-200 px-2 py-1">
											/{project.path}
										</p>
									</div>
								</div>
								{project.lastModified && (
									<div className="text-zinc-500 flex flex-col gap-2">
										<div className="flex gap-2 items-center">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="18"
												height="18"
												viewBox="0 0 512 512"
											>
												<path
													fill="currentColor"
													d="M480 224H380a128 128 0 0 0-247.9 0H32v64h100.05A128 128 0 0 0 380 288h100Zm-224 96a64 64 0 1 1 64-64a64.07 64.07 0 0 1-64 64"
												/>
											</svg>
											<p>{project.lastCommitAnnotation}</p>
										</div>

										<p>
											{`By ${project.lastAuthoredBy}, `}
											{timeAgo(project.lastModified)}
										</p>
									</div>
								)}
							</div>
						);
					})}
			</div>
			<CreateProjectDialog
				showNewProjectDialog={showNewProjectDialog}
				setShowNewProjectDialog={setShowNewProjectDialog}
			/>
		</div>
	);
}
