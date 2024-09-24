import { Change, Commit, isInSimulatedCurrentBranch } from "@lix-js/sdk";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { projectAtom, uniqueColumnAtom } from "../state.ts";
import timeAgo from "../helper/timeAgo.ts";
import clsx from "clsx";
import { SlTooltip } from "@shoelace-style/shoelace/dist/react";

export const HistoryEntry = (props: { commit: Commit }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [project] = useAtom(projectAtom);
	const [uniqueColumn] = useAtom(uniqueColumnAtom);
	const [changeHistory, setChangeHistory] = useState(
		[] as { current: Change; previous: Change | null }[]
	);

	const getCommitRelatedChanges = async () => {
		const changes = await project?.db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "=", props.commit.id)
			.execute();

		if (changes) {
			const history = [];
			for (const change of changes) {
				const previousChange = await project?.db
					.selectFrom("change")
					.selectAll()
					.where("change.type", "=", "row")
					.where(
						(eb) => eb.ref("value", "->>").key(uniqueColumn),
						"=",
						change.value?.[uniqueColumn]
					)
					.where("change.created_at", "<", change.created_at)
					.innerJoin("commit", "commit.id", "change.commit_id")
					// TODO remove after branching concept on lix
					// https://linear.app/opral/issue/LIX-126/branching
					.where(isInSimulatedCurrentBranch)
					.orderBy("commit.created_at", "desc")
					.executeTakeFirst();

				//console.log("previousChange", previousChange);

				history.push({ current: change, previous: previousChange });
			}
			setChangeHistory(
				history as { current: Change; previous: Change | null }[]
			);
		}
	};

	useEffect(() => {
		if (isOpen) {
			getCommitRelatedChanges();
			const interval = setInterval(async () => {
				await getCommitRelatedChanges();
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [isOpen]);

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
							By {props.commit.author}
						</p>
						<p className="text-sm! text-zinc-600">{props.commit.description}</p>
					</div>
					<p className="text-sm! pr-5 flex items-center gap-4 flex-1]">
						{timeAgo(props.commit.created_at)}
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
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="m4 9l8 8l8-8"
							/>
						</svg>
					</p>
				</div>
			</div>
			<div className={clsx(isOpen ? "block" : "hidden")}>
				<div className="flex flex-col gap-2 px-3 pb-3">
					{changeHistory.map((change) => {
						// TODO: when importing new file one change contains every change of a row. When doing manual change, it contains more changes that belong to one row -> so do the grouping here when needed
						return (
							<div
								key={change.current.id}
								className="bg-zinc-50 border border-zinc-200 rounded-md pt-2 px-3 pb-4"
							>
								<div className="flex flex-wrap md:flex-nowrap overflow-x-scroll gap-x-1 gap-y-2 md:gap-y-8">
									<div
										key={"id"}
										className="flex md:flex-col items-center w-full md:w-auto"
									>
										<p className="hidden md:block text-zinc-500 md:py-1.5 w-[140px] line-clamp-1 whitespace-nowrap text-[14px]">
											{"UNIQUE VALUE"}
										</p>
										<SlTooltip content={change.current?.value?.[uniqueColumn]}>
											<p className="md:px-4 md:py-1.5 md:bg-white md:border border-zinc-200 md:w-[140px] rounded-full md:mr-4 overflow-hidden whitespace-nowrap text-ellipsis">
												{change.current?.value?.[uniqueColumn]}
											</p>
										</SlTooltip>
									</div>
									{change.current.meta?.col_name.map((changed_col: string) => {
										if (changed_col) {
											return (
												<div
													key={changed_col}
													className="flex md:flex-col flex-wrap md:flex-nowrap items-center w-full md:w-auto"
												>
													<SlTooltip content={changed_col}>
														<p className="text-zinc-500 py-1 md:py-1.5 w-full md:w-[140px] uppercase text-[14px] overflow-hidden whitespace-nowrap text-ellipsis">
															{changed_col}
														</p>
													</SlTooltip>
													{change.current.value?.[changed_col] ? (
														<SlTooltip
															content={change.current.value?.[changed_col]}
														>
															<p className="px-3 py-1.5 bg-white border border-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
																{change.current.value?.[changed_col]}
															</p>
														</SlTooltip>
													) : (
														<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
													)}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="18"
														height="18"
														viewBox="0 0 24 24"
														rotate="180deg"
														className="text-zinc-400 m-1 -rotate-90 md:rotate-0"
													>
														<path
															fill="currentColor"
															d="M11 20h2V8l5.5 5.5l1.42-1.42L12 4.16l-7.92 7.92L5.5 13.5L11 8z"
														/>
													</svg>
													{change.previous?.value?.[changed_col] ? (
														<SlTooltip
															content={change.previous.value?.[changed_col]}
														>
															<p className="px-3 py-1.5 bg-zinc-200 flex-1 md:w-[140px] overflow-hidden whitespace-nowrap text-ellipsis">
																{change.previous.value?.[changed_col]}
															</p>
														</SlTooltip>
													) : (
														<p className="px-3 py-1.5 min-h-[38px] bg-zinc-100 border border-zinc-400 border-dashed flex-1 md:w-[140px]"></p>
													)}
												</div>
											);
										}
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
