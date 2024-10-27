import { Change, isInSimulatedCurrentBranch, Lix, Snapshot } from "@lix-js/sdk";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { lixAtom } from "../state.ts";
// import timeAgo from "../helper/timeAgo.ts";
import clsx from "clsx";
import {
	activeFileAtom,
	parsedCsvAtom,
	uniqueColumnIndexAtom,
} from "../routes/editor/state.ts";

const getChanges = async (lix: Lix, changeSetId: string, fileId: string) => {
	const result: Array<
		Change & { content: Snapshot["content"] } & {
			parent?: Change & { content: Snapshot["content"] };
		}
	> = [];

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin("change_set_item", "change_set_item.change_id", "change.id")
		.where("change_set_item.change_set_id", "=", changeSetId)
		.where("change.file_id", "=", fileId)
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	for (const change of changes) {
		const parent = await lix.db
			.selectFrom("change")
			.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
			.innerJoin("change_graph_edge", "change_graph_edge.child_id", "change.id")
			.where("change_graph_edge.child_id", "=", change.id)
			.where(isInSimulatedCurrentBranch)
			.selectAll("change")
			.select("snapshot.content")
			.executeTakeFirst();

		result.push({ ...change, parent });
	}
	return result;
};

export default function ChangeSet(props: { id: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [changes, setChanges] = useState<
		Awaited<ReturnType<typeof getChanges>>
	>([]);
	const [parsedCsv] = useAtom(parsedCsvAtom);
	const [uniqueColumnIndex] = useAtom(uniqueColumnIndexAtom);

	useEffect(() => {
		if (isOpen) {
			getChanges(lix, props.id, activeFile.id).then(setChanges);
			const interval = setInterval(async () => {
				getChanges(lix, props.id, activeFile.id).then(setChanges);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [lix, activeFile, props.id]);

	return (
		<div
			className={clsx(
				"flex flex-col cursor-pointer group bg-white hover:bg-zinc-50",
				isOpen && "bg-white!"
			)}
			onClick={() => setIsOpen(!isOpen)}
		>
			<div className="flex gap-3 items-center">
				<div className="w-5 h-5 bg-zinc-100 flex items-center justify-center rounded-full ml-4">
					<div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
				</div>
				<div className="flex-1 flex gap-2 items-center justify-between py-3 rounded md:h-[46px]">
					<div className="flex flex-col md:flex-row md:gap-2 md:items-center flex-1">
						<p className="text-zinc-950 text-sm! font-semibold">
							By TODO (add author)
						</p>
						<p className="text-sm! text-zinc-600">
							By TODO (add discussion)
							{/* {props.commit.description} */}
						</p>
					</div>
					<p className="text-sm! pr-5 flex items-center gap-4 flex-1]">
						{/* {timeAgo(change.created_at)} */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
							className="text-zinc-600"
						>
							<path
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="m4 9l8 8l8-8"
							/>
						</svg>
					</p>
				</div>
			</div>
			<div className={clsx(isOpen ? "block" : "hidden")}>
				<div className="flex flex-col gap-2 px-3 pb-3">
					{changes.map((change) => {
						// TODO: when importing new file one change contains every change of a row. When doing manual change, it contains more changes that belong to one row -> so do the grouping here when needed
						return (
							<div
								key={change.id}
								className="bg-zinc-50 border border-zinc-200 rounded-md pt-2 px-3 pb-4"
							>
								<div className="flex flex-wrap md:flex-nowrap overflow-x-scroll gap-x-1 gap-y-2 md:gap-y-8">
									<div className="flex md:flex-col items-center w-full md:w-auto">
										<p className="hidden md:block text-zinc-500 md:py-1.5 w-[140px] line-clamp-1 whitespace-nowrap text-[14px]">
											UNIQUE VALUE
										</p>
										<p className="md:px-4 md:py-1.5 md:bg-white md:border border-zinc-200 md:w-[140px] rounded-full md:mr-4 overflow-hidden whitespace-nowrap text-ellipsis">
											{uniqueColumnIndex ? (
												<>
													{change.content?.text.split(",")[uniqueColumnIndex]}
												</>
											) : (
												<>ERROR NO UNIQUE COLUMN</>
											)}
										</p>
									</div>
									{parsedCsv.meta.fields?.map((column: string) => {
										const columnIndex = parsedCsv.meta.fields?.indexOf(column);
										const value = columnIndex
											? change.content?.text.split(",")[columnIndex]
											: undefined;
										const parentValue = columnIndex
											? change.parent?.content?.text.split(",")[columnIndex]
											: undefined;

										return (
											<div
												key={column}
												className="flex md:flex-col flex-wrap md:flex-nowrap items-center w-full md:w-auto"
											>
												<p className="text-zinc-500 py-1 md:py-1.5 w-full md:w-[140px] uppercase text-[14px] overflow-hidden whitespace-nowrap text-ellipsis">
													{column}
												</p>
												{value ? (
													// insert or update
													<p className="px-3 py-1.5 bg-white border border-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
														{value}
													</p>
												) : (
													// deletion
													<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
												)}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="18"
													height="18"
													viewBox="0 0 24 24"
													className="text-zinc-400 m-1 -rotate-90 md:rotate-0"
												>
													<path
														fill="currentColor"
														d="M11 20h2V8l5.5 5.5l1.42-1.42L12 4.16l-7.92 7.92L5.5 13.5L11 8z"
													/>
												</svg>
												{parentValue ? (
													// insert or update
													<p className="px-3 py-1.5 bg-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
														{parentValue}
													</p>
												) : (
													// non-existent
													<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
