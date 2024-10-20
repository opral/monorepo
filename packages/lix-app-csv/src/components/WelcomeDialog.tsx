/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { projectAtom } from "../state.ts";
import Dropzone from "./Dropzone.tsx";
import { useState } from "react";
import Papa from "papaparse";
import { LixFile } from "@lix-js/sdk";

export const WelcomeDialog = (props: {
	showWelcomeDialog: boolean;
	setShowWelcomeDialog: (value: boolean) => void;
}) => {
	const [project] = useAtom(projectAtom);
	const [uniqueColumn, setUniqueColumn] = useState("");
	const [importedArrayBuffer, setImportedArrayBuffer] = useState<
		ArrayBuffer | undefined
	>(undefined);

	const handleRead = async (files: File[]) => {
		const file = files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async () => {
				setImportedArrayBuffer(reader.result as ArrayBuffer);
				const newData = Papa.parse(
					new TextDecoder().decode(reader.result as ArrayBuffer),
					{
						header: true,
						skipEmptyLines: true,
					}
				).data as [{ [key: string]: string }];

				if (newData[0]) {
					setUniqueColumn(Object.keys(newData[0])[0]);
				}
				// await project?.db
				// 	.insertInto("file")
				// 	.values([
				// 		{
				// 			id: "demo",
				// 			path: "/data.csv",
				// 			// @ts-ignore
				// 			metadata: {
				// 				unique_column: "seq",
				// 			},
				// 			data: await new Blob([
				// 				reader.result as ArrayBuffer,
				// 			]).arrayBuffer(),
				// 		},
				// 	])
				// 	.execute();

				// setTimeout(() => {
				// 	handleCommit();
				// }, 500);
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleImport = async () => {
		await project?.db
			.insertInto("file")
			.values([
				{
					id: "demo",
					path: "/data.csv",
					// @ts-ignore
					metadata: {
						unique_column: uniqueColumn,
					},
					data: await new Blob([
						importedArrayBuffer as ArrayBuffer,
					]).arrayBuffer(),
				} as LixFile,
			])
			.execute();
		setTimeout(() => {
			project?.commit({
				description: "Initial .csv upload in empty project",
			});
		}, 500);
	};

	return (
		<SlDialog
			open={props.showWelcomeDialog}
			onSlRequestClose={() => props.setShowWelcomeDialog(false)}
			noHeader
		>
			<h2 className="text-lg font-medium pb-2">
				Wuhu you just created a new project.
			</h2>
			<p className="text-sm leading-[1.5]! max-w-[400px] pb-4 text-zinc-500">
				Start by importing a .csv file to get started.
			</p>

			{!importedArrayBuffer ? (
				<Dropzone
					handleOpen={(files) => handleRead(files)}
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
			) : (
				<div>
					<p>✅ Successfully uploaded file</p>
					<div className="my-8">
						<SlInput
							label="Unique column"
							placeholder="Enter unique column name"
							value={uniqueColumn}
							helpText="To trace all the changes correctly we need to know which column is used as unique identifier in your .csv file."
							 
							onInput={(e: any) =>
								setUniqueColumn(e.target.value ? e.target.value : "")
							}
						></SlInput>
					</div>
					<SlButton
						disabled={!uniqueColumn}
						variant="primary"
						onClick={async () => {
							await handleImport();
							props.setShowWelcomeDialog(false);
							setTimeout(() => {
								setUniqueColumn("");
								setImportedArrayBuffer(undefined);
							}, 200);
						}}
						className="w-full"
					>
						Import .csv
					</SlButton>
				</div>
			)}
		</SlDialog>
	);
};
