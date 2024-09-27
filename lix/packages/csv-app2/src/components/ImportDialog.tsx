/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
	SlButton,
	SlDialog,
	SlInput,
} from "@shoelace-style/shoelace/dist/react";
import { useAtom } from "jotai";
import { pendingChangesAtom, projectAtom } from "../state.ts";
import Dropzone from "./Dropzone.tsx";
import { useState } from "react";

export const ImportDialog = (props: {
	showImportDialog: boolean;
	setShowImportDialog: (value: boolean) => void;
}) => {
	const [project] = useAtom(projectAtom);
	const [pendingChanges] = useAtom(pendingChangesAtom);
	const [importInitialized, setImportInitialized] = useState(false);
	const [description, setDescription] = useState("");

	const handleImport = async (files: File[]) => {
		const file = files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = async () => {
				await project?.db
					.updateTable("file")
					.set(
						"data",
						await new Blob([reader.result as ArrayBuffer]).arrayBuffer()
					)
					.where("path", "=", "/data.csv")
					.execute();

				setTimeout(() => {
					setImportInitialized(true);
				}, 500);
			};
			reader.readAsArrayBuffer(file);
		}
	};

	const handleCommit = async () => {
		await project?.commit({
			description: description,
		});
		setImportInitialized(false);
		setDescription("");
		props.setShowImportDialog(false);
	};

	return (
		<SlDialog
			open={props.showImportDialog}
			onSlRequestClose={() => props.setShowImportDialog(false)}
			noHeader
		>
			<h2 className="text-lg font-medium pb-2">Import dialog</h2>
			<p className="text-sm leading-[1.5]! max-w-[400px] pb-4 text-zinc-500">
				In this dialog you can throw in a .csv file to import it into the lix
				project.
			</p>
			{!importInitialized ? (
				<Dropzone
					handleOpen={(files) => handleImport(files)}
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
					<div className="mb-4">
						{pendingChanges.length > 0
							? `✅ Successfully added ${pendingChanges.length} changes`
							: "⛔️ No changes after upload"}
					</div>
					{pendingChanges.length > 0 && (
						<div className="mb-8 mt-4">
							<SlInput
								label="Description"
								placeholder="What did you import?"
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onInput={(e: any) =>
									setDescription(e.target.value ? e.target.value : "")
								}
							></SlInput>
						</div>
					)}

					{pendingChanges.length > 0 ? (
						<SlButton
							variant="primary"
							slot="footer"
							onClick={handleCommit}
							className="w-full"
						>
							Save
						</SlButton>
					) : (
						<SlButton
							variant="primary"
							slot="footer"
							onClick={() => {
								props.setShowImportDialog(false);
								setTimeout(() => {
									setImportInitialized(false);
									setDescription("");
								}, 200);
							}}
							className="w-full"
						>
							Close
						</SlButton>
					)}
				</div>
			)}
		</SlDialog>
	);
};
