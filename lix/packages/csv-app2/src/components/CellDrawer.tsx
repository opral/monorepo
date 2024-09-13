import { SlDrawer } from "@shoelace-style/shoelace/dist/react";
import { SetStateAction, useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import {
	csvDataAtom,
	editorSelectionAtom,
	projectAtom,
	uniqueColumnAtom,
} from "../state.ts";
import { isInSimulatedCurrentBranch } from "@lix-js/sdk";
import timeAgo from "../helper/timeAgo.ts";

export const CellDrawer = (props: {
	showDrawer: boolean;
	setShowDrawer: React.Dispatch<SetStateAction<boolean>>;
}) => {
	const [selection] = useAtom(editorSelectionAtom);
	const [project] = useAtom(projectAtom);
	const [csvData] = useAtom(csvDataAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [row, setRow] = useState<{ [key: string]: string } | undefined>();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [relevantChangesOfRow, setRelevantChangesOfRow] = useState<any[]>([]);

	const getPlacement = () => {
		if (window.innerWidth < 768) {
			return "bottom";
		} else {
			return "end";
		}
	};

	const getCsvRow = async (selection: { row: string; col: string }) => {
		if (csvData && csvData.length > 0) {
			const row = csvData.find((row) => row[uniqueColumn] === selection.row);
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
					(eb) => eb.ref("value", "->>").key(uniqueColumn),
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

	useEffect(() => {
		if (selection) {
			getCsvRow(selection);
		}
	}, [selection]);

	useEffect(() => {
		if (row) {
			getHistoryOfRow();
		}
	}, [row]);

	useEffect(() => {
		console.log(uniqueColumn);
	}, [uniqueColumn]);

	return (
		<div className="">
			<SlDrawer
				open={props.showDrawer}
				contained
				placement={getPlacement()}
				noHeader
				className="cellDrawer"
			>
				<div className="w-full flex items-center min-h-[54px] gap-1 border-b border-zinc-200">
					<div className=" w-full flex justify-between items-center text-zinc-950 h-9 rounded-lg px-3">
						<div className="flex items-center gap-2">
							<div
								onClick={() => props.setShowDrawer(false)}
								className="flex rotate-90 md:rotate-0 bg-zinc-100 hover:bg-zinc-200 cursor-pointer w-7 h-7 items-center justify-center rounded"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M10 6L8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6z"
									/>
								</svg>
							</div>

							<h1 className="font-medium pl-1">{"History"}</h1>
						</div>
						{/* <div className="flex items-center gap-1">
							<p
								onClick={() => setDrawerType("cell")}
								className={clsx(
									"cursor-pointer bg-white rounded-lg px-3 py-2 font-regular text-zinc-600 hover:bg-zinc-100",
									drawerType === "cell" &&
										"text-zinc-950 font-medium bg-zinc-100"
								)}
							>
								Cell
							</p>
							<p
								onClick={() => setDrawerType("row")}
								className={clsx(
									"cursor-pointer bg-white rounded-lg px-3 py-2 font-regular text-zinc-600 hover:bg-zinc-100",
									drawerType === "row" &&
										"text-zinc-950 font-medium bg-zinc-100"
								)}
							>
								Row
							</p>
						</div> */}
						<p className="text-zinc-500 pr-1">
							{selection?.row} - {selection?.col}
						</p>
					</div>
				</div>
				{selection && (
					<div className="mb-12 relative flex flex-col gap-3">
						{relevantChangesOfRow
							.filter((cell) => cell.meta.col_name.includes(selection.col))
							.map((change) => {
								return (
									<div
										key={change.id}
										className="relative z-10 flex items-start justify-between text-zinc-500 pr-4 pl-3  mt-4 gap-5"
									>
										<div className="mt-1 w-5 h-5 bg-white flex items-center justify-center rounded-full">
											<div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
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
											<div className="mt-2 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded">
												{change.value[selection?.col]}
											</div>
										</div>
									</div>
								);
							})}
						<div className="absolute w-[2px] h-[calc(100%_-_100px)] top-[20px] left-[21px] bg-zinc-200"></div>
					</div>
				)}
			</SlDrawer>
		</div>
	);
};
