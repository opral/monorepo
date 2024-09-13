import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./../csv-plugin.js";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAtom } from "jotai";
import { selectedProjectPathAtom } from "../state.ts";

export const DemoCard = () => {
	const [loading, setLoading] = useState(false);
	const [, setSelectedProjectPath] = useAtom(selectedProjectPathAtom);

	const navigate = useNavigate();

	const handleCreateDemo = async () => {
		setLoading(true);
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle("cap-table.lix", {
			create: true,
		});
		const writable = await fileHandle.createWritable();
		const blob = await newLixFile();
		const newProject = await openLixInMemory({
			blob,
			providePlugins: [plugin],
		});

		const csvContent = await fetch("./../../../demo/cap-table.csv").then(
			(res) => res.text()
		);

		if (newProject) {
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
		}
		setTimeout(async () => {
			await newProject?.commit({
				description: "Inital demo imported",
			});

			const csvContent2 = await fetch("./../../../demo/cap-table02.csv").then(
				(res) => res.text()
			);

			if (newProject) {
				await newProject.db
					.updateTable("file")
					.set("data", await new Blob([csvContent2]).arrayBuffer())
					.where("path", "=", "/data.csv")
					.execute();
			}

			setTimeout(async () => {
				await newProject?.commit({
					description: "Update July 2024",
				});

				const file = await newProject.toBlob();
				await writable.write(file);
				await writable.close();

				setSelectedProjectPath("cap-table.lix");
				setLoading(false);

				navigate("/editor");
			}, 1000);
		}, 1000);
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
			<div className="flex flex-col md:flex-row px-10 pt-8 relative z-10">
				<div className="flex-1">
					<p className="text-zinc-500">CAP TABLE DEMO</p>
					<h2 className="text-2xl max-w-[500px] mt-2">
						Never again burden yourself with manually storing .csv files to
						track changes.
					</h2>
				</div>
				<SlButton
					loading={loading}
					size="medium"
					variant="primary"
					className="mt-6 md:mt-0 mb-8 md:mb-0"
					onClick={() => {
						handleCreateDemo();
					}}
				>
					Open Demo
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
