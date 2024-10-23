import { useAtom } from "jotai";
// import { useState } from "react";
import {
	DynamicDataSheetGrid,
	textColumn,
	keyColumn,
} from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import Papa from "papaparse";
import {
	editorSelectionAtom,
	lixAtom,
	selectedFileIdAtom,
	uniqueColumnAtom,
} from "../state.ts";
import { CellDrawer } from "./CellDrawer.tsx";
import { useEffect, useState } from "react";
import { parsedCsvAtom } from "../routes/editor/state.ts";

const TableEditor = () => {
	const [csvData] = useAtom(parsedCsvAtom);
	const [lix] = useAtom(lixAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [selectedFileId] = useAtom(selectedFileIdAtom);
	const [showDrawer, setShowDrawer] = useState(false);
	const [screenHeight, setScreenHeight] = useState<number>(800);
	const [selection, setSelection] = useAtom(editorSelectionAtom);

	const handleUpdateCsvData = async (newData: Array<string[]>) => {
		await lix.db
			.updateTable("file")
			.set("data", await new Blob([Papa.unparse(newData)]).arrayBuffer())
			.where("id", "=", selectedFileId)
			.execute();
	};

	const columns: Array<Record<string, unknown>> = [];
	if (csvData.length > 0) {
		for (const key in csvData[0]) {
			if (key === uniqueColumn) {
				const column = {
					...keyColumn(key, textColumn),
					title: key,
					disabled: true,
					maxWidth: 200,
				};
				columns.push(column);
			} else {
				const column = {
					...keyColumn(key, textColumn),
					title: key,
					maxWidth: 200,
				};
				columns.push(column);
			}
		}
	}

	useEffect(() => {
		setScreenHeight(window.innerHeight - 82);
	}, [window.innerHeight]);

	return (
		<div className="relative h-[calc(100vh_-_82px)]">
			<DynamicDataSheetGrid
				disableContextMenu
				value={csvData}
				columns={columns}
				height={screenHeight}
				// @ts-expect-error - rowKey expects string
				onChange={(newData) => handleUpdateCsvData(newData)}
				rowKey={uniqueColumn}
				// onFocus={(cell) => console.log("onFocus", cell)}
				onSelectionChange={(e: { selection: any }) => {
					if (e.selection) {
						if (
							JSON.stringify(e.selection.max) ===
							JSON.stringify(e.selection.min)
						) {
							const selectedRow = csvData[e.selection.max.row];
							const newSelection = {
								row: selectedRow[uniqueColumn],
								col: e.selection.max.colId,
							};
							if (JSON.stringify(newSelection) !== JSON.stringify(selection)) {
								setSelection({
									row: selectedRow[uniqueColumn],
									col: e.selection.max.colId,
								});
							}
							if (!showDrawer) setShowDrawer(true);
						}
					}
				}}
			/>
			<CellDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} />
		</div>
	);
};

export default TableEditor;
