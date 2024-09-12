import { useAtom } from "jotai";
// import { useState } from "react";
import {
	DynamicDataSheetGrid,
	textColumn,
	keyColumn,
} from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import Papa from "papaparse";
import { csvDataAtom, editorSelectionAtom, projectAtom } from "../state.ts";
import { CellDrawer } from "./CellDrawer.tsx";
import { useEffect, useState } from "react";

export const primaryKey = "seq";

const TableEditor = () => {
	const [csvData] = useAtom(csvDataAtom);
	const [project] = useAtom(projectAtom);
	const [showDrawer, setShowDrawer] = useState(false);
	const [screenHeight, setScreenHeight] = useState<number>(800);
	const [selection, setSelection] = useAtom(editorSelectionAtom);

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
					maxWidth: 200,
				});
			} else {
				columns.push({
					...keyColumn(key, textColumn),
					title: key,
					maxWidth: 200,
				});
			}
		}
	}

	useEffect(() => {
		setScreenHeight(window.innerHeight - 87);
	}, [window.innerHeight]);

	return (
		<div className="relative h-[calc(100vh_-_87px)]">
			<DynamicDataSheetGrid
				value={
					csvData as [
						{
							[key: string]: string;
						},
					]
				}
				height={screenHeight}
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
							const newSelection = {
								row: selectedRow[primaryKey],
								col: e.selection.max.colId,
							};
							if (JSON.stringify(newSelection) !== JSON.stringify(selection)) {
								setSelection({
									row: selectedRow[primaryKey],
									col: e.selection.max.colId,
								});
							}
							if (!showDrawer) setShowDrawer(true);
						}
					} else {
						// if (selection !== null) {
						// 	setSelection(null);
						// }
						// if (showDrawer) {
						// 	setShowDrawer(false);
						// }
					}
				}}
				addRowsComponent={() => <div></div>}
			/>
			<CellDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} />
		</div>
	);
};

export default TableEditor;
