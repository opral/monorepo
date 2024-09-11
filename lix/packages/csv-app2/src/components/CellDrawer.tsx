import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import { SetStateAction, useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { csvDataAtom, editorSelectionAtom, projectAtom } from "../state.ts";
import { primaryKey } from "./TableEditor.tsx";
import { isInSimulatedCurrentBranch } from "@lix-js/sdk";
import clsx from "clsx";
import timeAgo from "../helper/timeAgo.ts";

export const CellDrawer = (props: {
	showDrawer: boolean;
	setShowDrawer: React.Dispatch<SetStateAction<boolean>>;
}) => {
	const [selection] = useAtom(editorSelectionAtom);
	const [project] = useAtom(projectAtom);
	const [csvData] = useAtom(csvDataAtom);
	const [row, setRow] = useState<{ [key: string]: string } | undefined>();
	const [drawerType, setDrawerType] = useState<"row" | "cell">("row");
	const [relevantChangesOfRow, setRelevantChangesOfRow] = useState<any[]>([]);
	const [relevantChangesOfCell, setRelevantChangesOfCell] = useState<any[]>([]);

	const getPlacement = () => {
		if (window.innerWidth < 768) {
			return "bottom";
		} else {
			return "end";
		}
	};

	const getCsvRow = async (selection: { row: string; col: string }) => {
		if (csvData && csvData.length > 0) {
			const row = csvData.find((row) => row[primaryKey] === selection.row);
			setRow(row);
		}
	};

	const getHistoryOfRow = async () => {
		const relevantChanges = [];
		const commits = await project?.db
			.selectFrom("commit")
			.selectAll()
			.orderBy("created_at desc")
			.execute();

		if (!commits) return;
		for await (const commit of commits) {
			const change = await project?.db
				.selectFrom("change")
				.selectAll()
				.where("change.commit_id", "==", commit.id)
				.where(
					(eb) => eb.ref("value", "->>").key(primaryKey),
					"=",
					selection?.row
				)
				.innerJoin("commit", "commit.id", "change.commit_id")
				.where(isInSimulatedCurrentBranch)
				.orderBy("change.created_at desc")
				.executeTakeFirst();

			if (change) {
				relevantChanges.push(change);
			}
		}
		setRelevantChangesOfRow(relevantChanges);
	};

	const getHistoryOfCell = async () => {
		const relevantChanges = [];
		const commits = await project?.db
			.selectFrom("commit")
			.selectAll()
			.orderBy("created_at desc")
			.execute();

		if (!commits) return;
		for await (const commit of commits) {
			const change = await project?.db
				.selectFrom("change")
				.selectAll()
				.where("change.commit_id", "==", commit.id)
				.where(
					(eb) => eb.ref("meta", "->>").key("col_name"),
					"=",
					selection?.col
				)
				.where(
					(eb) => eb.ref("value", "->>").key(primaryKey),
					"=",
					selection?.row
				)
				.innerJoin("commit", "commit.id", "change.commit_id")
				.where(isInSimulatedCurrentBranch)
				.orderBy("change.created_at desc")
				.executeTakeFirst();

			if (change) {
				relevantChanges.push(change);
			}
		}
		setRelevantChangesOfCell(relevantChanges);
	};

	useEffect(() => {
		if (selection) {
			getCsvRow(selection);
		}
	}, [selection]);

	useEffect(() => {
		if (row) {
			getHistoryOfRow();
			getHistoryOfCell();
		}
	}, [row]);

	return (
		<SlDrawer
			open={props.showDrawer}
			contained
			onSlRequestClose={() => props.setShowDrawer(false)}
			placement={getPlacement()}
			noHeader
			className="cellDrawer"
		>
			<div className="w-full flex items-center min-h-[54px] gap-1 border-b border-zinc-200">
				<div className="w-full flex justify-between items-center text-zinc-950 h-9 rounded-lg px-3">
					<h1 className="font-medium pl-1">{"History"}</h1>
					<div className="flex items-center gap-1">
						<p
							className={clsx(
								"cursor-pointer bg-white rounded-lg px-3 py-2 font-regular text-zinc-600 hover:bg-zinc-100",
								drawerType === "cell" && "text-zinc-950 font-medium bg-zinc-100"
							)}
						>
							Cell
						</p>
						<p
							className={clsx(
								"cursor-pointer bg-white rounded-lg px-3 py-2 font-regular text-zinc-600 hover:bg-zinc-100",
								drawerType === "row" && "text-zinc-950 font-medium bg-zinc-100"
							)}
						>
							Row
						</p>
					</div>
				</div>
			</div>
			{/* <div className="flex items-center justify-between min-h-[40px] text-zinc-500 px-4">
				<p>Position</p>
				<p className="">
					{selection?.row} - {selection?.col}
				</p>
			</div> */}
			<div className="mb-12 mt-2 relative flex flex-col gap-3">
				{relevantChangesOfRow.map((change) => {
					return (
						<div className="relative z-10 flex items-start justify-between text-zinc-500 px-4 mt-4 gap-5">
							<div className="mt-1 w-5 h-5 bg-zinc-100 flex items-center justify-center rounded-full">
								<div className="w-2 h-2 bg-zinc-950 rounded-full"></div>
							</div>
							<div className="flex-1 flex flex-col gap-1">
								<div className="flex justify-between">
									<div className="">
										<span className="text-zinc-950 font-medium">
											{change.author}
										</span>{" "}
										changed value
									</div>
									<div className="">{timeAgo(change.created_at)}</div>
								</div>
								<div className="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="1em"
										height="1em"
										viewBox="0 0 24 24"
									>
										<path
											fill="currentColor"
											d="M5.763 17H20V5H4v13.385zm.692 2L2 22.5V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1z"
										/>
									</svg>
									<p className="text-sm">{change.description}</p>
								</div>
								<div className="mt-3 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded">
									{change.value[selection?.col]}
								</div>
							</div>
						</div>
					);
				})}
				<div className="absolute w-[1px] h-[calc(100%_-_100px)] top-[20px] left-[25px] bg-zinc-300"></div>
			</div>
		</SlDrawer>
	);
};
