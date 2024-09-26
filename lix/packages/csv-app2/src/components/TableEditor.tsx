/* eslint-disable @typescript-eslint/ban-ts-comment */
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
	authorNameAtom,
	csvDataAtom,
	editorSelectionAtom,
	projectAtom,
	uniqueColumnAtom,
	userPositionsAtom,
} from "../state.ts";
import { CellDrawer } from "./CellDrawer.tsx";
import { useEffect, useState } from "react";
import { SlInput } from "@shoelace-style/shoelace/dist/react";

const TableEditor = () => {
	const [csvData] = useAtom(csvDataAtom);
	const [project] = useAtom(projectAtom);
	const [authorName] = useAtom(authorNameAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [showDrawer, setShowDrawer] = useState(false);
	const [screenHeight, setScreenHeight] = useState<number>(800);
	const [selection, setSelection] = useAtom(editorSelectionAtom);
	const [userPositions] = useAtom(userPositionsAtom);

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

	// const cellComponentWithAvatar = ({ rowData, setRowData }) => {
	// 	console.log(rowData);
	// 	return (
	// 		<SlInput value={rowData} onChange={(e) => setRowData(e.target.value)} />
	// 	);
	// };

	const columns: Array<Record<string, unknown>> = [];
	if (csvData.length > 0) {
		for (const key in csvData[0]) {
			if (key === uniqueColumn) {
				columns.push({
					...keyColumn(key, textColumn),
					title: key,
					disabled: true,
					maxWidth: 200,
					//component: cellComponentWithAvatar,
				});
			} else {
				columns.push({
					...keyColumn(key, textColumn),
					title: key,
					maxWidth: 200,
					//component: cellComponentWithAvatar,
				});
			}
		}
	}

	useEffect(() => {
		setScreenHeight(window.innerHeight - 82);
	}, [window.innerHeight]);

	useEffect(() => {
		console.log(userPositions);
	}, [userPositions]);

	return (
		<div className="relative h-[calc(100vh_-_82px)]">
			<DynamicDataSheetGrid
				disableContextMenu
				value={
					csvData as [
						{
							[key: string]: string;
						},
					]
				}
				height={screenHeight}
				columns={columns}
				cellClassName={({ rowData, columnId }) => {
					const currentRow = (rowData as { [key: string]: string })[
						uniqueColumn
					];

					if (
						userPositions.some(
							(pos) => pos.row === currentRow && pos.col === columnId
						)
					) {
						const userPos = userPositions.find(
							(pos) => pos.row === currentRow && pos.col === columnId
						);

						if (userPos?.userName === authorName) {
							return undefined;
						}

						switch (userPos?.color) {
							case "red":
								return "bg-red-100! outline outline-red-500! relative z-10";
							case "orange":
								return "bg-orange-100! outline outline-orange-500! relative z-10";
							case "amber":
								return "bg-amber-100! outline outline-amber-500! relative z-10";
							case "yellow":
								return "bg-yellow-100! outline outline-yellow-500! relative z-10";
							case "lime":
								return "bg-lime-100! outline outline-lime-500! relative z-10";
							case "green":
								return "bg-green-100! outline outline-green-500! relative z-10";
							case "emerald":
								return "bg-emerald-100! outline outline-emerald-500! relative z-10";
							case "teal":
								return "bg-teal-100! outline outline-teal-500! relative z-10";
							case "cyan":
								return "bg-cyan-100! outline outline-cyan-500! relative z-10";
							case "sky":
								return "bg-sky-100! outline outline-sky-500! relative z-10";
							case "blue":
								return "bg-blue-100! outline outline-blue-500! relative z-10";
							case "indigo":
								return "bg-indigo-100! outline outline-indigo-500! relative z-10";
							case "violet":
								return "bg-violet-100! outline outline-violet-500! relative z-10";
							case "purple":
								return "bg-purple-100! outline outline-purple-500! relative z-10";
							case "pink":
								return "bg-pink-100! outline outline-pink-500! relative z-10";
							case "rose":
								return "bg-rose-100! outline outline-rose-500! relative z-10";
							default:
								break;
						}
						return "bg-blue-100! outline outline-blue-500! relative z-10";
					}

					return undefined;
				}}
				onChange={(newData) =>
					handleUpdateCsvData(
						newData as [
							{
								[key: string]: string;
							},
						]
					)
				}
				rowKey={uniqueColumn}
				// onFocus={(cell) => console.log("onFocus", cell)}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
