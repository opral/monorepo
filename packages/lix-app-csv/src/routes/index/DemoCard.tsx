import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { humanId } from "../../helper/human-id/human-id.ts";
import { getOriginPrivateDirectory } from "native-file-system-adapter";
import { plugin } from "@lix-js/plugin-csv";

const fileName = "cap-table.lix";

export const DemoCard = () => {
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();

	const handleCreateDemo = async () => {
		setLoading(true);
		const projectId = humanId();

		const rootHandle = await getOriginPrivateDirectory();
		const fileHandle = await rootHandle.getFileHandle(
			projectId + "___" + fileName,
			{
				create: true,
			}
		);
		const writable = await fileHandle.createWritable();
		const blob = await newLixFile();
		const newProject = await openLixInMemory({
			blob,
			providePlugins: [plugin],
		});

		const csvContent = await fetch("/cap-table/latestFile.csv").then((res) =>
			res.text()
		);

		if (newProject) {
			// newProject.currentAuthor.set("Demo User");
			await newProject.db
				.insertInto("file")
				.values([
					{
						id: "demo",
						path: "/data.csv",
						data: await new Blob([csvContent]).arrayBuffer(),
						metadata: {
							unique_column: "Stakeholder",
							demo: true,
						},
					},
				])
				.execute();

			await newProject.db
				.insertInto("file")
				.values({
					path: "/project_meta",
					data: new TextEncoder().encode(
						JSON.stringify({
							project_id: projectId,
							initial_file_name: fileName,
						})
					),
				})
				.execute();
		}

		// add commits
		const rawCommits = await fetch("/cap-table/commits.json").then((res) =>
			res.text()
		);
		if (!rawCommits) return;
		// const commits: Commit[] = JSON.parse(rawCommits);
		// if (commits) {

		// }

		// add changes
		const rawChanges = await fetch("/cap-table/changes.json").then((res) =>
			res.text()
		);
		if (!rawChanges) return;
		const changes = JSON.parse(rawChanges);
		if (changes) {
			for (const change of changes) {
				await newProject.db
					.insertInto("change")
					.values([{ ...change }])
					.execute();
			}
		}

		const file = await newProject.toBlob();
		await writable.write(file);
		await writable.close();

		setLoading(false);

		navigate("/editor?project=" + projectId);
	};

	return (
		<div className="w-full rounded-lg bg-[#ECECEC] my-12">
			<div className="md:hidden rounded-lg overflow-hidden grayscale-100 -mb-8 sm:-mb-20">
				<img
					src="/captable-cover-small.png"
					alt="cap-table"
					className="w-full mt-8"
				/>
			</div>
			<div className="flex flex-col md:flex-row px-10 pt-8 items-center relative z-10">
				<h2 className="text-2xl max-w-[500px]">
					Lix brings change control to{" "}
					<span className="bg-zinc-300 text-zinc-800 rounded-sm">.csv</span>{" "}
					(and many other) file formats.
				</h2>
				<SlButton
					loading={loading}
					size="medium"
					variant="primary"
					className="mt-6 md:mt-0 mb-8 md:mb-0"
					onClick={() => {
						handleCreateDemo();
					}}
				>
					Open example csv
				</SlButton>
			</div>
			<div className="hidden md:block rounded-lg overflow-hidden grayscale-100">
				<img
					src="/captable-cover-big.png"
					alt="cap-table"
					className="w-full mt-8"
				/>
			</div>
		</div>
	);
};
