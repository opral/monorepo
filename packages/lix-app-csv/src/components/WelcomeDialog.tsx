/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { lixAtom } from "../state.ts";
import Dropzone from "../routes/index/Dropzone.tsx";
import { useState } from "react";
import { LixFile } from "@lix-js/sdk";

export const WelcomeDialog = (props: {
	showWelcomeDialog: boolean;
	setShowWelcomeDialog: (value: boolean) => void;
}) => {
	const [project] = useAtom(lixAtom);
	const [uniqueColumn, setUniqueColumn] = useState("");
	const [importedArrayBuffer, setImportedArrayBuffer] = useState<
		ArrayBuffer | undefined
	>(undefined);

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
				<Dropzone />
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
