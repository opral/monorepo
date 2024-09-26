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

	useEffect(() => {
		for (const userPos of userPositions) {
			const style = document.createElement("style");
			style.innerHTML = `
				.style-${userPos.userName}::before {
					content: "${userPos.userName.slice(0, 2).toUpperCase()}";
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 4px;
					width: 32px;
					height: 32px;
					border-radius: 50%;
					background-color: #FFF;
					text-align: center;
					line-height: 30px;
					font-size: 13px;
					font-weight: 400;
					border: 1px solid #cdd0d4;
					opacity: 0.8
				}
			`;
			document.head.appendChild(style);
		}
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

						if (userPos?.date) {
							// check if isoTimeString is older the 30 sec and if so return undefined
							const date = new Date(userPos.date);
							const now = new Date();
							const diff = now.getTime() - date.getTime();

							if (diff > 60000) {
								return undefined;
							}
						}

						switch (userPos?.color) {
							case "red":
								return (
									"bg-red-100! outline outline-red-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "orange":
								return (
									"bg-orange-100! outline outline-orange-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "amber":
								return (
									"bg-amber-100! outline outline-amber-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "yellow":
								return (
									"bg-yellow-100! outline outline-yellow-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "lime":
								return (
									"bg-lime-100! outline outline-lime-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "green":
								return (
									"bg-green-100! outline outline-green-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "emerald":
								return (
									"bg-emerald-100! outline outline-emerald-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "teal":
								return (
									"bg-teal-100! outline outline-teal-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "cyan":
								return (
									"bg-cyan-100! outline outline-cyan-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "sky":
								return (
									"bg-sky-100! outline outline-sky-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "blue":
								return (
									"bg-blue-100! outline outline-blue-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "indigo":
								return (
									"bg-indigo-100! outline outline-indigo-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "violet":
								return (
									"bg-violet-100! outline outline-violet-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "purple":
								return (
									"bg-purple-100! outline outline-purple-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "pink":
								return (
									"bg-pink-100! outline outline-pink-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							case "rose":
								return (
									"bg-rose-100! outline outline-rose-500! relative z-10 " +
									`style-${userPos?.userName}`
								);
							default:
								break;
						}
						return (
							"bg-blue-100! outline outline-blue-500! relative z-10 " +
							`style-${userPos?.userName}`
						);
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
					}
				}}
				addRowsComponent={() => <div></div>}
			/>
			<CellDrawer showDrawer={showDrawer} setShowDrawer={setShowDrawer} />
		</div>
	);
};

export default TableEditor;
