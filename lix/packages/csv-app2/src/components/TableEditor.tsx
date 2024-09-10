import { useAtom } from "jotai";
// import { useState } from "react";
import {
	DynamicDataSheetGrid,
	textColumn,
	keyColumn,
} from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import Papa from "papaparse";
import { csvDataAtom, projectAtom } from "../state.ts";

const TableEditor = () => {
	const [csvData] = useAtom(csvDataAtom);
	const [project] = useAtom(projectAtom);

	const primaryKey = "seq";

	const handleUpdateCsvData = async (
		newData: [
			{
				[key: string]: string;
			},
		]
	) => {
		console.log("newData", newData);
		project?.db
			.updateTable("file")
			.set("data", await new Blob([Papa.unparse(newData)]).arrayBuffer())
			.where("path", "=", "/data.csv")
			.execute();
	};

	const columns: Array<Record<string, unknown>> = [];
	if (csvData.length > 0) {
		for (const key in csvData[0]) {
			if (key === primaryKey) {
				columns.push({
					...keyColumn(key, textColumn),
					title: key,
					disabled: true,
				});
			} else {
				columns.push({ ...keyColumn(key, textColumn), title: key });
			}
		}
	}

	return (
		<div>
			<DynamicDataSheetGrid
				value={
					csvData as [
						{
							[key: string]: string;
						},
					]
				}
				height={600}
				columns={columns}
				onChange={(newData) =>
					handleUpdateCsvData(
						newData as [
							{
								[key: string]: string;
							},
						]
					)
				}
				rowKey={primaryKey}
				onFocus={(cell) => console.log("onFocus", cell)}
				onSelectionChange={(e: { selection: any }) => {
					if (e.selection) {
						if (
							JSON.stringify(e.selection.max) ===
							JSON.stringify(e.selection.min)
						) {
							const selectedRow = csvData[e.selection.max.row];
							console.log(
								"position:",
								e.selection.max.colId,
								selectedRow[primaryKey]
							);
						}
					} else {
						console.log("blur");
					}
				}}
				addRowsComponent={() => <div></div>}
			/>
		</div>
	);
};

export default TableEditor;
