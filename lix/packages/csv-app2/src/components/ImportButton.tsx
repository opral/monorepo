/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useAtom } from "jotai";
import { csvDataAtom, forceReloadProjectAtom, projectAtom } from "../state.ts";
import { SlButton } from "@shoelace-style/shoelace/dist/react";
import { useEffect } from "react";
import Papa from "papaparse";

export const ImportButton = () => {
	const [project] = useAtom(projectAtom);
	const [csvData, setCsvData] = useAtom(csvDataAtom);
	const [, setForceReloadProject] = useAtom(forceReloadProjectAtom);

	const handleImport = async () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".csv";
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
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
						.executeTakeFirst();

					const newData = Papa.parse(
						new TextDecoder().decode(reader.result as ArrayBuffer),
						{
							header: true,
							skipEmptyLines: true,
						}
					).data as [{ [key: string]: string }];

					// TODO: bug the data is not updated via the roundtrip to the csv file, i need to manually update the state here
					// @ts-ignore
					setCsvData(newData);

					setForceReloadProject(Date.now());
				};
				reader.readAsArrayBuffer(file);
			}
		};
		input.click();
	};

	useEffect(() => {
		console.log(csvData);
	}, [csvData]);

	return (
		<SlButton
			disabled={project === undefined}
			slot="trigger"
			size="small"
			variant="primary"
			onClick={() => handleImport()}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			style={{ "--sl-button-font-size-small": "13px" } as any}
		>
			Import .csv
		</SlButton>
	);
};
